import { getSession } from 'next-auth/react';
import dbConnect from './couchdb';

/**
 * A dedicated, streamlined helper for API routes secured by NextAuth.
 * It validates the NextAuth session and fetches the full user document.
 * This avoids any potential conflicts with Clerk's authentication.
 * @param {object} req - The Next.js API route request object.
 * @returns {object|null} - The full user document or null if unauthorized.
 */
export async function getApiAuthenticatedUser(req) {
  const session = await getSession({ req });

  if (!session || !session.user || !session.user.email) {
    return null; // No valid NextAuth session found
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const userId = `user:${session.user.email}`;
    const user = await db.get(userId);
    return user;
  } catch (error) {
    console.error("API Helper DB Error:", error);
    return null;
  }
}