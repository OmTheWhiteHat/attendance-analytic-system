import { Webhook } from 'svix';
import { buffer } from 'micro';
import dbConnect from '../../../lib/couchdb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('You need to add CLERK_WEBHOOK_SECRET to your .env.local');
  }

  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ message: 'Error occurred -- no svix headers' });
  }

  const body = (await buffer(req)).toString();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ message: err.message });
  }

  const eventType = evt.type;

  try {
    const nano = await dbConnect();
    const db = nano.db.use('smartattend');

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;
      
      if (!email) {
        console.error('Clerk user.created event missing email:', evt.data);
        return res.status(400).json({ message: 'User email is required' });
      }

      const studentDoc = {
        _id: `user:${id}`,
        type: 'user',
        role: 'student',
        clerkId: id,
        email,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        profileImageUrl: image_url,
        onboardingComplete: false,
        status: 'pending', // New accounts require admin approval
      };

      await db.insert(studentDoc);
      console.log(`Clerk user ${id} created and synced to CouchDB.`);

    } else if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;

      if (!email) {
        console.error('Clerk user.updated event missing email:', evt.data);
        return res.status(400).json({ message: 'User email is required' });
      }
      
      const docId = `user:${id}`;
      
      // To update, we must fetch the latest revision (_rev) of the document
      const existingDoc = await db.get(docId);
      
      const updatedDoc = {
        ...existingDoc, // Preserve existing fields and _rev
        email,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        profileImageUrl: image_url,
      };

      await db.insert(updatedDoc);
      console.log(`Clerk user ${id} updated and synced to CouchDB.`);
    }

    res.status(200).json({ message: 'Webhook received successfully' });

  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    // Avoid sending back detailed error messages in production
    res.status(500).json({ message: 'Internal Server Error' });
  }
}