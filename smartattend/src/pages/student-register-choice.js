import Link from 'next/link';

export default function StudentRegisterChoicePage() {
  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Student Registration</h1>
      <p>How would you like to register?</p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/student-manual-register" style={{ display: 'block', padding: '0.75rem 1.5rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px', marginBottom: '1rem' }}>
          Register with Email/Password
        </Link>
        <Link href="/sign-up" style={{ display: 'block', padding: '0.75rem 1.5rem', backgroundColor: '#DB4437', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Register with Google
        </Link>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/login" style={{ textDecoration: 'underline' }}>Already have an account? Login</Link>
      </div>
    </div>
  );
}