import { useSession, getSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatusPieChart from '../../components/analytics/StatusPieChart';
import CoursePerformanceBarChart from '../../components/analytics/CoursePerformanceBarChart'; // Import new component

// ... inside the component's return statement ...
      {analytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem', alignItems: 'flex-start' }}>
            <div className="glass-card">
              <h2>Course Performance</h2>
              {analytics.attendanceByCourse.length > 0 ? (
                  <CoursePerformanceBarChart data={analytics.attendanceByCourse} />
              ) : (
                  <p>No attendance data available yet.</p>
              )}
            </div>
            <div className="glass-card">
                <h2>Status Breakdown</h2>
                {analytics.statusBreakdown.length > 0 ? (
                    <StatusPieChart data={analytics.statusBreakdown} />
                ) : (
                    <p>No status data available yet.</p>
                )}
            </div>
          </div>
// ...

          <div style={{ marginTop: '3rem' }}>
            <h2>At-Risk Students (&lt;75% Attendance)</h2>
            {analytics.atRiskStudents.length > 0 ? (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr style={{borderBottom: '2px solid #ddd'}}>
                            <th style={{padding: '8px', textAlign: 'left'}}>Student Name</th>
                            <th style={{padding: '8px', textAlign: 'left'}}>Course</th>
                            <th style={{padding: '8px', textAlign: 'left'}}>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.atRiskStudents.map((student, index) => (
                            <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                                <td style={{padding: '8px'}}>{student.studentName}</td>
                                <td style={{padding: '8px'}}>{student.courseName}</td>
                                <td style={{padding: '8px'}}>{student.attendanceRate}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No students are currently at risk. Great job!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'teacher') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}