import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Terrascope caught an unhandled UI error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/workbench';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F6F8F5',
            padding: 24,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 540,
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #DCE6DC',
              padding: '32px 28px',
              boxShadow: '0 12px 36px rgba(16, 59, 50, 0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#103B32',
                margin: '0 0 8px 0',
              }}
            >
              Report View Encountered an Issue
            </h2>

            <p
              style={{
                fontSize: 13.5,
                color: '#485A54',
                lineHeight: 1.5,
                margin: '0 0 20px 0',
              }}
            >
              An unexpected error occurred while rendering this view. You can refresh the page or return to the Workbench to continue your analysis.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  backgroundColor: '#FFFFFF',
                  color: '#103B32',
                  border: '1px solid #C4D3C5',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  backgroundColor: '#103B32',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Home size={14} />
                <span>Return to Workbench</span>
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: '#F6F8F5',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #DCE6DC',
                  fontSize: 12,
                  color: '#485A54',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#103B32' }}>
                  Technical Details
                </summary>
                <pre
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#B91C1C',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
