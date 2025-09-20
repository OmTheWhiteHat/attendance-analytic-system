import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatsCard from '../../components/analytics/StatsCard';
import RankBoard from '../../components/analytics/RankBoard';
import StatusPieChart from '../../components/analytics/StatusPieChart';
import HistoryGraph from '../../components/analytics/HistoryGraph';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useUser, useClerk } from '@clerk/nextjs';
import { getAuthenticatedUser } from '../../lib/auth-helper';

export default function StudentDashboard({ user, authType }) {
  const { data: nextAuthSession } = useSession(); // next-auth session
  const { isLoaded, isSignedIn, user: clerkUser } = useUser(); // Clerk user
  const { signOut: clerkSignOut } = useClerk(); // Clerk signOut

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Determine if user is logged in via next-auth or Clerk
    const isLoggedIn = (nextAuthSession && nextAuthSession.user) || (isLoaded && isSignedIn && clerkUser);

    if (!isLoggedIn) return; 

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
  }, [nextAuthSession, isLoaded, isSignedIn, clerkUser]);

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

  // Display loading state if Clerk user is not loaded yet
  if (!isLoaded) {
    return <div>Loading user data...</div>;
  }

  // Determine which user object to use for display
  const displayUser = nextAuthSession?.user || user || clerkUser;

  if (!displayUser) {
    // This case should ideally be handled by getServerSideProps redirect
    return <div>Not authenticated. Redirecting...</div>;
  }

  return (
    <div style={dashboardStyles}>
      <header style={headerStyles}>
        <div>
          <h1>Your Dashboard</h1>
          <p>Welcome, {displayUser?.name || displayUser?.fullName || displayUser?.firstName}!</p>
          <p style={{fontSize: '0.8rem', color: '#999', marginTop: '0.25rem'}}>
            Account Type: {authType}
          </p>
        </div>
        <div>
            <Link href="/student/profile" style={{ marginRight: '1rem', textDecoration: 'underline' }}>My Profile</Link>
            <Link href="/student/join-session" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                Join a Session
            </Link>
            <Link 
              href="/logout"
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '1rem', textDecoration: 'none' }}
            >
                Sign Out
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
            {analytics?.attendanceHistory?.length > 0 ? (
                <HistoryGraph data={analytics.attendanceHistory} />
            ) : <p>No history to display.</p>}
            {analytics?.statusBreakdown?.length > 0 ? (
                <StatusPieChart data={analytics.statusBreakdown} />
            ) : <p>No status breakdown available.</p>}
          </div>

          {/* Bottom Row Leaderboard */}
          <RankBoard leaderboard={analytics.leaderboard} currentUserRank={analytics.rank} currentUserName={displayUser?.name || displayUser?.fullName || displayUser?.firstName} />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const user = await getAuthenticatedUser(context);

  if (!user || user.role !== 'student') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (user.onboardingComplete !== true) {
    return {
      redirect: {
        destination: '/student/onboarding',
        permanent: false,
      },
    };
  }

  // Determine auth type
  const authType = user.clerkId ? 'Social (Clerk)' : 'Traditional';

  return {
    props: { 
      user: JSON.parse(JSON.stringify(user)),
      authType 
    },
  };
}