import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

// 1. Pre-create nested build directories to prevent Windows EPERM race condition
const dirs = [
  ".next/server/app/api/auth",
  ".next/server/app/candidate/jobs",
  ".next/server/app/dashboard/jobs",
  ".next/static/chunks/app/candidate/jobs",
  ".next/static/chunks/app/dashboard/jobs",
];

for (const dir of dirs) {
  try {
    fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
  } catch {
    // Ignore if directory already exists
  }
}

// 2. Ensure local database service is active on port 5432 (local development only)
if (!process.env.VERCEL && !process.env.CI) {
  function isPortOpen(port, host = "127.0.0.1") {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("error", () => {
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  const isDbUp = await isPortOpen(5432);
  if (!isDbUp) {
    console.log("Starting local PostgreSQL database service on 127.0.0.1:5432...");
    const dbProcess = spawn("node", [path.resolve(process.cwd(), "scripts/db-server.mjs")], {
      detached: true,
      stdio: "ignore",
    });
    dbProcess.unref();

    // Wait briefly for server to bind
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (await isPortOpen(5432)) {
        console.log("Local PostgreSQL database is ready on 127.0.0.1:5432.");
        break;
      }
    }
  }
}
