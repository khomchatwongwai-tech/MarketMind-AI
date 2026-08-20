import {
  OptionsPaperAccount,
  OptionsOrderRequest,
  OptionsOrderResult,
  OptionsPositionSummary,
  OptionsJournalEntry,
} from '../../types/optionsTrader.js';

const STORAGE_KEY = 'marketmind_options_paper_account_v1';
const INITIAL_BALANCE = 100000; // $100,000 virtual balance

export class OptionsPaperTradingService {
  private account: OptionsPaperAccount;

  constructor() {
    this.account = this.loadAccount();
  }

  private loadAccount(): OptionsPaperAccount {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load paper account from localStorage', e);
    }

    return {
      balance: INITIAL_BALANCE,
      initialBalance: INITIAL_BALANCE,
      equity: INITIAL_BALANCE,
      buyingPower: INITIAL_BALANCE,
      positions: [
        {
          id: 'pos-paper-1',
          symbol: 'SPY260815C00550000',
          underlying: 'SPY',
          type: 'CALL',
          strike: 550,
          expiration: '2026-08-15',
          dte: 0,
          quantity: 2,
          avgEntryPrice: 3.40,
          currentPrice: 4.10,
          marketValue: 820.00,
          unrealizedPLDollar: 140.00,
          unrealizedPLPercent: 20.59,
          delta: 0.54,
          theta: -0.42,
          gamma: 0.035,
          vega: 0.12,
          iv: 0.185,
          riskScore: 78,
          is0DTE: true,
          strategyName: 'Long Call (0DTE Scalp)',
          entryDate: '2026-08-15',
        },
        {
          id: 'pos-paper-2',
          symbol: 'NVDA260822C00140000',
          underlying: 'NVDA',
          type: 'CALL',
          strike: 140,
          expiration: '2026-08-22',
          dte: 7,
          quantity: 3,
          avgEntryPrice: 4.80,
          currentPrice: 5.25,
          marketValue: 1575.00,
          unrealizedPLDollar: 135.00,
          unrealizedPLPercent: 9.38,
          delta: 0.44,
          theta: -0.28,
          gamma: 0.028,
          vega: 0.22,
          iv: 0.485,
          riskScore: 62,
          is0DTE: false,
          strategyName: 'Bull Call Swing (Pre-Earnings)',
          entryDate: '2026-08-14',
        },
      ],
      orderHistory: [
        {
          success: true,
          orderId: 'paper-ord-101',
          idempotencyKey: 'idem-101',
          brokerOrderId: 'PAPER-BKR-101',
          status: 'FILLED',
          filledQuantity: 2,
          averageFillPrice: 3.40,
          timestamp: '10:15:22 ET',
          brokerName: 'MarketMind Paper Trader',
          legs: [
            {
              contractSymbol: 'SPY260815C00550000',
              underlyingSymbol: 'SPY',
              type: 'CALL',
              strike: 550,
              expiration: '2026-08-15',
              action: 'BUY_TO_OPEN',
              quantity: 2,
              currentMid: 3.40,
            },
          ],
          totalCost: 680.00,
          isPaper: true,
        },
        {
          success: true,
          orderId: 'paper-ord-102',
          idempotencyKey: 'idem-102',
          brokerOrderId: 'PAPER-BKR-102',
          status: 'FILLED',
          filledQuantity: 3,
          averageFillPrice: 4.80,
          timestamp: '11:45:09 ET',
          brokerName: 'MarketMind Paper Trader',
          legs: [
            {
              contractSymbol: 'NVDA260822C00140000',
              underlyingSymbol: 'NVDA',
              type: 'CALL',
              strike: 140,
              expiration: '2026-08-22',
              action: 'BUY_TO_OPEN',
              quantity: 3,
              currentMid: 4.80,
            },
          ],
          totalCost: 1440.00,
          isPaper: true,
        },
      ],
      journalEntries: [
        {
          id: 'journ-1',
          timestamp: '2026-08-14 15:30 ET',
          contract: 'QQQ 485 Call (08/15)',
          underlying: 'QQQ',
          strategy: 'Long Call Momentum',
          action: 'EXIT',
          quantity: 2,
          entryPrice: 2.10,
          exitPrice: 3.65,
          pnlDollar: 310.00,
          pnlPercent: 73.81,
          thesis: 'Took scalp on tech breakout past VWAP with bullish unusual flow confirmation.',
          marketMindScore: 84,
          ivAtEntry: 0.198,
          greeksAtEntry: { delta: 0.48, theta: -0.35, gamma: 0.04, vega: 0.14 },
          eventsDuringTrade: ['PPI Core in-line'],
          status: 'CLOSED_WIN',
          notes: 'Disciplined exit at 1st resistance level.',
        },
        {
          id: 'journ-2',
          timestamp: '2026-08-12 11:15 ET',
          contract: 'TSLA 230 Put (08/15)',
          underlying: 'TSLA',
          strategy: 'Long Put Breakdown',
          action: 'EXIT',
          quantity: 1,
          entryPrice: 4.20,
          exitPrice: 3.10,
          pnlDollar: -110.00,
          pnlPercent: -26.19,
          thesis: 'Anticipated break of $225 support floor but stock bounced strongly off 50 EMA.',
          marketMindScore: 58,
          ivAtEntry: 0.52,
          greeksAtEntry: { delta: -0.42, theta: -0.48, gamma: 0.03, vega: 0.25 },
          eventsDuringTrade: [],
          status: 'CLOSED_LOSS',
          notes: 'Cut trade quickly when price reclaimed opening range high.',
        },
      ],
      totalRealizedPL: 200.00,
      totalUnrealizedPL: 275.00,
      winCount: 1,
      lossCount: 1,
    };
  }

  private saveAccount(): void {
    try {
      this.recalculateAccount();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.account));
    } catch (e) {
      console.warn('Failed to save paper account', e);
    }
  }

  private recalculateAccount(): void {
    let positionsValue = 0;
    let unrealized = 0;

    for (const pos of this.account.positions) {
      positionsValue += pos.marketValue;
      unrealized += pos.unrealizedPLDollar;
    }

    this.account.totalUnrealizedPL = Number(unrealized.toFixed(2));
    this.account.equity = Number((this.account.balance + positionsValue).toFixed(2));
    this.account.buyingPower = Number(this.account.balance.toFixed(2));
  }

  public getAccount(): OptionsPaperAccount {
    this.recalculateAccount();
    return { ...this.account };
  }

  public resetAccount(newBalance: number = INITIAL_BALANCE): OptionsPaperAccount {
    this.account = {
      balance: newBalance,
      initialBalance: newBalance,
      equity: newBalance,
      buyingPower: newBalance,
      positions: [],
      orderHistory: [],
      journalEntries: [],
      totalRealizedPL: 0,
      totalUnrealizedPL: 0,
      winCount: 0,
      lossCount: 0,
    };
    this.saveAccount();
    return this.getAccount();
  }

  public submitPaperOrder(req: OptionsOrderRequest): OptionsOrderResult {
    const primaryLeg = req.legs[0];
    const qty = primaryLeg.quantity;
    const price = req.limitPrice || primaryLeg.currentMid;
    const totalCost = Number((price * 100 * qty).toFixed(2));

    // Check buying power for opening orders
    if (primaryLeg.action === 'BUY_TO_OPEN' && totalCost > this.account.buyingPower) {
      return {
        success: false,
        orderId: req.orderId,
        idempotencyKey: req.idempotencyKey,
        status: 'REJECTED',
        timestamp: new Date().toLocaleTimeString('en-US') + ' ET',
        brokerName: 'MarketMind Paper Trader',
        legs: req.legs,
        totalCost: 0,
        rejectionReason: `Insufficient Virtual Buying Power ($${this.account.buyingPower.toFixed(2)} available vs $${totalCost.toFixed(2)} required)`,
        isPaper: true,
      };
    }

    // Execute order
    const isBuy = primaryLeg.action === 'BUY_TO_OPEN';
    const isSellClose = primaryLeg.action === 'SELL_TO_CLOSE';

    if (isBuy) {
      this.account.balance -= totalCost;

      // Add to positions
      const newPos: OptionsPositionSummary = {
        id: `pos-${Date.now()}`,
        symbol: primaryLeg.contractSymbol,
        underlying: primaryLeg.underlyingSymbol,
        type: primaryLeg.type,
        strike: primaryLeg.strike,
        expiration: primaryLeg.expiration,
        dte: primaryLeg.expiration === new Date().toISOString().split('T')[0] ? 0 : 7,
        quantity: qty,
        avgEntryPrice: price,
        currentPrice: price,
        marketValue: totalCost,
        unrealizedPLDollar: 0,
        unrealizedPLPercent: 0,
        delta: primaryLeg.type === 'CALL' ? 0.50 : -0.50,
        theta: -0.25,
        gamma: 0.03,
        vega: 0.15,
        iv: 0.30,
        riskScore: 65,
        is0DTE: primaryLeg.expiration === new Date().toISOString().split('T')[0],
        strategyName: req.strategyName || `${primaryLeg.type} (Paper Trade)`,
        entryDate: new Date().toISOString().split('T')[0],
      };

      this.account.positions.push(newPos);
    } else if (isSellClose) {
      // Find matching position
      const posIndex = this.account.positions.findIndex(
        (p) => p.symbol === primaryLeg.contractSymbol
      );

      if (posIndex >= 0) {
        const pos = this.account.positions[posIndex];
        const proceedTotal = Number((price * 100 * qty).toFixed(2));
        const costBasisPortion = Number((pos.avgEntryPrice * 100 * qty).toFixed(2));
        const realizedPL = Number((proceedTotal - costBasisPortion).toFixed(2));
        const realizedPct = Number(((price - pos.avgEntryPrice) / pos.avgEntryPrice * 100).toFixed(2));

        this.account.balance += proceedTotal;
        this.account.totalRealizedPL += realizedPL;

        if (realizedPL >= 0) {
          this.account.winCount += 1;
        } else {
          this.account.lossCount += 1;
        }

        // Add journal entry
        const journal: OptionsJournalEntry = {
          id: `journ-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-US'),
          contract: `${pos.underlying} $${pos.strike} ${pos.type} (${pos.expiration})`,
          underlying: pos.underlying,
          strategy: pos.strategyName || 'Options Trade',
          action: 'EXIT',
          quantity: qty,
          entryPrice: pos.avgEntryPrice,
          exitPrice: price,
          pnlDollar: realizedPL,
          pnlPercent: realizedPct,
          thesis: `Simulated paper trade exit at $${price.toFixed(2)}.`,
          marketMindScore: 75,
          ivAtEntry: pos.iv,
          greeksAtEntry: { delta: pos.delta, theta: pos.theta, gamma: pos.gamma, vega: pos.vega },
          eventsDuringTrade: [],
          status: realizedPL >= 0 ? 'CLOSED_WIN' : 'CLOSED_LOSS',
          notes: 'Executed via MarketMind Paper Trader™.',
        };
        this.account.journalEntries.unshift(journal);

        // Reduce or remove position
        if (pos.quantity <= qty) {
          this.account.positions.splice(posIndex, 1);
        } else {
          pos.quantity -= qty;
          pos.marketValue = Number((pos.currentPrice * 100 * pos.quantity).toFixed(2));
        }
      }
    }

    const orderResult: OptionsOrderResult = {
      success: true,
      orderId: req.orderId,
      idempotencyKey: req.idempotencyKey,
      brokerOrderId: `PAPER-${Date.now()}`,
      status: 'FILLED',
      filledQuantity: qty,
      averageFillPrice: price,
      timestamp: new Date().toLocaleTimeString('en-US') + ' ET',
      brokerName: 'MarketMind Paper Trader',
      legs: req.legs,
      limitPrice: price,
      totalCost,
      isPaper: true,
    };

    this.account.orderHistory.unshift(orderResult);
    this.saveAccount();

    return orderResult;
  }

  public addJournalEntry(entry: Omit<OptionsJournalEntry, 'id'>): OptionsJournalEntry {
    const newEntry: OptionsJournalEntry = {
      ...entry,
      id: `journ-${Date.now()}`,
    };
    this.account.journalEntries.unshift(newEntry);
    this.saveAccount();
    return newEntry;
  }
}

export const optionsPaperTradingService = new OptionsPaperTradingService();
