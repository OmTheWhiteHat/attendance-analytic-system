import { useState } from 'react';
import { useRouter } from 'next/router';
import dbConnect from '../../lib/database';
import Student from '../../models/Student';
import { getAuthenticatedUser } from '../../lib/auth-helper';

export default function OnboardingPage({ user }) {
  const [rollNo, setRollNo] = useState(user?.rollNo || '');
  const [registrationNo, setRegistrationNo] = useState(user?.registrationNo || '');
  const [section, setSection] = useState(user?.section || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/student/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo, registrationNo, section, branch }),
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
        <div style={{ marginBottom: '1rem' }}>
          <label>Section</label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Branch</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
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
  const user = await getAuthenticatedUser(context);

  if (!user || user.role !== 'student') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // If onboarding is already complete, redirect to the dashboard
  if (user && user.onboardingComplete) {
    return {
      redirect: {
        destination: '/student/dashboard',
        permanent: false,
      },
    };
  }

  return { props: { user: JSON.parse(JSON.stringify(user)) } };
}