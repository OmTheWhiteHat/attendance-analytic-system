
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Course from '../../../models/Course';
import Attendance from '../../../models/Attendance';
import Session from '../../../models/Session';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || nextAuthSession.user.role !== 'teacher') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    const teacherId = new mongoose.Types.ObjectId(nextAuthSession.user.id);

    // 1. Find courses taught by this teacher
    const courses = await Course.find({ teacher: teacherId }).populate('students');
    if (!courses.length) {
        return res.status(200).json({ attendanceByCourse: [], atRiskStudents: [] });
    }
    const courseIds = courses.map(c => c._id);

    // 2. Calculate attendance data for each course
    const attendanceByCourse = await Session.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
            $lookup: {
                from: 'attendances',
                localField: '_id',
                foreignField: 'session',
                as: 'attendanceRecords'
            }
        },
        {
            $project: {
                course: 1,
                presentCount: { $size: '$attendanceRecords' }
            }
        },
        {
            $group: {
                _id: '$course',
                totalPresent: { $sum: '$presentCount' },
                totalSessions: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'courses',
                localField: '_id',
                foreignField: '_id',
                as: 'courseDetails'
            }
        },
        { $unwind: '$courseDetails' },
        {
            $project: {
                courseName: '$courseDetails.name',
                presentCount: '$totalPresent',
                totalStudentsInCourse: { $size: '$courseDetails.students' },
                totalSessions: '$totalSessions'
            }
        }
    ]);

    // 3. Identify at-risk students (e.g., < 75% attendance)
    let atRiskStudents = [];
    for (const course of courses) {
        const totalSessionsInCourse = await Session.countDocuments({ course: course._id });
        if (totalSessionsInCourse === 0) continue;

        for (const student of course.students) {
            const attendedCount = await Attendance.countDocuments({ student: student._id, course: course._id });
            const attendanceRate = (attendedCount / totalSessionsInCourse) * 100;

            if (attendanceRate < 75) {
                atRiskStudents.push({
                    studentName: student.name,
                    studentEmail: student.email,
                    courseName: course.name,
                    attendanceRate: attendanceRate.toFixed(1)
                });
            }
        }
    }

    // 4. Get breakdown of present vs. late
    const statusBreakdown = await Attendance.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({ attendanceByCourse, atRiskStudents, statusBreakdown });

  } catch (error) {
    console.error('Error fetching teacher analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
