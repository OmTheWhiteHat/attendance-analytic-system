import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // Changed default to empty string
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      role,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard'); // Redirect to a generic dashboard page
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1>Login</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }}>
          <option value="">Select Role</option> {/* Added this option */}
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {role === 'student' && (
        <div style={{ marginTop: '2rem' }}>
          <button onClick={() => router.push('/student-login-choice')} style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
            Continue as Student
          </button>
        </div>
      )}

      {(role === 'teacher' || role === 'admin') && (
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
      )}

      <p style={{marginTop: '1rem'}}>
        Don't have an account? <Link href="/register" style={{textDecoration: 'underline'}}>Register here</Link>
      </p>
    </div>
  );
}