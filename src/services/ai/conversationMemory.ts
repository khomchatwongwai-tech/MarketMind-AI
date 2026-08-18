/**
 * MarketMind AI - Bounded Conversational Memory Manager
 * Tracks authenticated conversation sessions, maintaining topic continuity for follow-up queries.
 * CRITICAL RULE: Fresh verified market data ALWAYS overrides conversational memory.
 */

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  focusedSymbol?: string;
  intent?: string;
}

export interface ConversationSession {
  sessionId: string;
  userId?: string;
  focusedSymbol?: string;
  turns: ConversationTurn[];
  lastUpdated: number;
}

export class ConversationMemoryManager {
  private static sessions = new Map<string, ConversationSession>();
  private static MAX_TURNS_PER_SESSION = 8;
  private static SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Get or create a session for a user or anonymous ID
   */
  public static getSession(sessionId: string, userId?: string): ConversationSession {
    this.cleanExpiredSessions();

    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        turns: [],
        lastUpdated: Date.now(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Record a new turn in conversational memory
   */
  public static recordTurn(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    meta: { focusedSymbol?: string; intent?: string; userId?: string } = {}
  ): void {
    const session = this.getSession(sessionId, meta.userId);
    if (meta.focusedSymbol) {
      session.focusedSymbol = meta.focusedSymbol.toUpperCase().trim();
    }

    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role,
      content,
      timestamp: Date.now(),
      focusedSymbol: meta.focusedSymbol,
      intent: meta.intent,
    };

    session.turns.push(turn);
    if (session.turns.length > this.MAX_TURNS_PER_SESSION) {
      session.turns.shift();
    }
    session.lastUpdated = Date.now();
  }

  /**
   * Get conversational history formatted for Gemini context injection
   */
  public static getFormattedHistory(sessionId: string): Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> {
    const session = this.sessions.get(sessionId);
    if (!session || session.turns.length === 0) return [];

    return session.turns.map((t) => ({
      role: t.role === 'user' ? 'user' : 'model',
      parts: [{ text: t.content }],
    }));
  }

  /**
   * Clear session on reset or logout
   */
  public static clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private static cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [id, s] of this.sessions.entries()) {
      if (now - s.lastUpdated > this.SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}
