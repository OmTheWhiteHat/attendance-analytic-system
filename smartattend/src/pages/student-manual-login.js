import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function StudentManualLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      role: 'student', // Explicitly set role for manual student login
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard'); // Redirect to a generic dashboard page
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1>Student Manual Login</h1>
      <form onSubmit={handleSubmit}>
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
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      <p style={{marginTop: '1rem'}}>
        Don't have an account? <Link href="/register" style={{textDecoration: 'underline'}}>Register here</Link>
      </p>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/student-login-choice" style={{ textDecoration: 'underline' }}>&larr; Back to Student Login Choices</Link>
      </div>
    </div>
  );
}