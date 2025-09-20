import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/couchdb';

export default async function handler(req, res) {
  const nextAuthSession = await getSession({ req });

  if (!nextAuthSession || !nextAuthSession.user || nextAuthSession.user.role !== 'teacher') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const teacherId = nextAuthSession.user.id;

    // 1. Find courses taught by this teacher
    const coursesResult = await db.find({ selector: { type: 'course', teacherId: teacherId } });
    const teacherCourses = coursesResult.docs;

    if (!teacherCourses.length) {
      return res.status(200).json({
        attendanceByCourse: [],
        atRiskStudents: [],
      });
    }
    const courseIds = teacherCourses.map(c => c._id);

    // 2. Fetch all sessions and attendance records for these courses
    const sessionsResult = await db.find({ selector: { type: 'session', courseId: { '$in': courseIds } } });
    const allSessionsForTeacher = sessionsResult.docs;
    const sessionIds = allSessionsForTeacher.map(s => s._id);

    const attendanceResult = await db.find({ selector: { type: 'attendance', sessionId: { '$in': sessionIds } } });
    const allAttendanceForTeacher = attendanceResult.docs;
    
    // 3. Fetch all student data for name lookups
    const studentsResult = await db.find({ selector: { type: 'user', role: 'student' } });
    const allStudents = studentsResult.docs;
    const studentMap = allStudents.reduce((map, student) => {
        map[student._id] = student;
        return map;
    }, {});

    // 4. Calculate attendance by course
    const courseData = {};
    for (const course of teacherCourses) {
        courseData[course._id] = {
            courseName: course.name,
            totalSessions: 0,
            totalPresent: 0,
            // Assuming student enrollment is managed elsewhere, for now we count unique students who attended
            enrolledStudentIds: new Set(course.students || [])
        };
    }

    for (const session of allSessionsForTeacher) {
        courseData[session.courseId].totalSessions++;
    }

    for (const attendance of allAttendanceForTeacher) {
        const session = allSessionsForTeacher.find(s => s._id === attendance.sessionId);
        if (session) {
            courseData[session.courseId].totalPresent++;
        }
    }
    
    const attendanceByCourse = Object.values(courseData).map(c => ({
        ...c,
        // Note: total possible attendance is totalSessions * enrolledStudents.
        // This simplified 'presentCount' is just the raw number of attendance records.
        presentCount: c.totalPresent,
    }));

    // 5. Identify at-risk students (e.g., < 75% attendance)
    const atRiskStudents = [];
    for (const course of teacherCourses) {
        const sessionsInCourse = allSessionsForTeacher.filter(s => s.courseId === course._id);
        const totalSessionsInCourse = sessionsInCourse.length;
        if (totalSessionsInCourse === 0) continue;

        const enrolledStudentIds = course.students || [];

        for (const studentId of enrolledStudentIds) {
            const attendedCount = allAttendanceForTeacher.filter(att => {
                const session = allSessionsForTeacher.find(s => s._id === att.sessionId);
                return session && session.courseId === course._id && att.studentId === studentId;
            }).length;
            
            const attendanceRate = (attendedCount / totalSessionsInCourse) * 100;

            if (attendanceRate < 75) {
                const student = studentMap[studentId];
                if (student) {
                    atRiskStudents.push({
                        studentName: student.name,
                        studentEmail: student.email,
                        courseName: course.name,
                        attendanceRate: attendanceRate.toFixed(1)
                    });
                }
            }
        }
    }

    res.status(200).json({ attendanceByCourse, atRiskStudents });

  } catch (error) {
    console.error('Error fetching teacher analytics:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}