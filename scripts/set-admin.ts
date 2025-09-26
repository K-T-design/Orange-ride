
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

// --- CONFIGURATION ---
// Get the email from command line arguments
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address as an argument.');
  process.exit(1);
}

// Path to your service account key JSON file
const serviceAccountPath = './serviceAccountKey.json';

// --- SCRIPT LOGIC (No need to edit below) ---

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  // Initialize the Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log(`Attempting to grant admin privileges to: ${email}`);

  // Get the user by email
  admin.auth().getUserByEmail(email)
    .then((user) => {
      // Check if user is already an admin
      if (user.customClaims && (user.customClaims as any).admin === true) {
        console.log(`User ${email} is already an admin.`);
        process.exit(0);
      }
      
      // Set the custom claim 'admin' to true
      return admin.auth().setCustomUserClaims(user.uid, { admin: true });
    })
    .then(() => {
      console.log(`Successfully promoted ${email} to admin.`);
      console.log('NOTE: The user may need to log out and log back in for the changes to take effect.');
      process.exit(0);
    })
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        console.error(`Error: User with email ${email} not found.`);
      } else {
        console.error('Error setting custom claims:', error);
      }
      process.exit(1);
    });

} catch (error: any) {
    if (error.code === 'ENOENT') {
        console.error('\nERROR: `serviceAccountKey.json` not found.');
        console.error('Please download the service account key from your Firebase project settings and place it in the root of the project.');
        console.log('Firebase Console > Project Settings > Service accounts > Generate new private key');
    } else {
        console.error('An unexpected error occurred:', error.message);
    }
    process.exit(1);
}
