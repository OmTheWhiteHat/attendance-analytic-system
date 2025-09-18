import { getSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatsCard from '../../components/analytics/StatsCard';
import AttendanceChart from '../../components/analytics/AttendanceChart';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
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
        <h1>Admin Dashboard</h1>
        <Link href="/admin/register-teacher" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'purple', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Register New Teacher
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '1rem' }}>
          Sign Out
        </button>
      </div>
      <p>Overall analytics and system health.</p>

      {isLoading && <p>Loading analytics...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {analytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <StatsCard title="Total Students" value={analytics.totalStudents} />
            <StatsCard title="Total Teachers" value={analytics.totalTeachers} />
            <StatsCard title="Courses Offered" value={analytics.totalCourses} />
            <StatsCard title="Overall Attendance" value={`${analytics.overallAttendanceRate}%`} />
          </div>
          <div style={{ marginTop: '2rem', maxWidth: '800px', margin: 'auto' }}>
            <AttendanceChart data={analytics.attendanceByCourse} />
          </div>
        </>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'admin') {
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