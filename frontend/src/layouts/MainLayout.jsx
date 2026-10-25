import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  Globe,
  Layers,
  TrendingUp,
  Maximize2,
  FileText,
  GitCompare,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { checkHealth } from '../services/api';
import UserNavMenu from '../components/UserNavMenu';
import '../styles/terrascope.css';

const MainLayout = () => {
  const { backendStatus, setBackendStatus, setLatencyMs } = useApp();
  const location = useLocation();

  // Background Health Check
  useEffect(() => {
    let isMounted = true;
    const ping = async () => {
      const t0 = performance.now();
      try {
        const res = await checkHealth();
        const delta = Math.round(performance.now() - t0);
        if (isMounted) {
          if (res?.status === 'ok') {
            setBackendStatus('connected');
            setLatencyMs(delta || 34);
          } else {
            setBackendStatus('error');
          }
        }
      } catch (err) {
        if (isMounted) setBackendStatus('offline');
      }
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [setBackendStatus, setLatencyMs]);

  // Global Scroll-Triggered Reveal Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const observeAll = () => {
      const revealElements = document.querySelectorAll('.ts-reveal');
      revealElements.forEach((el) => observer.observe(el));
    };

    observeAll();
    const t1 = setTimeout(observeAll, 150);
    const t2 = setTimeout(observeAll, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [location.pathname]);

  const navItems = [
    { to: '/workbench', label: 'Spectral Layers', icon: Layers },
    { to: '/time-series', label: 'Time Series', icon: TrendingUp },
    { to: '/land-cover', label: 'Areas of Interest', icon: Maximize2 },
    { to: '/change-detection', label: 'Change Detection', icon: GitCompare },
    { to: '/report', label: 'Export & Reports', icon: FileText },
  ];

  return (
    <div className="ts-workbench-root">
      {/* 1. Left Sidebar (Matches Image 5 / Image 2) */}
      <aside className="ts-sidebar">
        <div>
          {/* Logo Brand Lockup */}
          <Link to="/" className="ts-sidebar-logo">
            <div className="ts-brand-icon">
              <Globe size={18} />
            </div>
            <div>
              <div className="ts-sidebar-logo-title">Terrascope</div>
              <div className="ts-sidebar-logo-sub">Studio Workbench</div>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="ts-sidebar-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === '/workbench' && location.pathname === '/analysis');
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`ts-sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Dock */}
        <div className="ts-sidebar-footer">
          <div className="ts-status-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: backendStatus === 'connected' ? 'var(--ts-emerald)' : '#EF4444',
                }}
              />
              <span>{backendStatus === 'connected' ? 'GEE Synced' : 'Offline'}</span>
            </div>
            <span style={{ color: 'var(--ts-text-muted)' }}>10m Res</span>
          </div>

          <Link to="/" className="ts-exit-link">
            <ArrowLeft size={14} />
            <span>Exit to portal</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Stage (Top Bar + Dynamic Viewport) */}
      <div className="ts-main-stage">
        {/* Top Bar (Matches Image 5 / Image 2) */}
        <header className="ts-topbar">
          <div className="ts-topbar-left">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-forest)' }}>
              Earth Observation Studio
            </span>
            <span style={{ fontSize: 12, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
              &bull; Multispectral Remote Sensing
            </span>
          </div>

          <div className="ts-topbar-right">
            <div
              className="ts-topbar-chip"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--ts-bg-subtle)',
                borderColor: 'var(--ts-border-strong)',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (location.pathname !== '/workbench') {
                  window.location.href = '/workbench';
                }
              }}
            >
              <SlidersHorizontal size={13} style={{ color: 'var(--ts-forest)' }} />
              <span>NDVI, NDWI, NDBI</span>
            </div>

            {/* Cloud User Authorization & Database Session */}
            <UserNavMenu showDbBadge={false} />
          </div>
        </header>

        {/* Dynamic Route Viewport */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
