import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    // Handle next-auth session (for teachers/admins and manual students)
    if (session && session.user && session.user.role) {
      const { role } = session.user;
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else if (role === 'student') { // This is for manual student login
        router.push('/student/dashboard');
      }
      return; // Exit if next-auth session is handled
    }

    // Handle Clerk session (for Google students)
    if (isLoaded && isSignedIn && clerkUser) {
      // Assuming Clerk users are always students for now
      router.push('/student/dashboard');
      return; // Exit if Clerk session is handled
    }

    // If neither session is loaded/authenticated, redirect to login
    if (status === 'unauthenticated' && isLoaded) { // Ensure Clerk is also loaded
      router.push('/login');
    }
  }, [session, status, router, isLoaded, isSignedIn, clerkUser]);

  return <div>Loading...</div>; // Or a spinner component
}