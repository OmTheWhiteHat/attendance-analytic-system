import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "../../../lib/couchdb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // ✅ Proper session check for API route
  const session = await getServerSession(req, res, authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.email ||
    session.user.role !== "student"
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { rollNo, registrationNo, section, branch, faceDescriptor } = req.body;

  if (!rollNo || !registrationNo || !section || !branch) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use("smartattend");
    const studentId = `user:${session.user.email}`;

    const existingDoc = await db.get(studentId);

    const updatedDoc = {
      ...existingDoc,
      rollNo,
      registrationNo,
      section,
      branch,
      faceDescriptor: faceDescriptor || existingDoc.faceDescriptor,
      onboardingComplete: true,
    };

    await db.insert(updatedDoc);

    return res
      .status(200)
      .json({ message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Onboarding error:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
