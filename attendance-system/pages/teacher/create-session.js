
import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import QRCode from '../../components/sessions/QRCode'; // We will create this component next
import dbConnect from '../../lib/database';
import Course from '../../models/Course';

export default function CreateSessionPage({ courses }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [duration, setDuration] = useState(10); // Default duration in minutes
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await fetch('/api/teacher/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, duration }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || 'Something went wrong');
      setSessionData(null);
    } else {
      setSessionData(data);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => router.back()}>&larr; Back to Dashboard</button>
      <h1>Create New Attendance Session</h1>
      {!sessionData ? (
        <form onSubmit={handleCreateSession}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Course</label>
            <select 
              value={courseId} 
              onChange={(e) => setCourseId(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.name} - {course.code}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Duration (in minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <button type="submit" disabled={isLoading} style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
            {isLoading ? 'Creating...' : 'Create Session'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      ) : (
        <div>
          <h2>Session Created!</h2>
          <p>Share this QR code with your students.</p>
          <QRCode sessionKey={sessionData.sessionKey} />
          <p>This session will expire at {new Date(sessionData.endTime).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'teacher') {
    return { redirect: { destination: '/login', permanent: false } };
  }

  await dbConnect();

  // Find courses taught by this teacher
  const courses = await Course.find({ teacher: session.user.id }).lean();

  return {
    props: {
      session,
      courses: JSON.parse(JSON.stringify(courses)), // Serialize the data
    },
  };
}
