import { createApp } from "./app.js";
import { connectDb } from "./db.js";
import { config } from "./config.js";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

main().catch((error) => {
  console.error("[server] failed to start:", error);
  process.exit(1);
});
