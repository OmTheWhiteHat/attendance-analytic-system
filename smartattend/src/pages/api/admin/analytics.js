import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/database';
import Student from '../../../models/Student';
import Teacher from '../../../models/Teacher';
import Course from '../../../models/Course';
import Attendance from '../../../models/Attendance';
import Session from '../../../models/Session';

export default async function handler(req, res) {
  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || nextAuthSession.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    // 1. Get total counts
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalCourses = await Course.countDocuments();

    // 2. Calculate attendance by course using aggregation
    const attendanceByCourse = await Attendance.aggregate([
      {
        $group: {
          _id: '$course',
          presentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'courses', // The actual collection name
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $unwind: '$courseDetails',
      },
      {
        $project: {
          courseName: '$courseDetails.name',
          presentCount: '$presentCount',
          totalStudentsInCourse: { $size: '$courseDetails.students' },
        },
      },
    ]);

    // 3. Calculate overall attendance rate
    const totalSessions = await Session.countDocuments();
    // This calculation needs to be more precise, considering only enrolled students
    // For simplicity, let's use total students * total sessions as a max possible
    const totalPossibleAttendances = totalStudents * totalSessions; 
    const totalActualAttendances = await Attendance.countDocuments();
    const overallAttendanceRate = totalPossibleAttendances > 0 
      ? ((totalActualAttendances / totalPossibleAttendances) * 100).toFixed(1) 
      : 0;


    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalCourses,
      overallAttendanceRate,
      attendanceByCourse, // This will be an array of { courseName, presentCount, totalStudentsInCourse }
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}