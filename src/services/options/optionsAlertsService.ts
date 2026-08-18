import { OptionsAlertRule, OptionAlertCondition } from '../../types/optionsTrader';

const STORAGE_KEY = 'marketmind_options_alert_rules_v1';

export class OptionsAlertsService {
  private alerts: OptionsAlertRule[] = [];

  constructor() {
    this.alerts = this.loadAlerts();
  }

  private loadAlerts(): OptionsAlertRule[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load options alerts', e);
    }

    return [
      {
        id: 'alert-1',
        symbol: 'SPY',
        contractSymbol: 'SPY260815P00545000',
        condition: 'IV_ABOVE',
        targetValue: 30.0,
        description: 'Alert if SPY 545 Put IV rises above 30%',
        createdAt: '2026-08-15 09:30 ET',
        isActive: true,
        triggered: false,
      },
      {
        id: 'alert-2',
        symbol: 'NVDA',
        condition: 'UNUSUAL_VOLUME_SPIKE',
        targetValue: 3.0,
        description: 'Alert if NVDA call options volume surges >3.0x 30-day average',
        createdAt: '2026-08-15 10:00 ET',
        isActive: true,
        triggered: true,
        triggeredAt: '2026-08-15 14:15 ET (Volume surged 4.54x)',
      },
      {
        id: 'alert-3',
        symbol: 'QQQ',
        contractSymbol: 'QQQ260815C00485000',
        condition: 'PRICE_DROP_PCT',
        targetValue: 50.0,
        description: 'Alert if QQQ 485 Call loses 50% of entry premium',
        createdAt: '2026-08-15 11:00 ET',
        isActive: true,
        triggered: false,
      },
      {
        id: 'alert-4',
        symbol: 'TSLA',
        condition: 'EARNINGS_BEFORE_EXP',
        targetValue: 'EARNINGS_EVENT',
        description: 'Alert if TSLA scheduled earnings occurs within current contract expiration cycle',
        createdAt: '2026-08-14 16:00 ET',
        isActive: true,
        triggered: false,
      },
    ];
  }

  private saveAlerts(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (e) {
      console.warn('Failed to save options alerts', e);
    }
  }

  public getAlerts(): OptionsAlertRule[] {
    return [...this.alerts];
  }

  public addAlert(alert: Omit<OptionsAlertRule, 'id' | 'createdAt' | 'triggered'>): OptionsAlertRule {
    const newAlert: OptionsAlertRule = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('en-US') + ' ET',
      triggered: false,
    };
    this.alerts.unshift(newAlert);
    this.saveAlerts();
    return newAlert;
  }

  public toggleAlert(id: string): void {
    const target = this.alerts.find((a) => a.id === id);
    if (target) {
      target.isActive = !target.isActive;
      this.saveAlerts();
    }
  }

  public deleteAlert(id: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== id);
    this.saveAlerts();
  }
}

export const optionsAlertsService = new OptionsAlertsService();
