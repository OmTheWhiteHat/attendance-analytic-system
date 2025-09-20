import { useRef, useEffect } from 'react';

export default function FaceScanner({ onFaceDetected, feedbackMessage }) {
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera Error:", err));
    };
    startVideo();

    // Cleanup function to stop the camera when the component is unmounted
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoPlay = async () => {
    // This function is passed in as a prop to handle the detection logic
    onFaceDetected(videoRef, canvasRef);
  };

  return (
    <div style={{ position: 'relative', width: 'fit-content', margin: 'auto' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        width="500"
        height="375"
        style={{ borderRadius: '8px' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>{feedbackMessage}</p>
    </div>
  );
}
