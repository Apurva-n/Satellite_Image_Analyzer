import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Globe,
  ArrowRight,
  Sparkles,
  Maximize2,
  MessageSquare,
  Layers,
  GitCompare,
  Cpu,
  TrendingUp,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import UserNavMenu from '../components/UserNavMenu';
import '../styles/terrascope.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setBbox, setActiveLayer } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for Scroll-Triggered Reveal Animations
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
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const revealElements = document.querySelectorAll('.ts-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleStartDefault = () => {
    navigate('/workbench');
  };

  const handleSamplePune = () => {
    setBbox([73.75, 18.45, 73.95, 18.60]);
    setActiveLayer('NDWI');
    navigate('/workbench');
  };

  const handleScrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="ts-landing-root">
      {/* 1. Sticky Header Navigation with Blur */}
      <div className={`ts-landing-header-wrap ${isScrolled ? 'scrolled' : ''}`}>
        <header className="ts-landing-nav">
          <Link to="/" className="ts-brand-lockup">
            <div className="ts-brand-icon">
              <Globe size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ts-brand-title">Terrascope</span>
                <span className="ts-pulse-dot" title="Earth Engine Online" />
              </div>
              <div className="ts-brand-tagline">Sentinel-2 &bull; Earth Engine</div>
            </div>
          </Link>

          <nav className="ts-nav-links">
            <a
              href="#overview"
              className="ts-nav-link"
              onClick={(e) => handleScrollToSection(e, 'overview')}
            >
              Overview
            </a>
            <a
              href="#workflow"
              className="ts-nav-link"
              onClick={(e) => handleScrollToSection(e, 'workflow')}
            >
              How it works
            </a>
            <a
              href="#capabilities"
              className="ts-nav-link"
              onClick={(e) => handleScrollToSection(e, 'capabilities')}
            >
              What you can do
            </a>
            <a
              href="#docs"
              className="ts-nav-link"
              onClick={(e) => handleScrollToSection(e, 'docs')}
            >
              Docs
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserNavMenu showDbBadge={false} />
            <button type="button" className="ts-nav-cta" onClick={handleStartDefault}>
              <span>Open analyzer</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </header>
      </div>

      {/* 2. Hero Section */}
      <section className="ts-hero-container" id="overview">
        <div className="ts-reveal">
          <div className="ts-hero-tag">
            <span>&bull; SENTINEL-2 &bull; GOOGLE EARTH ENGINE</span>
          </div>

          <h1 className="ts-hero-headline">
            See how any place on Earth is changing.
          </h1>

          <p className="ts-hero-description">
            Draw an area on the map to get instant plain-language reports on vegetation, water, and land cover.
          </p>

          <div className="ts-hero-actions">
            <button type="button" className="ts-btn-primary" onClick={handleStartDefault}>
              <span>Start analyzing</span>
              <ArrowRight size={16} />
            </button>
            <button type="button" className="ts-btn-secondary" onClick={handleSamplePune}>
              <Compass size={15} style={{ color: 'var(--ts-forest)' }} />
              <span>Try the Pune sample (14.2 km&sup2;)</span>
            </button>
          </div>

          <div className="ts-hero-meta">
            <span>&bull; 10m Spatial Resolution</span>
            <span>&bull; 5-Day Revisit Rate</span>
          </div>
        </div>

        {/* Hero Right Visual Preview Card */}
        <div className="ts-hero-card ts-reveal ts-stagger-2">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
            alt="Planetary Sentinel Satellite View"
            className="ts-hero-card-img"
          />

          {/* Top HUD Coordinates */}
          <div className="ts-hero-card-hud-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
              <strong>LAT: 18.5204&deg; N, 73.8567&deg; E</strong>
            </div>
            <div>1:25,000</div>
          </div>

          {/* Bounding Box HUD Overlay */}
          <div className="ts-hero-card-box">
            <div className="ts-hero-card-box-label">AOI_01 (14.2 km&sup2;)</div>
            <div style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, borderTop: '2px solid #FFFFFF', borderLeft: '2px solid #FFFFFF' }} />
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderTop: '2px solid #FFFFFF', borderRight: '2px solid #FFFFFF' }} />
            <div style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, borderBottom: '2px solid #FFFFFF', borderLeft: '2px solid #FFFFFF' }} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, borderBottom: '2px solid #FFFFFF', borderRight: '2px solid #FFFFFF' }} />
          </div>

          {/* Bottom Floating Insight Pill */}
          <div className="ts-hero-card-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--ts-mint-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ts-emerald)',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ts-text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  PLANT HEALTH IN YOUR AREA
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-forest)' }}>
                  Mostly healthy
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Updated 5 Jan 2026
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Workflow Simplicity */}
      <section className="ts-section" id="workflow">
        <div className="ts-reveal">
          <div className="ts-section-tag">WORKFLOW SIMPLICITY</div>
          <h2 className="ts-section-title">Three steps, no jargon</h2>
          <p className="ts-section-subhead">
            Instant satellite intelligence without complex GIS workflows.
          </p>
        </div>

        <div className="ts-steps-grid">
          {/* Step 1 */}
          <div className="ts-step-card ts-reveal ts-stagger-1">
            <div>
              <div className="ts-step-header">
                <span className="ts-step-pill">STEP 1</span>
                <Maximize2 size={16} style={{ color: 'var(--ts-forest)' }} />
              </div>
              <h3>Choose an area</h3>
              <p>
                Draw a bounding box on the map or select a quick city preset.
              </p>
            </div>
            <div className="ts-step-footer">
              <span>BOUNDARY SNAPPING</span>
              <Maximize2 size={12} />
            </div>
          </div>

          {/* Step 2 */}
          <div className="ts-step-card ts-reveal ts-stagger-2">
            <div>
              <div className="ts-step-header">
                <span className="ts-step-pill">STEP 2</span>
                <MessageSquare size={16} style={{ color: 'var(--ts-forest)' }} />
              </div>
              <h3>Select a lens</h3>
              <p>
                Choose vegetation, moisture, urban footprint, or seasonal change.
              </p>
            </div>
            <div className="ts-step-footer">
              <span>SPECTRAL INDICES</span>
              <MessageSquare size={12} />
            </div>
          </div>

          {/* Step 3 */}
          <div className="ts-step-card ts-reveal ts-stagger-3">
            <div>
              <div className="ts-step-header">
                <span className="ts-step-pill">STEP 3</span>
                <Sparkles size={16} style={{ color: 'var(--ts-forest)' }} />
              </div>
              <h3>Get the insight</h3>
              <p>
                View map overlays, clear metric summaries, and exportable dossiers.
              </p>
            </div>
            <div className="ts-step-footer">
              <span>AI DOSSIER EXPORT</span>
              <Sparkles size={12} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Capabilities */}
      <section className="ts-section" id="capabilities" style={{ paddingTop: 0 }}>
        <div className="ts-reveal">
          <div className="ts-section-tag">CAPABILITIES</div>
          <h2 className="ts-section-title">What you can do</h2>
          <p className="ts-section-subhead">
            High-cadence orbital telemetry processed into clear, actionable insights.
          </p>
        </div>

        <div className="ts-capabilities-grid">
          {/* Card 1 */}
          <div className="ts-capability-card ts-reveal ts-stagger-1">
            <div>
              <div className="ts-capability-header">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--ts-mint-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ts-forest)',
                  }}
                >
                  <Layers size={17} />
                </div>
                <div className="ts-capability-chips">
                  <span className="ts-chip-tag">NDVI</span>
                  <span className="ts-chip-tag">NDWI</span>
                  <span className="ts-chip-tag">NDBI</span>
                  <span className="ts-chip-tag">NBR</span>
                </div>
              </div>
              <h3>Explore the surface</h3>
              <p>
                Inspect natural color, plant health (NDVI), surface moisture (NDWI), and wildfire burn scars.
              </p>
            </div>
            <div className="ts-capability-footer">
              <span>Optical &amp; Multispectral Bands</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="ts-capability-card ts-reveal ts-stagger-2">
            <div>
              <div className="ts-capability-header">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--ts-mint-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ts-forest)',
                  }}
                >
                  <GitCompare size={17} />
                </div>
                <div className="ts-capability-chips">
                  <span className="ts-chip-tag">DELTA RASTER</span>
                </div>
              </div>
              <h3>Compare two dates</h3>
              <p>
                Detect canopy clearing, flood inundation margins, and fire disturbance between two passes.
              </p>
            </div>
            <div className="ts-capability-footer">
              <span>Automated Difference Masks</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="ts-capability-card ts-reveal ts-stagger-3">
            <div>
              <div className="ts-capability-header">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--ts-mint-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ts-forest)',
                  }}
                >
                  <Cpu size={17} />
                </div>
                <div className="ts-capability-chips">
                  <span className="ts-chip-tag">ML CLASSIFIER</span>
                </div>
              </div>
              <h3>Classify land cover</h3>
              <p>
                Segment every 10m pixel into forest, agriculture, urban, water, and barren land.
              </p>
            </div>
            <div className="ts-capability-footer">
              <span>5-Class Terrestrial Partitioning</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="ts-capability-card ts-reveal ts-stagger-4">
            <div>
              <div className="ts-capability-header">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--ts-mint-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ts-forest)',
                  }}
                >
                  <TrendingUp size={17} />
                </div>
                <div className="ts-capability-chips">
                  <span className="ts-chip-tag">EXPORT READY</span>
                </div>
              </div>
              <h3>Track trends</h3>
              <p>
                Analyze multi-month oscillations in vegetation vitality and export raw GeoTIFF arrays.
              </p>
            </div>
            <div className="ts-capability-footer">
              <span>GeoTIFF, CSV &amp; PDF Exports</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action Dark Green Banner */}
      <section className="ts-cta-banner ts-reveal">
        <h2>Ready to look from above?</h2>
        <p>
          Analyze any hectare on Earth in under a minute with zero setup.
        </p>
        <button type="button" className="ts-btn-white" onClick={handleStartDefault}>
          <span>Open the analyzer</span>
          <ArrowRight size={16} />
        </button>
        <div className="ts-cta-submeta">
          <span>&bull; No credit card needed</span>
          <span>&bull; Free public tier</span>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="ts-landing-footer" id="docs">
        <div>
          <span className="ts-footer-brand">Terrascope Earth Analytics</span>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Planetary-scale geospatial intelligence driven by Sentinel-2 multi-spectral radiometric observations.
          </div>
        </div>
        <div className="ts-footer-links">
          <a href="/workbench">API Reference</a>
          <a href="/workbench">Spectral Indices</a>
          <span style={{ fontFamily: 'var(--font-mono)' }}>v2026.3-PROD</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
