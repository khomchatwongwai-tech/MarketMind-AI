import React from 'react';

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    const sanitizedMsg = error?.message
      ? error.message.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')
      : 'An unexpected application error occurred.';

    return {
      hasError: true,
      errorMessage: sanitizedMsg,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[MarketMind AI ErrorBoundary Caught Error]:', {
      message: error?.message,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleResetCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('marketmind_theme_preference');
        localStorage.removeItem('marketmind_language_preference');
        sessionStorage.clear();
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0f1013] text-[#e2e8f0] font-sans flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#181a20] border border-[#2a2e39] rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
              MarketMind AI is Temporarily Unavailable
            </h1>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected error initializing the market engine. Please refresh or reset your application session.
            </p>

            {this.state.errorMessage && (
              <div className="mb-6 p-3 bg-red-950/30 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs font-mono text-red-300 break-words line-clamp-3">
                  {this.state.errorMessage}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Application
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2 px-4 bg-[#232733] hover:bg-[#2c3140] text-slate-300 font-medium text-xs rounded-lg transition-colors border border-[#363c4e]"
              >
                Clear Preferences & Retry
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#2a2e39]/60 text-center">
              <p className="text-[11px] text-slate-500 font-mono">
                MarketMind AI Quant Engine v2.0 • Institutional Protection Active
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
