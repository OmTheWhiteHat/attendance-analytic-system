import nano from 'nano';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();
const COUCHDB_URL = serverRuntimeConfig.COUCHDB_URL;
const DB_NAME = 'smartattend'; // Define the database name as a constant

if (!COUCHDB_URL) {
  throw new Error(
    'Please define the COUCHDB_URL environment variable and expose it in serverRuntimeConfig in next.config.js'
  );
}

let cached = global.couchdb;

if (!cached) {
  cached = global.couchdb = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const nanoInstance = nano(COUCHDB_URL);
      
      // Check if the database exists and create it if it doesn't.
      try {
        const dbList = await nanoInstance.db.list();
        if (!dbList.includes(DB_NAME)) {
          console.log(`Database '${DB_NAME}' not found. Creating it...`);
          await nanoInstance.db.create(DB_NAME);
          console.log(`Database '${DB_NAME}' created successfully.`);
        }
      } catch (e) {
        console.error("CouchDB setup error:", e);
        throw new Error("Could not connect to or create the database.");
      }
      
      return nanoInstance;
    })();
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
