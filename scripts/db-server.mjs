import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "prisma/pgdata");
const db = await PGlite.create(dataDir);

const server = new PGLiteSocketServer({
  db,
  port: 5432,
  host: "127.0.0.1",
});

await server.start();
console.log("PGlite PostgreSQL server running on 127.0.0.1:5432");

const shutdown = async () => {
  try {
    await server.stop();
  } catch {
    // Ignore
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
