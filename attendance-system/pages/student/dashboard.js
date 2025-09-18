
import { useSession, getSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatsCard from '../../components/analytics/StatsCard';
import RankBoard from '../../components/analytics/RankBoard';
import StatusPieChart from '../../components/analytics/StatusPieChart';
import HistoryGraph from '../../components/analytics/HistoryGraph';

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

  const dashboardStyles = {
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eaeaea',
    paddingBottom: '1rem',
    marginBottom: '2rem',
  };

  const gridStyles = {
    display: 'grid',
    gap: '1.5rem',
  };

  return (
    <div style={dashboardStyles}>
      <header style={headerStyles}>
        <div>
          <h1>Your Dashboard</h1>
          <p>Welcome, {session?.user?.name}!</p>
        </div>
        <div>
            <Link href="/student/profile" style={{ marginRight: '1rem', textDecoration: 'underline' }}>My Profile</Link>
            <Link href="/student/join-session" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                Join a Session
            </Link>
        </div>
      </header>

      {isLoading && <p>Loading your stats...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {analytics && (
        <div style={gridStyles}>
          {/* Top Row Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <StatsCard title="Attendance Score" value={`${analytics.attendanceScore}%`} />
            <StatsCard title="Current Streak" value={analytics.streak} />
            <StatsCard title="Your Rank" value={`#${analytics.rank}`} />
          </div>

          {/* Middle Row Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
            {analytics.attendanceHistory.length > 0 ? (
                <HistoryGraph data={analytics.attendanceHistory} />
            ) : <p>No history to display.</p>}
            {analytics.statusBreakdown.length > 0 ? (
                <StatusPieChart data={analytics.statusBreakdown} />
            ) : <p>No status breakdown available.</p>}
          </div>

          {/* Bottom Row Leaderboard */}
          <RankBoard leaderboard={analytics.leaderboard} currentUserRank={analytics.rank} currentUserName={session.user.name} />
        </div>
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
