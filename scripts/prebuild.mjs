import fs from "node:fs";
import path from "node:path";

// Pre-create nested build directories to prevent Windows EPERM race condition
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
