import { useState } from 'react';
import { useRouter } from 'next/router';
import dbConnect from '../../lib/database';
import Student from '../../models/Student';
import { getAuthenticatedUser } from '../../lib/auth-helper';

export default function ProfilePage({ user }) {
  const [imageUrl, setImageUrl] = useState(user?.profileImageUrl || '');
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
            <img src={imageUrl} alt="Profile Preview" style={{width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover'}/>
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
  const user = await getAuthenticatedUser(context);

  if (!user || user.role !== 'student') {
    return { redirect: { destination: '/login', permanent: false } };
  }

  return {
    props: { user: JSON.parse(JSON.stringify(user)) },
  };
}