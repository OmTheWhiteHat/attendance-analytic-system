import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/couchdb'; // Updated import
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  // Simple check for admin role, you might have a more robust system
  if (!session || !session.user || session.user.email !== 'admin@example.com') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend'); // Assuming your database name is 'smartattend'
    const teacherId = `user:${email}`;

    // Check if teacher already exists
    try {
      await db.get(teacherId);
      return res.status(409).json({ message: 'Teacher with this email already exists' });
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error; // Re-throw if it's not a 'not found' error
      }
      // If 404, the user does not exist, so we can proceed.
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const teacherDoc = {
      _id: teacherId,
      type: 'user',
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
    };

    const response = await db.insert(teacherDoc);

    res.status(201).json({ message: 'Teacher registered successfully', teacherId: response.id });

  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}