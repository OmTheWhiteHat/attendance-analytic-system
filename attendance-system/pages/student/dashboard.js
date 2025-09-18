
import { useSession, getSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatsCard from '../../components/analytics/StatsCard';
import RankBoard from '../../components/analytics/RankBoard';

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/student/analytics');
          if (!res.ok) {
            throw new Error('Failed to fetch your analytics');
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
    }
  }, [session]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Your Dashboard</h1>
        <div>
            <Link href="/student/profile" style={{ marginRight: '1rem', textDecoration: 'underline' }}>My Profile</Link>
            <Link href="/student/join-session" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                Join a Session
            </Link>
        </div>
      </div>
      <p>Welcome, {session?.user?.name}!</p>

      {isLoading && <p>Loading your stats...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {analytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <StatsCard title="Attendance Score" value={`${analytics.attendanceScore}%`} />
            <StatsCard title="Your Rank" value={`#${analytics.rank}`} />
          </div>

          <RankBoard leaderboard={analytics.leaderboard} currentUserRank={analytics.rank} currentUserName={session.user.name} />

          <div style={{marginTop: '2rem'}}>
            <h3>Today's Attendance</h3>
            {analytics.todaysAttendance.length > 0 ? (
                <ul>
                    {analytics.todaysAttendance.map(att => (
                        <li key={att._id}>You were marked present in <strong>{att.course.name}</strong> at {new Date(att.timestamp).toLocaleTimeString()}.</li>
                    ))}
                </ul>
            ) : (
                <p>No attendance recorded yet for today.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'student') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Check if onboarding is complete
  const { default: dbConnect } = await import('../../lib/database');
  const { default: User } = await import('../../models/User');
  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  if (!user || !user.onboardingComplete) {
    return {
      redirect: {
        destination: '/student/onboarding',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
