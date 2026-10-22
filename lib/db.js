import mongoose from "mongoose";
let cache = (globalThis.__mongo ||= { connection: null, promise: null });
export async function db() {
  if (cache.connection && cache.connection.connection.readyState === 1)
    return cache.connection;
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is not configured");
  cache.promise ||= mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });
  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
}
export async function transaction(fn) {
  await db();
  return mongoose.connection.transaction(fn);
}
