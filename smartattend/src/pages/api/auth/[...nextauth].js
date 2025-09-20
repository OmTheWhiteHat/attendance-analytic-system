import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../lib/couchdb";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // student | teacher | admin
      },
      async authorize(credentials) {
        if (
          !credentials ||
          !credentials.email ||
          !credentials.password ||
          !credentials.role
        ) {
          throw new Error("Missing credentials");
        }

        if (!["student", "teacher", "admin"].includes(credentials.role)) {
          throw new Error("Invalid role for credential-based login");
        }

        try {
          // connect to CouchDB
          const nano = await dbConnect();
          const db = nano.db.use("smartattend");

          const userId = `user:${credentials.email}`;
          const userDoc = await db.get(userId);

          // 1. Check if user exists and role matches
          if (!userDoc || userDoc.role !== credentials.role) {
            throw new Error(
              "No user found with this email for the selected role"
            );
          }

          // 2. Validate password
          const isPasswordMatched = await bcrypt.compare(
            credentials.password,
            userDoc.password
          );
          if (!isPasswordMatched) {
            throw new Error("Incorrect password");
          }

          // 3. Return safe user object
          return {
            id: userDoc._id,
            email: userDoc.email,
            name: userDoc.name,
            role: userDoc.role,
          };
        } catch (error) {
          if (error.statusCode === 404) {
            throw new Error(
              "No user found with this email for the selected role"
            );
          }
          console.error("Authorize error:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
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
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.accessToken = token;
      return session;
    },
  },

  pages: {
    signIn: "/login", // custom login page
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
