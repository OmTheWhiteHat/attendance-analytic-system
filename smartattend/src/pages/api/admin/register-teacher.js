import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Teacher from '../../../models/Teacher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const existingTeacher = await Teacher.findOne({ email });

    if (existingTeacher) {
      return res.status(409).json({ message: 'Teacher with this email already exists' });
    }

    const teacher = await Teacher.create({
      name,
      email,
      password,
      role: 'teacher', // Admin is registering a teacher
    });

    res.status(201).json({ message: 'Teacher registered successfully', teacherId: teacher._id });

  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}