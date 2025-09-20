import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAuthenticatedUser } from '../../lib/auth-helper';

const QrScanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.QrScanner), { 
  ssr: false,
  loading: () => <p>Loading Scanner...</p>
});

let faceapi;
if (typeof window !== 'undefined') {
  import('face-api.js').then(api => {
    faceapi = api;
  });
}

export default function JoinSessionPage({ user, hasProfileImage, needsReverification }) {
  const router = useRouter();
  
  const [mode, setMode] = useState('choice');
  const [step, setStep] = useState('scan');
  const [feedback, setFeedback] = useState('Choose how you want to join the session.');
  const [sessionKey, setSessionKey] = useState('');
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      if (faceapi && faceapi.nets?.ssdMobilenetv1?.loadFromUri) {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
      }
    };
    loadModels();
  }, []);

  const validateAndProceed = async (scannedSessionKey) => {
    setFeedback('Validating session...');
    try {
      const res = await fetch('/api/student/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey: scannedSessionKey }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Session validation failed.');
      }

      setSessionKey(scannedSessionKey);
      if (needsReverification) {
        setStep('promptToReverify');
        setFeedback('Your face scan is older than 6 months. Please go to your profile to re-verify.');
      } else if (hasProfileImage) {
        setStep('faceScan');
        setFeedback('Session validated. Please verify your face.');
      } else {
        setStep('promptToSetImage');
        setFeedback('Session validated. You must set a profile picture for verification.');
      }
    } catch (e) {
      setFeedback(e.message);
      setMode('choice'); // Go back to choice on error
    }
  };

  const handleQrScan = (result) => {
    if (result) {
      try {
        const parsedResult = JSON.parse(result);
        if (parsedResult.sessionKey) {
          validateAndProceed(parsedResult.sessionKey);
        } else {
          throw new Error('Invalid QR Code format.');
        }
      } catch (e) {
        setFeedback(e.message || 'Invalid QR Code.');
      }
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (sessionKey) {
      validateAndProceed(sessionKey);
    } else {
      setFeedback('Please enter a session code.');
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => setFeedback('Could not access camera. Please enable permissions.'));
  };

  useEffect(() => {
    if (step === 'faceScan') {
      startVideo();
    }
  }, [step]);

  const handleVideoOnPlay = async () => {
    // ... Face detection logic will be added in the next step
  };

  return (
    <div className="container">
      <div className="glass-card" style={{maxWidth: '550px'}}>
        <button onClick={() => router.back()}>&larr; Back</button>
        <h1 style={{textAlign: 'center'}}>Join Session</h1>
        <p style={{textAlign: 'center', marginBottom: '2rem'}}>{feedback}</p>

        {mode === 'choice' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <button className="form-button" onClick={() => { setMode('qr'); setFeedback('Point the QR code inside the box.'); }}>
              Scan QR Code
            </button>
            <button className="form-button" onClick={() => { setMode('code'); setFeedback('Enter the code from your teacher.'); }}>
              Enter Session Code
            </button>
          </div>
        )}

        {mode === 'qr' && step === 'scan' && (
          <div className="scanner-container">
            <QrScanner
              onScan={handleQrScan}
              onError={(error) => setFeedback(error?.message || 'QR scan failed.')}
            />
            <div className="viewfinder"></div>
          </div>
        )}

        {mode === 'code' && step === 'scan' && (
          <form onSubmit={handleCodeSubmit}>
            <input type="text" className="form-input" placeholder="Enter session code..." value={sessionKey} onChange={(e) => setSessionKey(e.target.value)} />
            <button type="submit" className="form-button">Submit Code</button>
          </form>
        )}

        {step === 'faceScan' && (
          <div style={{position: 'relative', width: 'fit-content', margin: 'auto'}}>
            <video ref={videoRef} autoPlay muted onPlay={handleVideoOnPlay} width="500" height="375" />
            <canvas ref={canvasRef} style={{position: 'absolute', top: 0, left: 0}} />
          </div>
        )}

        {(step === 'promptToSetImage' || step === 'promptToReverify') && (
          <div style={{textAlign: 'center'}}>
            <p style={{marginBottom: '1.5rem'}}>{feedback}</p>
            <Link href="/student/profile" className="form-button">
              Go to Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const user = await getAuthenticatedUser(context);

  if (!user || user.role !== 'student') {
    return { redirect: { destination: '/login' } };
  }

  const hasProfileImage = !!user.faceDescriptor && user.faceDescriptor.length > 0;
  
  let needsReverification = false;
  if (user.faceScanTimestamp) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (new Date(user.faceScanTimestamp) < sixMonthsAgo) {
      needsReverification = true;
    }
  }

  return { 
    props: { 
      user: JSON.parse(JSON.stringify(user)),
      hasProfileImage,
      needsReverification
    } 
  };
}