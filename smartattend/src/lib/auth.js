import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from './database';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Admin from '../models/Admin';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: {  label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        await dbConnect();

        let user = null;

        if (credentials.role === 'student') {
          user = await Student.findOne({ email: credentials.email }).select('+password');
        } else if (credentials.role === 'teacher') {
          user = await Teacher.findOne({ email: credentials.email }).select('+password');
        } else if (credentials.role === 'admin') {
          user = await Admin.findOne({ email: credentials.email }).select('+password');
        }

        if (!user) {
          throw new Error('No user found with this email for the selected role');
        }

        const isPasswordMatched = await user.matchPassword(credentials.password);

        if (!isPasswordMatched) {
          throw new Error('Incorrect password');
        }

        // Ensure the user's role matches the role they are trying to log in as
        // This is a redundant check if the findOne is already role-specific, but good for safety
        if (user.role && user.role !== credentials.role) {
          throw new Error(`You are not authorized to log in as a ${credentials.role}`);
        }

        return { id: user._id.toString(), email: user.email, name: user.name, role: credentials.role };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);