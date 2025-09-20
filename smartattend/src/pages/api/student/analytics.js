import { getAuthenticatedUser } from '../../../lib/auth-helper';
import dbConnect from '../../../lib/couchdb';
import {
  calculateAttendanceScore,
  calculateStreak,
  generateLeaderboardAndRank,
} from '../../../utils/gamification';

export default async function handler(req, res) {
  // Use the unified helper to get the user, works for both Clerk and NextAuth
  const user = await getAuthenticatedUser({ req });

  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    const studentId = user._id;

    // Fetch all required data in parallel
    const studentAttendancePromise = db.find({ selector: { type: 'attendance', studentId: studentId } });
    const allAttendancePromise = db.find({ selector: { type: 'attendance' } }); // For leaderboard
    const allSessionsPromise = db.find({ selector: { type: 'session' } });
    const allCoursesPromise = db.find({ selector: { type: 'course' } });
    const allStudentsPromise = db.find({ selector: { type: 'user', role: 'student' }, fields: ['_id', 'name'] });

    const [
      studentAttendanceResult,
      allAttendanceResult,
      allSessionsResult,
      allCoursesResult,
      allStudentsResult
    ] = await Promise.all([
      studentAttendancePromise,
      allAttendancePromise,
      allSessionsPromise,
      allCoursesPromise,
      allStudentsPromise
    ]);

    const studentAttendance = studentAttendanceResult.docs;
    const allAttendance = allAttendanceResult.docs;
    const allSessions = allSessionsResult.docs;
    const allCourses = allCoursesResult.docs;
    const allStudents = allStudentsResult.docs;

    // Filter sessions and courses relevant to the student
    const studentCourseIds = new Set(user.courses || []);
    const sessionsForStudent = allSessions
      .filter(session => studentCourseIds.has(session.courseId))
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Perform calculations
    const attendanceScore = calculateAttendanceScore(studentAttendance.length, sessionsForStudent.length);
    const streak = calculateStreak(studentAttendance, sessionsForStudent);
    const { leaderboard, rank } = generateLeaderboardAndRank(studentId, allAttendance);

    // Enrich leaderboard with names
    const studentIdToNameMap = allStudents.reduce((map, student) => {
        map[student._id] = student.name;
        return map;
    }, {});
    const enrichedLeaderboard = leaderboard.map(item => ({
        ...item,
        name: studentIdToNameMap[item.studentId] || 'Unknown'
    }));

    // --- START ADDING BACK MISSING LOGIC ---
    // Calculate status breakdown (assuming 'method' is the status)
    const statusBreakdown = studentAttendance.reduce((acc, record) => {
        const method = record.method || 'unknown';
        const existing = acc.find(item => item._id === method);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ _id: method, count: 1 });
        }
        return acc;
    }, []);

    // Get attendance history for the last 20 sessions
    const courseIdToNameMap = allCourses.reduce((map, course) => {
        map[course._id] = course.name;
        return map;
    }, {});
    const attendedSessionIds = new Set(studentAttendance.map(a => a.sessionId));
    const historySessions = sessionsForStudent.slice(0, 20).reverse(); // Oldest first
    const attendanceHistory = historySessions.map(session => {
        return {
            sessionName: `${courseIdToNameMap[session.courseId] || 'Course'} - ${new Date(session.startTime).toLocaleDateString()}`,
            attended: attendedSessionIds.has(session._id),
        }
    });
    // --- END ADDING BACK MISSING LOGIC ---

    // Calculate attendance by subject
    const attendanceBySubject = studentAttendance.reduce((acc, record) => {
        const session = allSessions.find(s => s._id === record.sessionId);
        if (session) {
            const course = allCourses.find(c => c._id === session.courseId);
            if (course) {
                const existing = acc.find(item => item.name === course.name);
                if (existing) {
                    existing.attended++;
                } else {
                    acc.push({ name: course.name, attended: 1 });
                }
            }
        }
        return acc;
    }, []);

    res.status(200).json({
      attendanceScore,
      rank,
      streak,
      leaderboard: enrichedLeaderboard,
      statusBreakdown,
      attendanceHistory,
      attendanceBySubject, // Add to response
    });

  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}