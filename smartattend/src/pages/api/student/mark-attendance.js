import { getAuth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/couchdb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId: clerkId } = getAuth(req);

  if (!clerkId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { sessionId, method } = req.body;

  if (!sessionId || !method) {
    return res.status(400).json({ message: 'Missing sessionId or method' });
  }

  if (!['qr', 'facial', 'proximity'].includes(method)) {
    return res.status(400).json({ message: 'Invalid attendance method' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const studentId = `user:${clerkId}`;

    // 1. Fetch the session to validate it
    const sessionDoc = await db.get(sessionId);

    if (sessionDoc.status !== 'active') {
      return res.status(403).json({ message: 'This session is not active' });
    }

    const now = new Date();
    if (new Date(sessionDoc.endTime) < now) {
      // Optional: You could also have a cron job to close sessions
      return res.status(403).json({ message: 'This session has ended' });
    }

    // 2. Proximity Check (if applicable)
    if (method === 'proximity') {
      const studentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const teacherIp = sessionDoc.networkInfo.ipAddress;
      if (studentIp !== teacherIp) {
        return res.status(403).json({ message: 'Proximity check failed. You must be on the same network as the teacher.' });
      }
    }

    // 3. Check if attendance is already marked to prevent duplicates
    const attendanceId = `attendance:${studentId}:${sessionId}`;
    try {
      await db.get(attendanceId);
      // If the above line does not throw, it means the document exists
      return res.status(409).json({ message: 'Attendance already marked for this session' });
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error; // Re-throw if it's not a 'not found' error
      }
      // If 404, the attendance does not exist, so we can proceed.
    }

    // 4. Create the attendance record
    const attendanceDoc = {
      _id: attendanceId,
      type: 'attendance',
      studentId: studentId,
      sessionId: sessionId,
      timestamp: now.toISOString(),
      method: method,
    };

    await db.insert(attendanceDoc);

    res.status(201).json({ message: 'Attendance marked successfully' });

  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
