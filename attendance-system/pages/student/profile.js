
import { useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function ProfilePage({ user }) {
  const { data: session, update } = useSession();
  const [imageUrl, setImageUrl] = useState(user.profileImageUrl || '');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Saving...');

    const res = await fetch('/api/student/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (res.ok) {
      setMessage('Profile picture updated successfully!');
      // This tells NextAuth to refetch the session, updating the user object
      await update({ ...session, user: { ...session.user, profileImageUrl: imageUrl } });
    } else {
      const data = await res.json();
      setMessage(`Error: ${data.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => router.back()}>&larr; Back to Dashboard</button>
      <h1>Your Profile</h1>
      <p>Add or update your profile picture. Use a direct URL to a clear, forward-facing headshot.</p>
      
      {imageUrl && 
        <div style={{margin: '1rem 0'}}>
            <p>Current Picture:</p>
            <img src={imageUrl} alt="Profile Preview" style={{width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover'}}/>
        </div>
      }

      <form onSubmit={handleSubmit} style={{maxWidth: '500px'}}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.75rem 1.5rem' }}>Save</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'student') {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // We need to pass the full user object to the page, including the new field
  // The default session object might not have it yet
  const { default: dbConnect } = await import('../../lib/database');
  const { default: User } = await import('../../models/User');
  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  return {
    props: {
      session,
      user: JSON.parse(JSON.stringify(user)),
    },
  };
}
