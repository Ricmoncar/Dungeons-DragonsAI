const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// To use Firebase Admin, you usually need a service account key.
// For now, we'll attempt default initialization.
// User should set GOOGLE_APPLICATION_CREDENTIALS or provide serviceAccountKey.json
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('Firebase Admin initialized');
} catch (error) {
    console.warn('Firebase Admin initialization failed. Make sure to set up credentials.', error.message);
}

const db = admin.database();
const auth = admin.auth();

module.exports = { db, auth };
