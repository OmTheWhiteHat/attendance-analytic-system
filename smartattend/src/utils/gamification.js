// src/utils/gamification.js

/**
 * Calculates the attendance score.
 * @param {number} attendedSessions - Number of sessions the student attended.
 * @param {number} totalSessions - Total number of sessions available for the student's courses.
 * @returns {number} - The attendance score as a percentage.
 */
export function calculateAttendanceScore(attendedSessions, totalSessions) {
  if (totalSessions === 0) {
    return 0;
  }
  return parseFloat(((attendedSessions / totalSessions) * 100).toFixed(1));
}

/**
 * Calculates the current attendance streak.
 * @param {Array<Object>} studentAttendance - Array of the student's attendance documents.
 * @param {Array<Object>} allSessionsForStudent - Array of all session documents for the student's courses, sorted descending by date.
 * @returns {number} - The current streak count.
 */
export function calculateStreak(studentAttendance, allSessionsForStudent) {
  const attendedSessionIds = new Set(studentAttendance.map(a => a.sessionId));
  let streak = 0;
  for (const session of allSessionsForStudent) {
    if (attendedSessionIds.has(session._id)) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }
  return streak;
}

/**
 * Generates a leaderboard and finds the current student's rank.
 * @param {string} currentStudentId - The ID of the currently logged-in student.
 * @param {Array<Object>} allAttendanceRecords - Array of all attendance documents from the DB.
 * @returns {Object} - An object containing the top 10 leaderboard and the student's rank.
 */
export function generateLeaderboardAndRank(currentStudentId, allAttendanceRecords) {
  const attendanceCounts = allAttendanceRecords.reduce((acc, record) => {
    acc[record.studentId] = (acc[record.studentId] || 0) + 1;
    return acc;
  }, {});

  const rankedStudents = Object.entries(attendanceCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([studentId, count], index) => ({
      studentId,
      attendanceCount: count,
      rank: index + 1,
    }));

  const studentRank = rankedStudents.find(s => s.studentId === currentStudentId);
  
  // We need to fetch student names separately in the API route to enrich this data.
  return {
    leaderboard: rankedStudents.slice(0, 10),
    rank: studentRank ? studentRank.rank : 'N/A',
  };
}
