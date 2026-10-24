import React from 'react';
import { VirtualOfficePage } from './components/VirtualOfficePage';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#090d16',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            Terjadi Kesalahan Tampilan
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '20px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Aplikasi mengalami kesalahan saat memuat komponen.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <VirtualOfficePage />
    </ErrorBoundary>
  );
}
