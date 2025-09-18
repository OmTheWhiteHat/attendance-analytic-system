
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Session from '../../../models/Session';
import Attendance from '../../../models/Attendance';
import Course from '../../../models/Course';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || nextAuthSession.user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  const { sessionKey, method } = req.body;

  if (!sessionKey) {
    return res.status(400).json({ message: 'Missing session key' });
  }

  try {
    const studentId = nextAuthSession.user.id;

    // Find the active session
    const activeSession = await Session.findOne({ 
      sessionKey, 
      status: 'active',
      endTime: { $gt: new Date() } // Check if session is not expired
    }).populate('course');

    if (!activeSession) {
      return res.status(404).json({ message: 'Active session not found or has expired.' });
    }

    // Proximity Check: Compare student's IP with teacher's IP
    const studentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (activeSession.teacherIp !== studentIp) {
        return res.status(403).json({ message: 'Proximity check failed. You must be on the same network as the teacher.' });
    }

    // Check if student is already marked for this session
    const existingAttendance = await Attendance.findOne({
      session: activeSession._id,
      student: studentId,
    });

    if (existingAttendance) {
      return res.status(409).json({ message: 'You have already been marked present.' });
    }

    // Create the attendance record
    const newAttendance = new Attendance({
      session: activeSession._id,
      student: studentId,
      course: activeSession.course._id,
      method: method || 'qr-proximity', // Use method from body, default to qr-proximity
    });

    await newAttendance.save();

    res.status(201).json({
      message: 'Attendance recorded successfully',
      courseName: activeSession.course.name,
    });

  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
