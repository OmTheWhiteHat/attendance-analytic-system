import { getSession } from 'next-auth/react';
import { getAuth } from '@clerk/nextjs/server';
import dbConnect from './couchdb'; // Use the new couchdb connection

/**
 * A unified helper function to get the authenticated user's full profile 
 * from CouchDB, regardless of the authentication method (Clerk or NextAuth).
 * To be used in getServerSideProps and API routes.
 * @param {object} context - The context object from getServerSideProps or an object with { req }.
 * @returns {object|null} - The user document from CouchDB or null if not found/authenticated.
 */
export async function getAuthenticatedUser(context) {
  const nano = await dbConnect();
  const db = nano.db.use('smartattend');

  // 1. Check for a NextAuth session first
  const nextAuthSession = await getSession({ req: context.req });
  if (nextAuthSession && nextAuthSession.user && nextAuthSession.user.email) {
    try {
      const userId = `user:${nextAuthSession.user.email}`;
      const user = await db.get(userId);
      return user; // Success: return the user
    } catch (error) {
      if (error.statusCode !== 404) console.error("NextAuth auth helper error:", error);
      // On error, explicitly return null before proceeding.
      return null; 
    }
  }

// 2. If no NextAuth session, check for a Clerk session
  try {
    const { userId: clerkId } = getAuth(context.req);
    if (clerkId) {
      const studentId = `user:${clerkId}`;
      try {
        const user = await db.get(studentId);
        return user; // Success: return the Clerk user
      } catch (dbError) {
        if (dbError.statusCode !== 404) console.error("Clerk DB error:", dbError);
        return null; // Explicitly return null on DB error
      }
    }
  } catch (authError) {
    if (!authError.message.includes('clerkMiddleware')) {
      console.error("Clerk auth helper error:", authError);
    }
  }

  return null; // Explicitly return null if no user was found
}