import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Session from '../../../models/Session';
import Course from '../../../models/Course';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || nextAuthSession.user.role !== 'teacher') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  const { courseId, duration } = req.body;

  if (!courseId || !duration) {
    return res.status(400).json({ message: 'Missing course ID or duration' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course || course.teacher.toString() !== nextAuthSession.user.id) {
      return res.status(403).json({ message: 'You are not the teacher of this course' });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000); // duration in minutes
    const sessionKey = randomBytes(16).toString('hex');
    const teacherIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newSession = new Session({
      course: courseId,
      teacher: nextAuthSession.user.id,
      startTime,
      endTime,
      sessionKey,
      teacherIp,
    });

    await newSession.save();

    res.status(201).json({
      message: 'Session created successfully',
      sessionKey: newSession.sessionKey,
      endTime: newSession.endTime,
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}