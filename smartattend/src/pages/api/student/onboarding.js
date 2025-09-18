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

  const { rollNo, registrationNo, section, branch } = req.body;

  if (!rollNo || !registrationNo || !section || !branch) {
    return res.status(400).json({ message: 'Roll number, registration number, section, and branch are required' });
  }

  await dbConnect();

  try {
    await Student.findByIdAndUpdate(user._id, {
      rollNo,
      registrationNo,
      section,
      branch,
      onboardingComplete: true, // Mark onboarding as complete
    });

    res.status(200).json({ message: 'Profile details saved successfully' });

  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}