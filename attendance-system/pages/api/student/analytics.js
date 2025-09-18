
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Attendance from '../../../models/Attendance';
import Session from '../../../models/Session';
import User from '../../../models/User';
import Course from '../../../models/Course';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || nextAuthSession.user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    const studentId = new mongoose.Types.ObjectId(nextAuthSession.user.id);

    // 1. Get courses the student is enrolled in
    const studentCourses = await Course.find({ students: studentId }).select('_id');
    const courseIds = studentCourses.map(c => c._id);

    // 2. Calculate overall attendance score
    const totalSessionsForStudent = await Session.countDocuments({ course: { $in: courseIds } });
    const attendedSessionsCount = await Attendance.countDocuments({ student: studentId });
    const attendanceScore = totalSessionsForStudent > 0 
      ? ((attendedSessionsCount / totalSessionsForStudent) * 100).toFixed(1) 
      : 0;

    // 3. Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAttendance = await Attendance.find({
      student: studentId,
      timestamp: { $gte: today, $lt: tomorrow },
    }).populate({ path: 'course', select: 'name' });

    // 4. Leaderboard Ranking (this is a heavy operation)
    const leaderboard = await User.aggregate([
        { $match: { role: 'student' } },
        {
            $lookup: {
                from: 'attendances',
                localField: '_id',
                foreignField: 'student',
                as: 'attendanceRecords'
            }
        },
        {
            $project: {
                name: 1,
                attendanceCount: { $size: '$attendanceRecords' }
            }
        },
        { $sort: { attendanceCount: -1 } },
        { $limit: 10 } // Top 10 students
    ]);

    // Find current student's rank
    const allStudentsRanked = await User.aggregate([
        { $match: { role: 'student' } },
        { 
            $lookup: {
                from: 'attendances',
                localField: '_id',
                foreignField: 'student',
                as: 'attendanceRecords'
            }
        },
        { $addFields: { attendanceCount: { $size: "$attendanceRecords" } } },
        { $sort: { attendanceCount: -1 } },
        { 
            $group: {
                _id: null,
                students: { $push: { _id: "$_id", name: "$name" } }
            }
        },
        { 
            $unwind: {
                path: "$students",
                includeArrayIndex: "rank"
            }
        },
        { $match: { "students._id": studentId } }
    ]);

    const rank = allStudentsRanked.length > 0 ? allStudentsRanked[0].rank + 1 : 'N/A';

    res.status(200).json({
      attendanceScore,
      rank,
      todaysAttendance, // Array of { course: { name: ... }, timestamp: ... }
      leaderboard, // Array of { _id, name, attendanceCount }
    });

  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
