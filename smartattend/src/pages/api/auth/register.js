import dbConnect from '../../../lib/couchdb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const studentId = `user:${email}`;

    try {
      await db.get(studentId);
      return res.status(409).json({ message: 'User with this email already exists' });
    } catch (error) {
      if (error.statusCode !== 404) throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    const studentDoc = {
      _id: studentId,
      type: 'user',
      role: 'student',
      firstName,
      lastName,
      name,
      email,
      password: hashedPassword,
      onboardingComplete: false,
      status: 'pending', // New accounts require admin approval
    };

    await db.insert(studentDoc);

    res.status(201).json({ message: 'Student registered successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
