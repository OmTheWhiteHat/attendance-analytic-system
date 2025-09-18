
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCodeComponent({ sessionKey }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (sessionKey) {
      // The data encoded in the QR code. We can make this a JSON object
      // to include more info in the future if needed.
      const qrData = JSON.stringify({ sessionKey });

      QRCode.toDataURL(qrData, { width: 300, margin: 2 }, (err, url) => {
        if (err) {
          console.error('Error generating QR code', err);
          return;
        }
        setQrCodeUrl(url);
      });
    }
  }, [sessionKey]);

  if (!qrCodeUrl) {
    return <div>Generating QR Code...</div>;
  }

  return <img src={qrCodeUrl} alt="Attendance QR Code" />;
}
