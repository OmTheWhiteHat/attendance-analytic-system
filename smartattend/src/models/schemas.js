// This file is for reference purposes and does not execute.
// It outlines the expected JSON structures for documents in CouchDB.

// Using one database named "smartattend" with a "type" field to differentiate documents.

// 1. User Document
const User = {
  _id: "user:email@example.com", // For teachers/admins
  // _id: "user:clerk_user_id", // For students
  type: "user",
  email: "email@example.com",
  name: "Full Name",
  role: "student" | "teacher" | "admin",
  password: "hashed_password", // Only for teacher/admin
  clerkId: "clerk_user_id_xyz", // Only for students, links to Clerk auth
  faceDescriptor: [], // Array of numbers for face-api.js
  courses: ["course:CS101", "course:PHY203"] // Array of course IDs
};

// 2. Session Document
const Session = {
  _id: "session:unique_session_id", // e.g., session:CS101_2025-09-20T10:00:00Z
  type: "session",
  teacherId: "user:teacher@example.com",
  courseId: "course:CS101",
  startTime: "ISO_Date_String",
  endTime: "ISO_Date_String",
  status: "active" | "closed",
  networkInfo: { // For proximity checks
    ipAddress: "teacher_ip_address"
  }
};

// 3. Attendance Record Document
const Attendance = {
  _id: "attendance:user_id:session_id", // Ensures a student can only attend once per session
  type: "attendance",
  studentId: "user:student_clerk_id",
  sessionId: "session:unique_session_id",
  timestamp: "ISO_Date_String",
  method: "qr" | "facial" | "proximity"
};

// 4. Course Document
const Course = {
  _id: "course:CS101",
  type: "course",
  name: "Introduction to Computer Science",
  teacherId: "user:teacher@example.com"
};
