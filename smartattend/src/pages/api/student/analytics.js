import dbConnect from '../../../lib/database';
import Attendance from '../../../models/Attendance';
import Session from '../../../models/Session';
import Student from '../../../models/Student';
import Course from '../../../models/Course';
import mongoose from 'mongoose';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

export default async function handler(req, res) {
  const user = await getAuthenticatedUser({ req });

  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    const studentId = new mongoose.Types.ObjectId(user._id);

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
    const leaderboard = await Student.aggregate([
        { $match: { } }, // Match all students
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
    const allStudentsRanked = await Student.aggregate([
        { $match: { } }, // Match all students
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

    // 5. Calculate consecutive session streak
    const allSessionsForStudent = await Session.find({ course: { $in: courseIds } }).sort({ startTime: -1 });
    const attendedSessionRecords = await Attendance.find({ student: studentId }).select('session');
    const attendedSessionIds = new Set(attendedSessionRecords.map(a => a.session.toString()));

    let streak = 0;
    for (const session of allSessionsForStudent) {
        if (attendedSessionIds.has(session._id.toString())) {
            streak++;
        } else {
            // Break the loop as soon as a missed session is found
            break;
        }
    }

    // 6. Get personal status breakdown (present vs. late)
    const statusBreakdown = await Attendance.aggregate([
        { $match: { student: studentId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 7. Get attendance history for the last 20 sessions
    const historySessions = allSessionsForStudent.slice(0, 20).reverse(); // Oldest first
    const attendanceHistory = historySessions.map(session => {
        return {
            sessionName: `${session.course.name} - ${new Date(session.startTime).toLocaleDateString()}`,
            attended: attendedSessionIds.has(session._id.toString()),
        }
    });

    res.status(200).json({
      attendanceScore,
      rank,
      streak,
      todaysAttendance, // Array of { course: { name: ... }, timestamp: ... }
      leaderboard, // Array of { _id, name, attendanceCount }
      statusBreakdown,
      attendanceHistory,
    });

  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}