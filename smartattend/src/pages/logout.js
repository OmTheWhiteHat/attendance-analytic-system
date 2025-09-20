import { useEffect } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';

export default function LogoutPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      // Check for a NextAuth session first
      if (sessionStatus === 'authenticated') {
        // The callbackUrl tells NextAuth where to go after signing out.
        await nextAuthSignOut({ redirect: false, callbackUrl: '/login' });
        router.push('/login');
      } 
      // Then check for a Clerk session
      else if (isSignedIn) {
        await clerkSignOut(() => router.push('/login'));
      } 
      // If no session is found, just redirect to login
      else {
        router.push('/login');
      }
    };

    // We wait for the session status to be determined before acting.
    if (sessionStatus !== 'loading') {
      performLogout();
    }
  }, [sessionStatus, isSignedIn, clerkSignOut, router]);

  const styles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    fontSize: '1.5rem',
  };

  return (
    <div style={styles}>
      <p>Signing you out...</p>
    </div>
  );
}
