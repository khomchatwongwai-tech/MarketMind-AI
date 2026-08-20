import { MarketSessionType, RealTimeDataMode } from '../../types/realtime.js';

export interface MarketSessionInfo {
  session: MarketSessionType;
  sessionName: string;
  isOpen: boolean;
  isExtendedHours: boolean;
  timeET: string;
  nextOpen?: string;
  nextClose?: string;
  isHoliday: boolean;
  holidayName?: string;
}

export class MarketSessionEngine {
  // Common US Stock Market Holidays (Month is 0-indexed: 0 = Jan, 11 = Dec)
  private static isUSMarketHoliday(dateET: Date): { isHoliday: boolean; name?: string } {
    const year = dateET.getFullYear();
    const month = dateET.getMonth();
    const day = dateET.getDate();
    const dayOfWeek = dateET.getDay(); // 0 = Sun, 6 = Sat

    // New Year's Day (Jan 1, or observed Jan 2 if Sun)
    if ((month === 0 && day === 1) || (month === 0 && day === 2 && dayOfWeek === 1)) {
      return { isHoliday: true, name: "New Year's Day" };
    }

    // Martin Luther King Jr. Day (3rd Monday of Jan)
    if (month === 0 && dayOfWeek === 1 && day >= 15 && day <= 21) {
      return { isHoliday: true, name: 'Martin Luther King Jr. Day' };
    }

    // Presidents' Day (3rd Monday of Feb)
    if (month === 1 && dayOfWeek === 1 && day >= 15 && day <= 21) {
      return { isHoliday: true, name: "Presidents' Day" };
    }

    // Memorial Day (Last Monday of May)
    if (month === 4 && dayOfWeek === 1 && day >= 25) {
      return { isHoliday: true, name: 'Memorial Day' };
    }

    // Juneteenth (June 19, or observed if weekend)
    if (month === 5 && (day === 19 || (day === 20 && dayOfWeek === 1) || (day === 18 && dayOfWeek === 5))) {
      return { isHoliday: true, name: 'Juneteenth National Independence Day' };
    }

    // Independence Day (July 4, or observed July 5 if Sun / July 3 if Sat)
    if (month === 6 && (day === 4 || (day === 5 && dayOfWeek === 1) || (day === 3 && dayOfWeek === 5))) {
      return { isHoliday: true, name: 'Independence Day' };
    }

    // Labor Day (1st Monday of Sep)
    if (month === 8 && dayOfWeek === 1 && day <= 7) {
      return { isHoliday: true, name: 'Labor Day' };
    }

    // Thanksgiving Day (4th Thursday of Nov)
    if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) {
      return { isHoliday: true, name: 'Thanksgiving Day' };
    }

    // Christmas Day (Dec 25, or observed)
    if (month === 11 && (day === 25 || (day === 26 && dayOfWeek === 1) || (day === 24 && dayOfWeek === 5))) {
      return { isHoliday: true, name: 'Christmas Day' };
    }

