import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Globe } from 'lucide-react';
import '../styles/terrascope.css';

const NotFoundPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '70vh',
        padding: '40px 24px',
        backgroundColor: 'var(--ts-bg)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--ts-mint-subtle)',
          color: 'var(--ts-forest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          border: '1px solid var(--ts-mint)',
        }}
      >
        <Globe size={32} />
      </div>

      <span className="ts-step-badge" style={{ marginBottom: 12 }}>
        ERROR 404 &bull; COORDINATE OUT OF BOUNDS
      </span>

      <h1
        className="ts-serif"
        style={{
          fontSize: 32,
          color: 'var(--ts-forest)',
          margin: '0 0 12px',
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          color: 'var(--ts-text-secondary)',
          maxWidth: 460,
          marginBottom: 28,
          fontSize: 15,
          lineHeight: 1.6,
        }}
      >
        The planetary dataset, telemetry report, or route you are attempting to access does not exist or has moved.
      </p>

      <Link
        to="/workbench"
        className="ts-btn-action-primary"
        style={{
          textDecoration: 'none',
          padding: '10px 24px',
          borderRadius: 'var(--ts-radius-full)',
        }}
      >
        <ArrowLeft size={16} />
        <span>Return to Studio Workbench</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
