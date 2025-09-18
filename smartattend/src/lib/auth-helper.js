import { getSession } from 'next-auth/react';
import { getAuth } from '@clerk/nextjs/server';
import dbConnect from './database';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Admin from '../models/Admin';

// Helper function for getServerSideProps and API routes
export async function getAuthenticatedUser(context) {
  await dbConnect();
  let user = null;

  // 1. Try next-auth session (for manual students, teachers, admins)
  const nextAuthSession = await getSession(context);
  if (nextAuthSession && nextAuthSession.user && nextAuthSession.user.role) {
    const { id, role } = nextAuthSession.user;
    if (role === 'student') {
      user = await Student.findById(id).lean();
    } else if (role === 'teacher') {
      user = await Teacher.findById(id).lean();
    } else if (role === 'admin') {
      user = await Admin.findById(id).lean();
    }
    if (user) return { ...user, role }; // Return user with their role
  }

  // 2. If not found via next-auth, try Clerk session (for Google students)
  const { userId: clerkUserId } = getAuth(context.req);
  if (clerkUserId) {
    user = await Student.findOne({ clerkId: clerkUserId }).lean();
    if (user) return { ...user, role: 'student' }; // Clerk users are students
  }

  return null; // No authenticated user found
}