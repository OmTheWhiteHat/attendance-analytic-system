
import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function OnboardingPage() {
  const [rollNo, setRollNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/student/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo, registrationNo }),
    });

    if (res.ok) {
      // Redirect to the main student dashboard after completion
      router.push('/student/dashboard');
    } else {
      const data = await res.json();
      setError(data.message || 'An error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1>Complete Your Profile</h1>
      <p>Please provide your college details to finish setting up your account.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Roll Number</label>
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Registration Number</label>
          <input
            type="text"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem 1.5rem' }}>
          Save and Continue
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // Fetch the user from DB to check their onboarding status
  const { default: dbConnect } = await import('../../lib/database');
  const { default: User } = await import('../../models/User');
  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  // If onboarding is already complete, redirect to the dashboard
  if (user && user.onboardingComplete) {
    return { redirect: { destination: '/student/dashboard', permanent: false } };
  }

  return { props: { session } };
}
