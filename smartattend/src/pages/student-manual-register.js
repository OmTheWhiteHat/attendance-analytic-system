import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function StudentManualRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Something went wrong');
      return;
    }

    // Automatically sign in the user after successful registration
    const signInResult = await signIn('credentials', {
      redirect: false,
      email,
      password,
      role: 'student', // Explicitly set role for manual student registration
    });

    if (signInResult.error) {
      setError(signInResult.error);
    }
    else {
      // Redirect to onboarding page
      router.push('/student/onboarding');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1>Register as a Student (Manual)</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
          Register
        </button>
      </form>
      <p style={{marginTop: '1rem'}}>
        Already have an account? <Link href="/login" style={{textDecoration: 'underline'}}>Login</Link>
      </p>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/student-register-choice" style={{ textDecoration: 'underline' }}>&larr; Back to Registration Choices</Link>
      </div>
    </div>
  );
}