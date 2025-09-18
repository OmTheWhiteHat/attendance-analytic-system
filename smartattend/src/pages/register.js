import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/student-register-choice');
  }, [router]);

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1>Register as a Student</h1>
      <p>Redirecting to registration choices...</p>
      <p style={{marginTop: '1rem'}}>
        Already have an account? <Link href="/login" style={{textDecoration: 'underline'}}>Login</Link>
      </p>
    </div>
  );
}