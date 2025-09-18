import { Webhook } from 'svix';
import { buffer } from 'micro';
import dbConnect from '../../../lib/database';
import Student from '../../../models/Student';

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

  // Get the headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const body = (await buffer(req)).toString();

  // Create a new Webhook instance with your secret
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

  await dbConnect();

  try {
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      if (!email) {
        console.error('Clerk user created event missing email:', evt.data);
        return res.status(400).json({ message: 'User email missing' });
      }

      await Student.create({
        clerkId: id,
        email,
        name,
        profileImageUrl: image_url,
        // role: 'student', // Role is implicit for Student collection
        onboardingComplete: false, // New students need to onboard
        password: 'CLERK_MANAGED_PASSWORD', // Placeholder for password, as Clerk manages it
      });

      console.log(`Clerk user ${id} created and synced to DB.`);

    } else if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      if (!email) {
        console.error('Clerk user updated event missing email:', evt.data);
        return res.status(400).json({ message: 'User email missing' });
      }

      await Student.findOneAndUpdate(
        { clerkId: id },
        {
          email,
          name,
          profileImageUrl: image_url,
        },
        { new: true, upsert: true } // upsert: true will create if not found
      );

      console.log(`Clerk user ${id} updated and synced to DB.`);
    }

    res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}