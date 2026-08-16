import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let appInstance: App | null = null;

export function getFirebaseApp(): App {
  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = existing[0];
      return appInstance;
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      'ai-studio-marketmindai-52b43fbe-5366-4a57-8a3b-5ac098b91d46';
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        appInstance = initializeApp({
          credential: cert(credentials),
          projectId,
        });
      } catch (err) {
        console.warn(
          '[FirebaseAdmin] Failed to parse service account credentials, using project default initialization',
          err
        );
        appInstance = initializeApp({ projectId });
      }
    } else {
      // In Cloud Run / GCP runtime or dev container, initialize with project ID
      appInstance = initializeApp({ projectId });
    }
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  return getAuth(app);
}

export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}
