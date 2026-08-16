import { initializeApp, cert, applicationDefault, getApps, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let appInstance: App | null = null;

export interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export function parseFirebaseServiceAccount(raw: string | undefined, expectedProjectId: string | undefined): FirebaseServiceAccount {
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON'); }
  if (!value || typeof value !== 'object') throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be a JSON object');
  const account = value as Record<string, unknown>;
  for (const field of ['project_id', 'client_email', 'private_key'] as const) {
    if (typeof account[field] !== 'string' || !(account[field] as string).trim()) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY is missing ${field}`);
    }
  }
  if (expectedProjectId && account.project_id !== expectedProjectId) {
    throw new Error('Firebase service-account project_id does not match FIREBASE_PROJECT_ID');
  }
  if (!(account.client_email as string).includes('@') || !(account.private_key as string).includes('BEGIN PRIVATE KEY')) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid credential fields');
  }
  return account as unknown as FirebaseServiceAccount;
}

export function getFirebaseApp(): App {
  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = existing[0];
      return appInstance;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (process.env.NODE_ENV === 'production') {
      const credentials = parseFirebaseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, projectId);
      appInstance = initializeApp({ credential: cert(credentials as ServiceAccount), projectId });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const credentials = parseFirebaseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, projectId);
      appInstance = initializeApp({ credential: cert(credentials as ServiceAccount), projectId: projectId || credentials.project_id });
    } else {
      appInstance = initializeApp({ credential: applicationDefault(), projectId });
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
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  if (process.env.NODE_ENV === 'production' && !databaseId) throw new Error('FIREBASE_DATABASE_ID is required');
  return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}
