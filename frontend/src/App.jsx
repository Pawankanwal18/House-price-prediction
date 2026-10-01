import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BrainCircuit, Check, ChevronRight, Database, House, Layers3, MapPin, Menu, Moon, MoveUpRight, ScanLine, ShieldCheck, SlidersHorizontal, Sparkles, Sun, X } from 'lucide-react';
const HouseVisualizer = lazy(() => import('./components/HouseVisualizer'));
import Predictor from './components/Predictor';
import { getMetadata, getMetrics } from './services/api';
import { useTheme } from './hooks/useLocalState';

const ModelDashboard = lazy(() => import('./components/ModelDashboard'));
const links = [['home', 'Home'], ['predict', 'Predict Price'], ['how-it-works', 'How It Works'], ['model', 'Model'], ['about', 'About']];

function useResource(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setState(previous => ({ ...previous, loading: true, error: '' }));
    loader().then(data => { if (current) setState({ data, loading: false, error: '' }); })
      .catch(error => { if (current) setState({ data: null, loading: false, error: error.message }); });
    return () => { current = false; };
  }, [loader, attempt]);
  return { ...state, retry: useCallback(() => setAttempt(value => value + 1), []) };
}

function Brand() {
  return <a href="#home" className="brand" aria-label="Housely home"><span className="brand-mark"><House size={23} strokeWidth={1.9} /><span /></span>housely<span className="brand-period">.</span></a>;
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('home');
  const metadata = useResource(getMetadata);
  const metrics = useResource(getMetrics);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const handleKeyDown = event => {
      if (event.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu]);

  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    const timer = setTimeout(() => links.forEach(([id]) => { const node = document.getElementById(id); if (node) observer.observe(node); }), 500);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return <>
    <a href="#predict" className="skip-link">Skip to house price predictor</a>
    <header className="site-header">
      <div className="nav-container">
        <Brand />
        <div
          className={`nav-backdrop ${menu ? 'is-open' : ''}`}
          onClick={() => setMenu(false)}
          aria-hidden="true"
        />
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={menu ? 'is-open' : ''}
        >
          {links.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? 'active' : ''}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => { setMenu(false); setActive(id); }}
            >
              {label}
            </a>
          ))}
          <a
            href="#predict"
            className="button nav-cta-mobile"
            onClick={() => { setMenu(false); setActive('predict'); }}
          >
            Get an estimate <ArrowUpRight size={16} />
          </a>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <a href="#predict" className="button nav-cta">Get an estimate <ArrowUpRight size={16} /></a>
          <button
            className="menu-button"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            aria-controls="primary-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
    </header>
    <main>
      <section id="home" className="hero section">
        <div className="hero-copy">
          <div className="hero-badge">
            <span><Sparkles size={13} /></span> A smarter perspective on property <ChevronRight size={13} />
          </div>
          <h1>
            Predict your<br />house price<br /><span>with AI.</span>
            <svg className="heading-spark" width="42" height="49" viewBox="0 0 42 49" aria-hidden="true">
              <path d="m19 5 2 34M5 16l29 17M7 39l26-26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </h1>
          <p className="hero-description">
            A little data. A clearer picture.<br />Discover an estimated property value with machine learning and real housing data.
          </p>
          <div className="hero-actions">
            <a href="#predict" className="button primary">Predict House Price <ArrowRight size={17} /></a>
            <a href="#how-it-works" className="hero-secondary"><span><ArrowDown size={15} /></span> See how it works</a>
          </div>
          <div className="hero-reassurance">
            <span><Check size={14} /> Real housing data</span>
            <span><Check size={14} /> No signup needed</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-cross cross-one">+</span>
          <span className="art-cross cross-two">+</span>
          <div className="art-location"><span className="location-dot" /><MapPin size={13} /> Ames, Iowa</div>
          <div className="art-caption">A HOME IS MORE THAN A NUMBER.</div>
          <Suspense fallback={<div className="house-3d-loading">Loading architectural view…</div>}>
            <HouseVisualizer />
          </Suspense>
          <div className="art-floating-card">
            <div className="floating-icon"><BrainCircuit size={22} /></div>
            <div>
              <strong>Real data. Thoughtful insights.</strong>
              <span>Powered by Linear Regression</span>
            </div>
            <span className="floating-check"><Check size={13} /></span>
          </div>
          <div className="art-bottom-label"><span /> A new perspective starts here <MoveUpRight size={15} /></div>
        </div>
      </section>
      <div className="trust-strip section">
        <div className="trust-item trust-intro-item">
          <div className="trust-intro">Less guesswork.<br /><strong>More understanding.</strong></div>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box"><Database size={22} /></div>
          <span>
            <strong>{metrics.data ? `${metrics.data.rows.toLocaleString()} real properties` : 'Real property records'}</strong>
            <small>Public Ames Housing dataset</small>
          </span>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box"><BrainCircuit size={22} /></div>
          <span>
            <strong>Built on machine learning</strong>
            <small>Transparent Linear Regression</small>
          </span>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box"><ShieldCheck size={22} /></div>
          <span>
            <strong>Your details stay yours</strong>
            <small>History stored on your device</small>
          </span>
        </div>
      </div>
      <Predictor metadata={metadata.data} loading={metadata.loading} error={metadata.error} retry={metadata.retry} />
      <div className="how-background"><section id="how-it-works" className="section how-section"><div className="center-heading"><span className="eyebrow">FROM DETAILS TO DISCOVERY</span><h2>Smart technology. Simple process.</h2><p>No spreadsheets. No complicated steps. Just a little curiosity.</p></div><div className="steps-grid">{[
        { icon: SlidersHorizontal, title: 'Make it your property', text: 'Add the location, living space, and details that make a home unique.' },
        { icon: Layers3, title: 'We connect the dots', text: 'Your inputs are cleaned, scaled, and encoded using the saved training pipeline.' },
        { icon: BrainCircuit, title: 'Let the model work', text: 'Linear Regression applies patterns learned from real historical sales.' },
        { icon: ScanLine, title: 'Meet your estimate', text: 'Get a clear price estimate, explore the details, and compare your saved results.' },
      ].map(({ icon: Icon, title, text }, index) => <div className="step" key={title}><div className="step-top"><div className="step-icon"><Icon size={24} strokeWidth={1.5} /></div><span>0{index + 1}</span>{index < 3 && <ArrowRight className="step-arrow" size={18} />}</div><h3>{title}</h3><p>{text}</p></div>)}</div></section></div>
      <Suspense fallback={<div className="section data-state">Loading model dashboard…</div>}><ModelDashboard metrics={metrics.data} loading={metrics.loading} error={metrics.error} retry={metrics.retry} /></Suspense>
      <section id="about" className="section about-section"><div className="about-card"><div className="about-icon"><House size={34} strokeWidth={1.4} /><Sparkles size={17} /></div><div className="about-copy"><span className="eyebrow">BUILT FOR THE CURIOUS</span><h2>A home’s potential.<br />A model’s perspective.</h2><p>Housely makes machine learning a little more human. Explore how property features relate to historical sale prices—with open data, clear explanations, and nothing hidden behind the numbers.</p><a href="https://modeldata.tidymodels.org/reference/ames.html" target="_blank" rel="noreferrer" className="text-button">Meet the Ames Housing dataset <ArrowUpRight size={15} /></a></div><div className="about-note"><ShieldCheck size={23} /><h3>A little context matters.</h3><p>Our model learns from Ames, Iowa sales recorded between 2006 and 2010. It doesn’t account for today’s market, inflation, renovations, or every detail of a property.</p><p>Use it to explore and learn—not to make financial decisions.</p><span>Educational insights, not financial advice.</span></div></div></section>
      <section className="section closing-section"><div><span className="eyebrow">YOUR NEXT INSIGHT IS A FEW DETAILS AWAY</span><h2>Let’s put a little data behind it.</h2></div><a href="#predict" className="button primary">Explore your estimate <ArrowRight size={17} /></a></section>
    </main>
    <footer className="section site-footer"><div className="footer-top"><div><Brand /><p>A little data. A clearer picture.</p></div><div><a href="#how-it-works">How it works</a><a href="#model">Our model</a><a href="#about">About Housely</a><a href="https://jse.amstat.org/v19n3/decock.pdf" target="_blank" rel="noreferrer">Dataset research <ArrowUpRight size={12} /></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Housely. Built with curiosity.</span><span>Historical estimates in USD. Not a professional valuation.</span><a href="#home">Back to top ↑</a></div></footer>
  </>;
}
