import { MongoClient, Db } from 'mongodb';

// NOTE: do not read or throw on MONGODB_URI at module import time.
// This file may be imported before dotenv runs (for example when the
// script loads), which would cause an immediate crash. Instead, read
// process.env inside connectDB() and throw there if missing.

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedConnection {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongodb: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongodb || { client: null, db: null, promise: null };

if (!global.mongodb) {
  global.mongodb = cached;
}

async function connectDB(): Promise<{ client: MongoClient; db: Db }> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  console.log('Connecting to MongoDB...', MONGODB_URI);
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
      // If the URI does not include a database name, client.db() will
      // default to the admin database. Prefer explicit DB in the URI.
      const db = client.db();
      console.log('✅ MongoDB connected successfully');
      return { client, db };
    });
  }

  try {
    const result = await cached.promise;
    cached.client = result.client;
    cached.db = result.db;
    return result;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', e);
    throw e;
  }
}

export default connectDB;
