import { getApiAuthenticatedUser } from '../../../lib/api-helper';
import dbConnect from '../../../lib/couchdb';

export default async function handler(req, res) {
  const user = await getApiAuthenticatedUser(req);

  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const studentId = user._id;
  const nano = await dbConnect();
  const db = nano.db.use('smartattend');

  if (req.method === 'GET') {
    // ... (GET logic remains the same)
  }
  else if (req.method === 'POST') {
    // ... inside the POST handler ...
        const {
          // ... other fields
          address,
          phoneNumber, // Add new field
          profileImageUrl,
          pendingFaceDescriptor
        } = req.body;
    
        try {
          const existingDoc = await db.get(studentId);
    
          const updatedDoc = {
            ...existingDoc,
            // ... other fields
            address: address || existingDoc.address,
            phoneNumber: phoneNumber || existingDoc.phoneNumber, // Add new field
            profileImageUrl: profileImageBase64 || profileImageUrl || existingDoc.profileImageUrl,
          };
    
          // Handle new face scan submission
                if (pendingFaceDescriptor && pendingFaceDescriptor.length > 0) {
                  updatedDoc.pendingFaceDescriptor = pendingFaceDescriptor;
                  updatedDoc.faceScanStatus = 'pending';
                  updatedDoc.faceScanTimestamp = new Date().toISOString(); // Add timestamp
                  delete updatedDoc.faceDescriptor; 
                }    
          await db.insert(updatedDoc);
          res.status(200).json({ message: 'Profile updated successfully' });
    
        } catch (error) {
          // ...
        }
    // ...  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
