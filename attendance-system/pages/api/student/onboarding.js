
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

  const { rollNo, registrationNo } = req.body;

  if (!rollNo || !registrationNo) {
    return res.status(400).json({ message: 'Roll number and registration number are required' });
  }

  await dbConnect();

  try {
    await User.findByIdAndUpdate(session.user.id, {
      rollNo,
      registrationNo,
      onboardingComplete: true, // Mark onboarding as complete
    });

    res.status(200).json({ message: 'Profile details saved successfully' });

  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
