import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/couchdb';

export default async function handler(req, res) {
  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || !nextAuthSession.user || nextAuthSession.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');

    // 1. Get total counts using Mango queries
    const studentsQuery = { selector: { type: 'user', role: 'student' }, fields: ['_id'] };
    const teachersQuery = { selector: { type: 'user', role: 'teacher' }, fields: ['_id'] };
    const coursesQuery = { selector: { type: 'course' }, fields: ['_id'] };
    const attendanceQuery = { selector: { type: 'attendance' }, fields: ['_id', 'sessionId'] };

    const [studentsResult, teachersResult, coursesResult, attendanceResult] = await Promise.all([
      db.find(studentsQuery),
      db.find(teachersQuery),
      db.find(coursesQuery),
      db.find(attendanceQuery)
    ]);

    const totalStudents = studentsResult.docs.length;
    const totalTeachers = teachersResult.docs.length;
    const totalCourses = coursesResult.docs.length;
    const totalActualAttendances = attendanceResult.docs.length;

    // Note: Calculating overall attendance rate without knowing total possible attendance
    // is speculative. A more robust implementation would require fetching all sessions
    // and all student enrollments. For this version, we'll provide the raw counts.
    // A simple overall rate is not meaningful without the denominator.

    // 2. For attendance by course, we need to fetch more data and process it.
    // This is less efficient than a DB-level aggregation but is the direct approach with basic Mango queries.
    const allCourses = (await db.find({ selector: { type: 'course' } })).docs;
    const allAttendance = (await db.find({ selector: { type: 'attendance' } })).docs;
    const allSessions = (await db.find({ selector: { type: 'session' } })).docs;

    // Create a map for quick lookups
    const sessionToCourseMap = allSessions.reduce((map, session) => {
      map[session._id] = session.courseId;
      return map;
    }, {});

    const courseIdToNameMap = allCourses.reduce((map, course) => {
      map[course._id] = course.name;
      return map;
    }, {});

    const attendanceByCourse = allAttendance.reduce((acc, record) => {
      const courseId = sessionToCourseMap[record.sessionId];
      if (courseId) {
        if (!acc[courseId]) {
          acc[courseId] = {
            courseName: courseIdToNameMap[courseId] || 'Unknown Course',
            presentCount: 0,
          };
        }
        acc[courseId].presentCount++;
      }
      return acc;
    }, {});

    // Process data for attendance by branch
    const allStudents = (await db.find({ selector: { type: 'user', role: 'student' }, fields: ['_id', 'branch'] })).docs;
    const studentIdToBranchMap = allStudents.reduce((map, student) => {
      map[student._id] = student.branch || 'Unknown';
      return map;
    }, {});

    const attendanceByBranch = allAttendance.reduce((acc, record) => {
      const branch = studentIdToBranchMap[record.studentId];
      if (branch) {
        const existing = acc.find(item => item.name === branch);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name: branch, count: 1 });
        }
      }
      return acc;
    }, []);


    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalCourses,
      totalAttendances: totalActualAttendances,
      attendanceByCourse: Object.values(attendanceByCourse),
      attendanceByBranch, // Add to response
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}