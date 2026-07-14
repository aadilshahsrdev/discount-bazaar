import mongoose, { type Connection } from "mongoose";

/**
 * Establishes a single shared Mongoose connection to MongoDB.
 *
 * The connection string is read from MONGODB_URI. Connection options lean on
 * Mongoose 8 defaults (autoIndex in dev, server selection timeout) so we only
 * override what the project actually needs.
 */
export async function connectDB(): Promise<Connection> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in the environment.");
  }

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.info(`[mongo] connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[mongo] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[mongo] disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  return mongoose.connection;
}

/** Graceful shutdown helper — close the connection on SIGINT/SIGTERM. */
export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
}
