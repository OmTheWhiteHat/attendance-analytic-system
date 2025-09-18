import Link from 'next/link';

export default function StudentLoginChoicePage() {
  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Student Login</h1>
      <p>How would you like to log in?</p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/student-manual-login" style={{ display: 'block', padding: '0.75rem 1.5rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px', marginBottom: '1rem' }}>
          Login with Email/Password
        </Link>
        <Link href="/sign-in" style={{ display: 'block', padding: '0.75rem 1.5rem', backgroundColor: '#DB4437', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Login with Google
        </Link>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/login" style={{ textDecoration: 'underline' }}>&larr; Back to Role Selection</Link>
      </div>
    </div>
  );
}