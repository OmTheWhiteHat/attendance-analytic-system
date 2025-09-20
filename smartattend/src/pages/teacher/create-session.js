import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { QRCodeCanvas } from 'qrcode.react';
import dbConnect from '../../lib/couchdb';

export default function CreateSessionPage({ courses }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [duration, setDuration] = useState(10);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSessionData(null);

    const res = await fetch('/api/teacher/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, duration }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || 'Something went wrong');
    } else {
      setSessionData(data);
    }
    setIsLoading(false);
  };

  const qrCodeValue = sessionData ? JSON.stringify({ sessionKey: sessionData.sessionId }) : '';

  return (
    <div className="container">
      <div className="glass-card" style={{maxWidth: '800px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
        {/* Form Section */}
        <div>
          <button onClick={() => router.back()}>&larr; Back</button>
          <h1 style={{marginTop: '1rem'}}>Create Session</h1>
          <form onSubmit={handleCreateSession}>
            <label className="form-label" htmlFor="course">Course</label>
            <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} required className="form-select">
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
            
            <label className="form-label" htmlFor="duration">Duration (minutes)</label>
            <input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" required className="form-input" />
            
            <button type="submit" disabled={isLoading} className="form-button">
              {isLoading ? 'Creating...' : 'Generate Session Code'}
            </button>
            {error && <p className="form-error">{error}</p>}
          </form>
        </div>

        {/* QR Code and Session Code Display Section */}
        <div style={{textAlign: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem'}}>
          <h2>Session Details</h2>
          {sessionData ? (
            <div>
              <p style={{margin: '1rem 0'}}>Scan the QR code or enter the code below.</p>
              <div style={{background: 'white', padding: '1rem', borderRadius: '8px', display: 'inline-block'}}>
                <QRCodeCanvas value={qrCodeValue} size={200} />
              </div>
              <div style={{marginTop: '1.5rem'}}>
                <label className="form-label">Session Code</label>
                <input type="text" readOnly value={sessionData.sessionId} className="form-input" style={{textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem'}} />
              </div>
              <p>Expires at: {new Date(sessionData.endTime).toLocaleTimeString()}</p>
            </div>
          ) : (
            <p style={{marginTop: '2rem'}}>Your session code will appear here once generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const teacherId = session?.user?.id;

  if (!session || !teacherId || session.user.role !== 'teacher') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');
    
    const coursesResult = await db.find({
      selector: {
        type: 'course',
        teacherId: teacherId
      }
    });

    return {
      props: {
        session,
        courses: coursesResult.docs,
      },
    };
  } catch (error) {
    console.error("Error fetching courses for teacher:", error);
    return {
      props: {
        session,
        courses: [],
      },
    };
  }
}