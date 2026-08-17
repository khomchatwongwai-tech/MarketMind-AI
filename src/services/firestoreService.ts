/** Firebase remains the identity provider; Supabase stores application data. */
import { auth } from '../config/firebase';
import { requireSupabase } from '../config/supabase';
import { UserProfile, Watchlist, SavedAlert, HistoricalPrediction, SupportTicket } from '../types/user';

type Unsubscribe = () => void;
function assertOwner(userId: string): void {
  if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Authenticated user does not own the requested data.');
}
function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(`Supabase persistence failed: ${error.message}`);
}
function subscribeOwned<T>(table: string, userId: string, loader: () => Promise<T[]>, onUpdate: (items: T[]) => void): Unsubscribe {
  assertOwner(userId);
  const client = requireSupabase();
  const channel = client.channel(`${table}:${userId}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: `firebase_uid=eq.${userId}` }, () => {
      void loader().then(onUpdate).catch((error) => console.error(`[SupabaseRealtime] ${table} refresh failed`, error));
    }).subscribe();
  void loader().then(onUpdate);
  return () => { void client.removeChannel(channel); };
}

// The class name is retained to avoid rewriting UI consumers during the incremental migration.
export class FirestoreService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    assertOwner(userId);
    const { data, error } = await requireSupabase().from('user_profiles').select('firebase_uid,email,profile,role,plan,subscription_status,created_at').eq('firebase_uid', userId).maybeSingle();
    throwIfError(error);
    if (!data) return null;
    return { ...(data.profile as UserProfile), id: data.firebase_uid, email: data.email, role: data.role, plan: data.plan, subscriptionStatus: data.subscription_status, createdAt: data.created_at };
  }
  static async syncUserProfile(user: UserProfile): Promise<void> {
    assertOwner(user.id);
    const safeProfile = { ...user } as Record<string, unknown>;
    for (const key of ['role','plan','planTier','selectedPlan','subscriptionStatus','paymentCustomerId','paymentSubscriptionId','apiKeys']) delete safeProfile[key];
    const { error } = await requireSupabase().from('user_profiles').upsert({ firebase_uid: user.id, email: user.email, profile: safeProfile }, { onConflict: 'firebase_uid' });
    throwIfError(error);
  }
  static subscribeUserProfile(userId: string, onUpdate: (user: UserProfile) => void): Unsubscribe {
    assertOwner(userId);
    const client = requireSupabase();
    const channel = client.channel(`profile:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `firebase_uid=eq.${userId}` }, () => {
        void this.getUserProfile(userId).then((user) => { if (user) onUpdate(user); });
      }).subscribe();
    return () => { void client.removeChannel(channel); };
  }

  static async getWatchlists(userId: string): Promise<Watchlist[]> { return this.getOwned<Watchlist>('watchlists', userId); }
  static async saveWatchlist(userId: string, value: Watchlist): Promise<void> { return this.saveOwned('watchlists', userId, value.id, value); }
  static async deleteWatchlist(userId: string, id: string): Promise<void> { return this.deleteOwned('watchlists', userId, id); }
  static subscribeWatchlists(userId: string, onUpdate: (items: Watchlist[]) => void): Unsubscribe { return subscribeOwned('watchlists', userId, () => this.getWatchlists(userId), onUpdate); }
  static async getAlerts(userId: string): Promise<SavedAlert[]> { return this.getOwned<SavedAlert>('alerts', userId); }
  static async saveAlert(userId: string, value: SavedAlert): Promise<void> { return this.saveOwned('alerts', userId, value.id, value); }
  static async deleteAlert(userId: string, id: string): Promise<void> { return this.deleteOwned('alerts', userId, id); }
  static subscribeAlerts(userId: string, onUpdate: (items: SavedAlert[]) => void): Unsubscribe { return subscribeOwned('alerts', userId, () => this.getAlerts(userId), onUpdate); }
  static async getPredictions(userId: string): Promise<HistoricalPrediction[]> { return this.getOwned<HistoricalPrediction>('prediction_history', userId); }
  static async savePrediction(userId: string, value: HistoricalPrediction): Promise<void> { return this.saveOwned('prediction_history', userId, value.id, value); }
  static subscribePredictions(userId: string, onUpdate: (items: HistoricalPrediction[]) => void): Unsubscribe { return subscribeOwned('prediction_history', userId, () => this.getPredictions(userId), onUpdate); }
  static async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    if (!userId) throw new Error('Administrative support access must use an authenticated server route.');
    return this.getOwned<SupportTicket>('support_tickets', userId);
  }
  static async createSupportTicket(ticket: SupportTicket): Promise<void> {
    assertOwner(ticket.userId);
    const { error } = await requireSupabase().from('support_tickets').insert({ id: ticket.id, firebase_uid: ticket.userId, status: ticket.status, data: ticket });
    throwIfError(error);
  }
  static async updateSupportTicket(_ticketId: string, _updates: Partial<SupportTicket>): Promise<void> { throw new Error('Support ticket changes require an authorized server route.'); }

  private static async getOwned<T>(table: string, userId: string): Promise<T[]> {
    assertOwner(userId);
    const { data, error } = await requireSupabase().from(table).select('data').eq('firebase_uid', userId).order('created_at', { ascending: false });
    throwIfError(error);
    return (data || []).map((row: any) => row.data as T);
  }
  private static async saveOwned<T extends object>(table: string, userId: string, id: string, data: T): Promise<void> {
    assertOwner(userId);
    const { error } = await requireSupabase().from(table).upsert({ id, firebase_uid: userId, data }, { onConflict: 'id' });
    throwIfError(error);
  }
  private static async deleteOwned(table: string, userId: string, id: string): Promise<void> {
    assertOwner(userId);
    const { error } = await requireSupabase().from(table).delete().eq('id', id).eq('firebase_uid', userId);
    throwIfError(error);
  }
}
