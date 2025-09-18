import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <SignUp afterSignUpUrl="/dashboard" />
      <div style={{ marginTop: '1rem' }}>
        <Link href="/login" style={{ textDecoration: 'underline' }}>&larr; Back to Login Options</Link>
      </div>
    </div>
  );
}