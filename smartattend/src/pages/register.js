import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setError(data.message || 'An error occurred during registration.');
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="form-input" />
            </div>
            <div>
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="form-input" />
            </div>
          </div>
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" />
          
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="form-input" />
          
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="form-button">Register</button>
        </form>
        <div className="link-group">
          <p>Already have an account? <Link href="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}
