import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/couchdb';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const nano = await dbConnect();
      const db = nano.db.use('smartattend');
      const result = await db.find({
        selector: {
          type: 'user',
          role: 'student',
          faceScanStatus: 'pending'
        },
        fields: ['_id', 'name', 'email', 'profileImageUrl']
      });
      res.status(200).json(result.docs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching pending scans.' });
    }
  }

  if (req.method === 'POST') {
    const { studentId, action } = req.body; // action: 'approve' or 'reject'
    if (!studentId || !action) {
      return res.status(400).json({ message: 'Missing studentId or action.' });
    }

    try {
      const nano = await dbConnect();
      const db = nano.db.use('smartattend');
      const studentDoc = await db.get(studentId);

      if (action === 'approve') {
        if (!studentDoc.pendingFaceDescriptor) {
          return res.status(400).json({ message: 'No pending scan to approve.' });
        }
        studentDoc.faceDescriptor = studentDoc.pendingFaceDescriptor;
        studentDoc.faceScanStatus = 'approved';
        delete studentDoc.pendingFaceDescriptor;
      } else if (action === 'reject') {
        studentDoc.faceScanStatus = 'rejected';
        delete studentDoc.pendingFaceDescriptor;
      } else {
        return res.status(400).json({ message: 'Invalid action.' });
      }

      await db.insert(studentDoc);
      res.status(200).json({ message: `Scan for ${studentDoc.name} has been ${action}d.` });

    } catch (error) {
      res.status(500).json({ message: 'Error processing request.' });
    }
  }
}
