import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SplitText from "./SplitText";

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};
const headingStyles = {
    fontSize: '2rem',
    lineHeight: '1.1',
    marginBottom: '2rem',
  };

  const textStyles = {
    fontSize: '1.2rem',
    color: 'rgba(var(--foreground-rgb), 0.8)',
    marginBottom: '3rem',
  };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.query.error) {
      const errorMessages = {
        CredentialsSignin: 'Invalid email or password. Please try again.',
        default: 'An unknown error occurred during login.',
      };
      setError(errorMessages[router.query.error] || errorMessages.default);
    }
  }, [router.query.error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let callbackUrl = '/dashboard';
    if (role === 'student') callbackUrl = '/student/dashboard';
    else if (role === 'teacher') callbackUrl = '/teacher/dashboard';
    else if (role === 'admin') callbackUrl = '/admin/dashboard';

    await signIn('credentials', {
      email,
      password,
      role,
      callbackUrl,
    });
  };

  return (
    <div className="container">
      <h1 style={headingStyles}>
            <SplitText
              text="Welcome to SmartAttend"
              className="text-6xl font-bold"
              delay={200}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
            />
          </h1>
      <div className="glass-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="form-label" htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required className="form-select">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="form-button">
            Login
          </button>
        </form>
        <div className="link-group">
          <p>
            Don't have an account? <Link href="/register">Register here</Link>
          </p>
        </div>
        <div className="link-group">
          <p>
            Or, use a social account: <Link href="/sign-in">Login with Google</Link>
          </p>
        </div>
      </div>
    </div>
  );
}