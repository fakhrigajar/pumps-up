import "dotenv/config";

/**
 * Every environment variable the server needs, read and checked once at
 * startup rather than reached for by name all over the codebase — a missing
 * `MONGODB_URI` should fail loudly the moment the process starts, not the
 * first time somebody happens to hit a route that needs it.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`,
    );
  }
  return value;
}

export const config = {
  mongodbUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  cookieName: process.env.COOKIE_NAME || "pumpsup_token",
  isProduction: process.env.NODE_ENV === "production",
};