    return { isHoliday: false };
  }

  /**
   * Returns current Date in America/New_York timezone
   */
  public static getETDate(now: Date = new Date()): Date {
    const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(etString);
  }

  /**
   * Determine session for standard US Equities / ETFs
   */
  public static getUSEquitySession(date: Date = new Date()): MarketSessionInfo {
    const et = this.getETDate(date);
    const dayOfWeek = et.getDay(); // 0 = Sun, 6 = Sat
    const hours = et.getHours();
    const minutes = et.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const timeET = et.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' ET';

    // Check Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        session: 'WEEKEND',
        sessionName: 'Weekend (Market Closed)',
        isOpen: false,
        isExtendedHours: false,
        timeET,
        nextOpen: 'Mon 09:30 AM ET',
        isHoliday: false,
      };
    }

    // Check Holiday
    const holidayCheck = this.isUSMarketHoliday(et);
    if (holidayCheck.isHoliday) {
      return {
        session: 'CLOSED',
        sessionName: `Market Closed (${holidayCheck.name})`,
        isOpen: false,
        isExtendedHours: false,
        timeET,
        nextOpen: 'Next Business Day 09:30 AM ET',
        isHoliday: true,
        holidayName: holidayCheck.name,
      };
    }

    // Pre-Market: 04:00 (240 mins) to 09:30 (570 mins)
    if (currentMinutes >= 240 && currentMinutes < 570) {
      return {
        session: 'PRE',
        sessionName: 'Pre-Market Session',
        isOpen: true,
        isExtendedHours: true,
        timeET,
        nextOpen: '09:30 AM ET (Regular Open)',
        nextClose: '08:00 PM ET',
        isHoliday: false,
      };
    }

    // Regular Session: 09:30 (570 mins) to 16:00 (960 mins)
    if (currentMinutes >= 570 && currentMinutes < 960) {
      return {
        session: 'OPEN',
        sessionName: 'Regular Trading Hours',
        isOpen: true,
        isExtendedHours: false,
        timeET,
        nextClose: '04:00 PM ET (Regular Close)',
        isHoliday: false,
      };
    }

    // After-Hours: 16:00 (960 mins) to 20:00 (1200 mins)
    if (currentMinutes >= 960 && currentMinutes < 1200) {
      return {
        session: 'AFTER',
        sessionName: 'After-Hours Session',
        isOpen: true,
        isExtendedHours: true,
        timeET,
        nextClose: '08:00 PM ET (After-Hours Close)',
        isHoliday: false,
      };
    }

    // Closed (Overnight)
    return {
      session: 'CLOSED',
      sessionName: 'Market Closed (Overnight)',
      isOpen: false,
      isExtendedHours: false,
      timeET,
      nextOpen: '04:00 AM ET (Pre-Market) / 09:30 AM ET (Regular)',
      isHoliday: false,
    };
  }

  /**
   * Determine session for Crypto (24/7)
   */
  public static getCryptoSession(date: Date = new Date()): MarketSessionInfo {
    const et = this.getETDate(date);
    const timeET = et.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' ET';

    return {
      session: '24/7',
      sessionName: '24/7 Continuous Trading',
      isOpen: true,
      isExtendedHours: false,
      timeET,
      isHoliday: false,
    };
  }

  /**
   * Determine session for Forex (24/5: Sun 5 PM ET to Fri 5 PM ET)
   */
  public static getForexSession(date: Date = new Date()): MarketSessionInfo {
    const et = this.getETDate(date);
    const dayOfWeek = et.getDay();
    const hours = et.getHours();
    const minutes = et.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const timeET = et.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' ET';

    // Saturday: closed
    if (dayOfWeek === 6) {
      return {
        session: 'WEEKEND',
        sessionName: 'Forex Closed (Weekend)',
        isOpen: false,
        isExtendedHours: false,
        timeET,
        nextOpen: 'Sun 05:00 PM ET',
        isHoliday: false,
      };
    }

    // Sunday before 5 PM ET: closed
    if (dayOfWeek === 0 && currentMinutes < 17 * 60) {
      return {
        session: 'WEEKEND',
        sessionName: 'Forex Closed (Weekend)',
        isOpen: false,
        isExtendedHours: false,
        timeET,
        nextOpen: 'Sun 05:00 PM ET',
        isHoliday: false,
      };
    }

    // Friday after 5 PM ET: closed
    if (dayOfWeek === 5 && currentMinutes >= 17 * 60) {
      return {
        session: 'WEEKEND',
        sessionName: 'Forex Closed (Weekend)',
        isOpen: false,
        isExtendedHours: false,
        timeET,
        nextOpen: 'Sun 05:00 PM ET',
        isHoliday: false,
      };
    }

    return {
      session: 'OPEN',
      sessionName: 'Forex Global Session',
      isOpen: true,
      isExtendedHours: false,
      timeET,
      nextClose: 'Fri 05:00 PM ET',
      isHoliday: false,
    };
  }

  /**
   * Dispatches session calculation by symbol / asset type
   */
  public static getSessionForSymbol(symbol: string, date: Date = new Date()): MarketSessionInfo {
    const cleanSym = (symbol || '').toUpperCase();
    if (
      cleanSym.includes('BTC') ||
      cleanSym.includes('ETH') ||
      cleanSym.includes('SOL') ||
      cleanSym.includes('-USD') ||
      cleanSym.startsWith('X:') ||
      cleanSym.includes('USDT')
    ) {
      return this.getCryptoSession(date);
    }
    if (cleanSym.includes('=X') || cleanSym.startsWith('C:') || (cleanSym.length === 6 && cleanSym.endsWith('USD'))) {
      return this.getForexSession(date);
    }
    return this.getUSEquitySession(date);
  }

  /**
   * Evaluates freshness and stale status based on market context
   */
  public static evaluateFreshness(
    symbol: string,
    quoteTimestamp: number,
    now: number = Date.now(),
    entitlement: 'REAL_TIME' | 'DELAYED' = 'REAL_TIME'
  ): { stale: boolean; mode: RealTimeDataMode; ageMs: number } {
    const session = this.getSessionForSymbol(symbol, new Date(now));
    const ageMs = Math.max(0, now - quoteTimestamp);

    if (session.session === 'WEEKEND' || (session.session === 'CLOSED' && !session.isOpen)) {
      return {
        stale: false, // Closing quote from last session is valid, not stale
        mode: 'CLOSED',
        ageMs,
      };
    }

    if (session.session === '24/7') {
      const isStale = ageMs > 30000; // 30s threshold for 24/7 crypto
      return {
        stale: isStale,
        mode: isStale ? 'CACHED' : entitlement === 'REAL_TIME' ? 'REAL_TIME' : 'DELAYED',
        ageMs,
      };
    }

    // Active equity session (PRE, OPEN, AFTER)
    const thresholdMs = entitlement === 'DELAYED' ? 20 * 60 * 1000 : 45000;
    const isStale = ageMs > thresholdMs;

    return {
      stale: isStale,
      mode: isStale ? 'CACHED' : entitlement === 'REAL_TIME' ? 'REAL_TIME' : 'DELAYED',
      ageMs,
    };
  }
}
