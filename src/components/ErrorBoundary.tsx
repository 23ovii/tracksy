import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex w-full justify-center p-6">
          <section className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-white/5 p-10 text-center text-slate-200 shadow-glow">
            <p className="text-sm uppercase tracking-[0.32em] text-spotify-green">Error</p>
            <h2 className="mt-6 text-3xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-4 font-mono text-xs text-slate-400">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-spotify-green px-6 py-2 text-sm font-semibold text-black hover:bg-green-400"
            >
              Reload page
            </button>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
