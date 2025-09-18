
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session || session.user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  await dbConnect();

  try {
    await User.findByIdAndUpdate(session.user.id, { profileImageUrl: imageUrl });
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
