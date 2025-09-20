import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import Link from 'next/link';

export default function ApprovalsPage({ initialPendingScans }) {
  const [pendingScans, setPendingScans] = useState(initialPendingScans);
  const [message, setMessage] = useState('');

  const handleApproval = async (studentId, action) => {
    setMessage('Processing...');
    const res = await fetch('/api/admin/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, action }),
    });
    const data = await res.json();
    setMessage(data.message);
    // Refresh the list
    setPendingScans(pendingScans.filter(scan => scan._id !== studentId));
  };

  return (
    <div className="container">
      <div className="glass-card" style={{maxWidth: '900px'}}>
        <Link href="/admin/dashboard">&larr; Back to Dashboard</Link>
        <h1 style={{marginTop: '1rem'}}>Face Scan Approvals</h1>
        <p>Review and approve or reject new face scans submitted by students.</p>
        {message && <p style={{textAlign: 'center', margin: '1rem 0'}}>{message}</p>}

        <div style={{marginTop: '2rem'}}>
          {pendingScans.length === 0 ? (
            <p>No pending approvals.</p>
          ) : (
            pendingScans.map(student => (
              <div key={student._id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <img src={student.profileImageUrl} alt="Profile" style={{width: '50px', height: '50px', borderRadius: '50%', marginRight: '1rem'}} />
                  <div>
                    <strong>{student.name}</strong>
                    <br />
                    <small>{student.email}</small>
                  </div>
                </div>
                <div>
                  <button onClick={() => handleApproval(student._id, 'approve')} className="form-button" style={{background: 'green', marginRight: '1rem'}}>Approve</button>
                  <button onClick={() => handleApproval(student._id, 'reject')} className="form-button" style={{background: 'red'}}>Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== 'admin') {
    return { redirect: { destination: '/login' } };
  }

  // Fetch initial data on the server
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/approvals`, {
    headers: { 'Cookie': context.req.headers.cookie }
  });
  const initialPendingScans = await res.json();

  return { props: { initialPendingScans } };
}
