import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongodbUri);
  const { host, name } = mongoose.connection;
  console.log(`[db] connected to ${host}/${name}`);
  return mongoose.connection;
}
