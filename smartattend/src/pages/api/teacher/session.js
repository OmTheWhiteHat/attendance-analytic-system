import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/couchdb';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || !nextAuthSession.user || nextAuthSession.user.role !== 'teacher') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { courseId, duration } = req.body; // e.g., courseId: "course:CS101"

  if (!courseId || !duration) {
    return res.status(400).json({ message: 'Missing course ID or duration' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const teacherId = nextAuthSession.user.id;

    // 1. Verify the teacher is assigned to the course
    const courseDoc = await db.get(courseId);
    if (!courseDoc || courseDoc.teacherId !== teacherId) {
      return res.status(403).json({ message: 'You are not the teacher of this course' });
    }

    // 2. Create the new session document
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + parseInt(duration, 10) * 60000); // duration in minutes
    const uniquePart = randomBytes(8).toString('hex');
    const sessionId = `session:${courseId.split(':')[1]}_${startTime.toISOString()}_${uniquePart}`;
    
    // Capture teacher's IP for proximity checks
    const teacherIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newSessionDoc = {
      _id: sessionId,
      type: 'session',
      teacherId: teacherId,
      courseId: courseId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'active',
      networkInfo: {
        ipAddress: teacherIp,
      },
    };

    await db.insert(newSessionDoc);

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: newSessionDoc._id, // This is the manual code
      endTime: newSessionDoc.endTime,
    });

  } catch (error) {
    console.error('Error creating session:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}