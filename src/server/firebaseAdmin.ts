import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let appInstance: App | null = null;
let authInstance: Auth | null = null;

export function parseFirebaseServiceAccount(rawKey: string, expectedProjectId?: string): any {
  let credentials: any;
  try {
    credentials = JSON.parse(rawKey);
  } catch (err: any) {
    throw new Error(`Firebase service account must be valid JSON: ${err?.message}`);
  }
  if (expectedProjectId && credentials.project_id && credentials.project_id !== expectedProjectId) {
    throw new Error(`Firebase service account project_id "${credentials.project_id}" does not match configured project "${expectedProjectId}"`);
  }
  return credentials;
}

export function getFirebaseApp(): App {
  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = existing[0];
      return appInstance;
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      'gen-lang-client-0282286222';
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        const credentials = parseFirebaseServiceAccount(serviceAccountKey, projectId);
        appInstance = initializeApp({
          credential: cert(credentials),
          projectId,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
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
  if (!authInstance) {
    const app = getFirebaseApp();
    // Lazy load firebase-admin/auth only when authenticated requests require token verification
    // This prevents top-level module load from triggering jwks-rsa -> require('jose') in Vercel Node runtime
    const { getAuth } = require('firebase-admin/auth');
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}
