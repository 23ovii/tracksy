import React from 'react';
import type { ReactNode } from 'react';

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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', padding: 24 }}>
          <section style={{
            width: '100%', maxWidth: 768, borderRadius: 24,
            border: '1px solid var(--border2)',
            background: 'var(--surface)',
            padding: 40, textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--green)' }}>
              Error
            </p>
            <h2 style={{ marginTop: 24, fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>
              Something went wrong
            </h2>
            <p style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)' }}>
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 24, borderRadius: 999,
                background: 'var(--green)', padding: '8px 24px',
                fontSize: 14, fontWeight: 600, color: '#000',
                border: 'none', cursor: 'pointer',
              }}
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
