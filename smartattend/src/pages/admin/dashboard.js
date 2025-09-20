import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatsCard from '../../components/analytics/StatsCard';
import DepartmentPieChart from '../../components/analytics/DepartmentPieChart';

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
        <div>
          <Link href="/admin/student-approvals" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px', marginRight: '1rem' }}>
            Student ID Approvals
          </Link>
          <Link href="/admin/register-teacher" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'purple', color: 'white', textDecoration: 'none', borderRadius: '5px', marginRight: '1rem' }}>
            Register Teacher
          </Link>
          <Link href="/admin/approvals" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'orange', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Face Scan Approvals
          </Link>
          <Link href="/logout" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'red', color: 'white', textDecoration: 'none', borderRadius: '5px', marginLeft: '1rem' }}>
            Sign Out
          </Link>
        </div>
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
            <StatsCard title="Total Attendances" value={analytics.totalAttendances} />
          </div>
          <div style={{ marginTop: '2rem', maxWidth: '600px', margin: 'auto' }} className="glass-card">
            {analytics.attendanceByBranch && analytics.attendanceByBranch.length > 0 ? (
              <DepartmentPieChart data={analytics.attendanceByBranch} />
            ) : (
              <p>No department data to display.</p>
            )}
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