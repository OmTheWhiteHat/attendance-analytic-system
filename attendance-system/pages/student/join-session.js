
import { useState, useEffect, useRef } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { QrReader } from 'react-qr-reader';
import * as faceapi from 'face-api.js';

export default function JoinSessionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState('qrScan'); // qrScan, faceScan, processing, success, error
  const [feedback, setFeedback] = useState('Point your camera at the QR code.');
  const [scannedSessionKey, setScannedSessionKey] = useState(null);

  const videoRef = useRef();
  const canvasRef = useRef();

  // 1. Load Face-API models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      setFeedback('Loading face recognition models...');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setFeedback('Point your camera at the QR code.');
    };
    loadModels();
  }, []);

  // 2. Handle QR Code Scan
  const handleQrScan = (data) => {
    if (data) {
      try {
        const { sessionKey } = JSON.parse(data.text);
        if (sessionKey) {
          setScannedSessionKey(sessionKey);
          setStep('faceScan');
          setFeedback('QR code accepted. Now, please verify your face.');
        } else {
            throw new Error('Invalid QR Code format.');
        }
      } catch (e) {
        setStep('error');
        setFeedback(e.message || 'Invalid QR Code.');
      }
    }
  };

  // 3. Start video and face detection when step is faceScan
  useEffect(() => {
    if (step === 'faceScan') {
      startVideo();
    }
  }, [step]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => {
        setStep('error');
        setFeedback('Could not access camera. Please enable permissions.');
      });
  };

  // 4. Main face detection logic
  const handleVideoOnPlay = () => {
    const faceMatcher = new faceapi.FaceMatcher(getLabeledFaceDescriptors());

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      setFeedback('Detecting face...');
      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const detections = await faceapi.detectAllFaces(videoRef.current).withFaceLandmarks().withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

      if (results.length > 0 && results[0].label === 'You') {
        setFeedback('Face matched! Marking you present...');
        clearInterval(interval);
        stopVideo();
        joinSession(scannedSessionKey);
      } else {
        setFeedback('Please position your face in the center of the camera.');
      }
    }, 1000);
  };

  // 5. Helper to get user's profile image descriptor
  const getLabeledFaceDescriptors = async () => {
    const label = "You";
    const descriptions = [];
    const img = await faceapi.fetchImage(session.user.profileImageUrl);
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (detections) {
        descriptions.push(detections.descriptor);
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
    }
    setStep('error');
    setFeedback('Could not analyze your profile picture. Please set a clear one.');
    return null;
  };

  // 6. Call the final API
  const joinSession = async (sessionKey) => {
    setStep('processing');
    const res = await fetch('/api/attendance/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionKey, method: 'biometric' }),
    });
    const responseData = await res.json();
    if (!res.ok) {
      setStep('error');
      setFeedback(responseData.message || 'Failed to join session');
    } else {
      setStep('success');
      setFeedback(`Success! Marked present for ${responseData.courseName}.`);
      setTimeout(() => router.push('/student/dashboard'), 3000);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <button onClick={() => { stopVideo(); router.back(); }}>&larr; Back</button>
      <h1>Join Session</h1>
      <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{feedback}</p>

      {step === 'qrScan' && (
        <div style={{ maxWidth: '500px', margin: 'auto' }}>
          <QrReader onResult={handleQrScan} constraints={{ facingMode: 'environment' }} style={{ width: '100%' }} />
        </div>
      )}

      {step === 'faceScan' && (
        <div style={{position: 'relative', width: 'fit-content', margin: 'auto'}}>
            <video ref={videoRef} autoPlay muted onPlay={handleVideoOnPlay} width="500" height="375" />
            <canvas ref={canvasRef} style={{position: 'absolute', top: 0, left: 0}} />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || !session.user.profileImageUrl) {
    return {
      redirect: {
        destination: '/student/profile',
        permanent: false,
      },
      props: {},
    };
  }
  return { props: { session } };
}
