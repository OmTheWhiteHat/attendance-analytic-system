
import dbConnect from '../../../lib/database';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student', // New users are always students
    });

    res.status(201).json({ message: 'User created successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
