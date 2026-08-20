import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../config/firebase.js';
import { UserProfile, Watchlist, SavedAlert, HistoricalPrediction, SupportTicket } from '../types/user.js';

export class FirestoreService {
  // --- USER PROFILE ---
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  static async syncUserProfile(user: UserProfile): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static subscribeUserProfile(userId: string, onUpdate: (user: UserProfile) => void): Unsubscribe {
    const path = `users/${userId}`;
    return onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as UserProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  // --- WATCHLISTS ---
  static async getWatchlists(userId: string): Promise<Watchlist[]> {
    const path = `users/${userId}/watchlists`;
    try {
      const q = query(collection(db, 'users', userId, 'watchlists'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Watchlist);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  static async saveWatchlist(userId: string, watchlist: Watchlist): Promise<void> {
    const path = `users/${userId}/watchlists/${watchlist.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'watchlists', watchlist.id), {
        ...watchlist,
        userId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async deleteWatchlist(userId: string, watchlistId: string): Promise<void> {
    const path = `users/${userId}/watchlists/${watchlistId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'watchlists', watchlistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  static subscribeWatchlists(userId: string, onUpdate: (lists: Watchlist[]) => void): Unsubscribe {
    const path = `users/${userId}/watchlists`;
    const q = query(collection(db, 'users', userId, 'watchlists'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const lists = snap.docs.map((d) => d.data() as Watchlist);
        onUpdate(lists);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }

  // --- SAVED ALERTS ---
  static async getAlerts(userId: string): Promise<SavedAlert[]> {
    const path = `users/${userId}/alerts`;
    try {
      const q = query(collection(db, 'users', userId, 'alerts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as SavedAlert);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  static async saveAlert(userId: string, alert: SavedAlert): Promise<void> {
    const path = `users/${userId}/alerts/${alert.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'alerts', alert.id), {
        ...alert,
        userId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async deleteAlert(userId: string, alertId: string): Promise<void> {
    const path = `users/${userId}/alerts/${alertId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'alerts', alertId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  static subscribeAlerts(userId: string, onUpdate: (alerts: SavedAlert[]) => void): Unsubscribe {
    const path = `users/${userId}/alerts`;
    const q = query(collection(db, 'users', userId, 'alerts'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const alerts = snap.docs.map((d) => d.data() as SavedAlert);
        onUpdate(alerts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }

  // --- HISTORICAL PREDICTIONS ---
  static async getPredictions(userId: string): Promise<HistoricalPrediction[]> {
    const path = `users/${userId}/predictions`;
    try {
      const q = query(collection(db, 'users', userId, 'predictions'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as HistoricalPrediction);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  static async savePrediction(userId: string, prediction: HistoricalPrediction): Promise<void> {
    const path = `users/${userId}/predictions/${prediction.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'predictions', prediction.id), {
        ...prediction,
        userId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static subscribePredictions(userId: string, onUpdate: (preds: HistoricalPrediction[]) => void): Unsubscribe {
    const path = `users/${userId}/predictions`;
    const q = query(collection(db, 'users', userId, 'predictions'), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const preds = snap.docs.map((d) => d.data() as HistoricalPrediction);
        onUpdate(preds);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }

  // --- SUPPORT TICKETS ---
  static async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    const path = 'supportTickets';
    try {
      const ref = collection(db, 'supportTickets');
      const q = userId ? query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc')) : query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as SupportTicket);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  static async createSupportTicket(ticket: SupportTicket): Promise<void> {
    const path = `supportTickets/${ticket.id}`;
    try {
      await setDoc(doc(db, 'supportTickets', ticket.id), ticket);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    const path = `supportTickets/${ticketId}`;
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
