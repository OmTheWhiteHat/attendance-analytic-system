import dbConnect from '../../../lib/database';
import Student from '../../../models/Student';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const user = await getAuthenticatedUser({ req });

  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  await dbConnect();

  try {
    await Student.findByIdAndUpdate(user._id, { profileImageUrl: imageUrl });
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}