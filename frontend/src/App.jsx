import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import CloudDatabaseModal from './components/CloudDatabaseModal';
import CloudReportsDrawer from './components/CloudReportsDrawer';
import { RefreshCw } from 'lucide-react';
import './styles/mission-control.css';
import './styles/terrascope.css';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const WorkbenchPage = lazy(() => import('./pages/WorkbenchPage'));
const ScenesPage = lazy(() => import('./pages/ScenesPage'));
const ChangeDetectionPage = lazy(() => import('./pages/ChangeDetectionPage'));
const LandCoverPage = lazy(() => import('./pages/LandCoverPage'));
const TimeSeriesPage = lazy(() => import('./pages/TimeSeriesPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      gap: 14,
      backgroundColor: 'var(--ts-bg, #F6F8F5)',
      color: 'var(--ts-forest, #103B32)',
    }}
  >
    <RefreshCw size={28} className="mc-spin" style={{ color: 'var(--ts-forest, #103B32)' }} />
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--ts-text-secondary, #485A54)',
        letterSpacing: 0.5,
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      INITIALIZING TERRASCOPE EARTH ENGINE...
    </span>
  </div>
);

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* 1. Terrascope Landing Portal (Image 1) */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. Terrascope Studio Workbench & Geospatial Pages (Image 2) */}
                <Route element={<MainLayout />}>
                  <Route path="/workbench" element={<WorkbenchPage />} />
                  <Route path="/analysis" element={<WorkbenchPage />} />
                  <Route path="/scenes" element={<ScenesPage />} />
                  <Route path="/change-detection" element={<ChangeDetectionPage />} />
                  <Route path="/land-cover" element={<LandCoverPage />} />
                  <Route path="/time-series" element={<TimeSeriesPage />} />
                  <Route path="/report/:id" element={<ReportPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
            {/* Global Authentication & Cloud Persistence Modals */}
            <AuthModal />
            <CloudDatabaseModal />
            <CloudReportsDrawer />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
