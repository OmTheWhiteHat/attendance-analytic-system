import { useSession, getSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AttendanceChart from '../../components/analytics/AttendanceChart';
import StatusPieChart from '../../components/analytics/StatusPieChart';

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/teacher/analytics');
        if (!res.ok) {
          throw new Error('Failed to fetch your analytics data');
        }
        const data = await res.json();
        setAnalytics(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Teacher Dashboard</h1>
        <Link href="/teacher/create-session" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Create New Session
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '1rem' }}>
          Sign Out
        </button>
      </div>
      <p>Welcome, {session?.user?.name}!</p>

      {isLoading && <p>Loading analytics...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {analytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '600px' }}>
              <h2>Attendance Overview</h2>
              {analytics.attendanceByCourse.length > 0 ? (
                  <AttendanceChart data={analytics.attendanceByCourse} />
              ) : (
                  <p>No attendance data available yet.</p>
              )}
            </div>
            <div style={{ maxWidth: '400px' }}>
                <h2>Status Breakdown</h2>
                {analytics.statusBreakdown.length > 0 ? (
                    <StatusPieChart data={analytics.statusBreakdown} />
                ) : (
                    <p>No status data available yet.</p>
                )}
            </div>
          </div>

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