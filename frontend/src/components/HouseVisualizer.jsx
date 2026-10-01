import { useState, useEffect } from 'react';
import { Sun, Sunset, Moon, Eye, Compass, LayoutGrid, Pause, Play, Sparkles, MapPin, Check, Info, ShieldCheck } from 'lucide-react';

/* ── Hotspot Data & Architectural Specifications ── */
const HOTSPOTS = {
  roof: {
    id: 'roof',
    title: 'Dimensional Slate Gable & Chimney',
    badge: 'ARCHITECTURAL ROOFING',
    coords: { x: 50, y: 22 },
    desc: 'Dual-pitch timber gable with architectural slate shingles, aluminum gutters, and a fired-brick masonry chimney.',
    specs: ['Class-A Fire Rating', 'Ice & Water Shield', 'Flue Exhaust Cap'],
  },
  windows: {
    id: 'windows',
    title: 'Low-E Insulated Sash Windows',
    badge: 'ENERGY EFFICIENCY',
    coords: { x: 34, y: 46 },
    desc: 'Double-hung 6-over-6 sash frames with argon insulation, decorative louvered shutters, and flowering planter boxes.',
    specs: ['U-Factor: 0.27', 'Argon Gas Filled', 'Solid Louver Trim'],
  },
  porch: {
    id: 'porch',
    title: 'Craftsman Portico & Stone Steps',
    badge: 'ENTRANCE ARCHITECTURE',
    coords: { x: 44, y: 72 },
    desc: 'Square tapered craftsman columns on natural stone plinths, brass pendant lantern, and bluestone entry treads.',
    specs: ['Cedar Decking', 'Bluestone Risers', 'Brass Lantern'],
  },
  garage: {
    id: 'garage',
    title: 'Attached 2-Car Carriage Garage',
    badge: 'VEHICLE STORAGE',
    coords: { x: 74, y: 64 },
    desc: 'Insulated carriage-style paneled doors with upper transom glass lites and exterior bronze gooseneck barn sconces.',
    specs: ['2-Car Capacity', 'Insulated R-16', 'Transom Lites'],
  },
  living: {
    id: 'living',
    title: 'Above-Ground Living Volume',
    badge: 'INTERIOR SPACE',
    coords: { x: 56, y: 48 },
    desc: 'High 9-foot ceilings with open-concept sightlines connecting the great room, chef kitchen, and formal dining.',
    specs: ['9ft Ceiling Heights', 'Hardwood Flooring', 'Recessed LED'],
  },
};

export default function HouseVisualizer() {
  const [timeOfDay, setTimeOfDay] = useState('sunset'); // 'day' | 'sunset' | 'night'
  const [view, setView] = useState('isometric'); // 'isometric' | 'elevation' | 'plan'
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-cycle through hotspots when auto-rotate is enabled
  useEffect(() => {
    if (!autoRotate) return;
    const keys = Object.keys(HOTSPOTS);
    const interval = setInterval(() => {
      setActiveHotspot(current => {
        const nextIdx = (keys.indexOf(current) + 1) % (keys.length + 1);
        return nextIdx === keys.length ? null : keys[nextIdx];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const activeData = activeHotspot ? HOTSPOTS[activeHotspot] : null;

  return (
    <div className={`house-visualizer-container mode-${timeOfDay} view-${view}`}>
      {/* ── Viewport Control Bar ── */}
      <div className="house-3d-toolbar">
        {/* Lighting Atmosphere Mode */}
        <div className="toolbar-group time-group" role="group" aria-label="Lighting atmosphere">
          <button
            type="button"
            className={`toolbar-btn ${timeOfDay === 'day' ? 'active' : ''}`}
            onClick={() => setTimeOfDay('day')}
            title="Daylight Mode"
            aria-label="Daylight mode"
          >
            <Sun size={13} />
            <span className="btn-label">Day</span>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${timeOfDay === 'sunset' ? 'active' : ''}`}
            onClick={() => setTimeOfDay('sunset')}
            title="Golden Hour / Sunset"
            aria-label="Golden hour sunset mode"
          >
            <Sunset size={13} />
            <span className="btn-label">Sunset</span>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${timeOfDay === 'night' ? 'active' : ''}`}
            onClick={() => setTimeOfDay('night')}
            title="Twilight / Glowing Interior"
            aria-label="Night mode with glowing windows"
          >
            <Moon size={13} />
            <span className="btn-label">Night</span>
          </button>
        </div>

        {/* Architectural View Modes */}
        <div className="toolbar-group view-group" role="group" aria-label="Architectural views">
          <button
            type="button"
            className={`toolbar-btn ${view === 'isometric' ? 'active' : ''}`}
            onClick={() => setView('isometric')}
            title="Isometric 3D Architectural View"
            aria-label="Isometric 3D view"
          >
            <Eye size={13} />
            <span className="btn-label">3D</span>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${view === 'elevation' ? 'active' : ''}`}
            onClick={() => setView('elevation')}
            title="Front Elevation Schematic"
            aria-label="Front elevation view"
          >
            <Compass size={13} />
            <span className="btn-label">Elevation</span>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${view === 'plan' ? 'active' : ''}`}
            onClick={() => setView('plan')}
            title="Architectural Floor Plan"
            aria-label="Floor plan layout"
          >
            <LayoutGrid size={13} />
            <span className="btn-label">Floor Plan</span>
          </button>
        </div>

        {/* Feature Tour Auto-Play Toggle */}
        <button
          type="button"
          className={`toolbar-btn icon-only ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Pause feature tour' : 'Start feature tour'}
          aria-label={autoRotate ? 'Pause feature tour' : 'Start feature tour'}
        >
          {autoRotate ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>

      {/* ── Active Hotspot Information Card ── */}
      {activeData && (
        <div className="hotspot-banner">
          <div className="hotspot-banner-content">
            <span className="hotspot-badge">
              <Sparkles size={12} /> {activeData.badge}
            </span>
            <h4>{activeData.title}</h4>
            <p>{activeData.desc}</p>
            <div className="hotspot-specs-row">
              {activeData.specs.map(spec => (
                <span key={spec} className="spec-tag">
                  <Check size={11} /> {spec}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="hotspot-close"
            onClick={() => { setActiveHotspot(null); setAutoRotate(false); }}
            aria-label="Close feature details"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Interactive Architectural Canvas ── */}
      <div className="visualizer-stage" onClick={() => { if (activeHotspot) setActiveHotspot(null); }}>
        {view === 'isometric' && <IsometricHomeScene timeOfDay={timeOfDay} activeHotspot={activeHotspot} />}
        {view === 'elevation' && <FrontElevationScene timeOfDay={timeOfDay} />}
        {view === 'plan' && <FloorPlanScene timeOfDay={timeOfDay} />}

        {/* Interactive Hotspot Pins Overlay (in Isometric mode) */}
        {view === 'isometric' && (
          <div className="hotspots-overlay" onClick={e => e.stopPropagation()}>
            {Object.values(HOTSPOTS).map(spot => {
              const isSelected = activeHotspot === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  className={`visualizer-pin ${isSelected ? 'active' : ''}`}
                  style={{ left: `${spot.coords.x}%`, top: `${spot.coords.y}%` }}
                  onClick={() => {
                    setAutoRotate(false);
                    setActiveHotspot(isSelected ? null : spot.id);
                  }}
                  aria-label={`View ${spot.title}`}
                >
                  <span className="pin-pulse" />
                  <span className="pin-core" />
                  <span className="pin-tooltip">
                    <strong>{spot.title}</strong>
                    <span>Click for specs</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Interactive Viewport Hint ── */}
      <div className="house-3d-hint">
        <Sparkles size={13} />
        <span>Click glowing pins for specs · Switch views & lighting above</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 1: ISOMETRIC ARCHITECTURAL CRAFTSMAN HOME
   ───────────────────────────────────────────────────────────── */
function IsometricHomeScene({ timeOfDay }) {
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  // Palette tuned to atmosphere
  const skyTint = isNight ? '#101426' : isSunset ? '#eed2c4' : '#dbe7f7';
  const groundColor = isNight ? '#16231d' : isSunset ? '#5a6b47' : '#69994c';
  const wallFront = isNight ? '#22283e' : isSunset ? '#f8e4d8' : '#faf7f2';
  const wallSide = isNight ? '#181d2e' : isSunset ? '#e2c5b4' : '#ebe5dc';
  const roofColor = isNight ? '#191f2c' : isSunset ? '#4a3b47' : '#333842';
  const windowGlow = isNight ? '#ffb347' : isSunset ? '#ffd27d' : '#d2eaff';
  const windowOpacity = isNight ? 0.95 : isSunset ? 0.8 : 0.45;

  return (
    <svg
      className="visualizer-svg"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
      aria-label="3D Isometric Craftsman Home Illustration"
    >
      <defs>
        {/* Soft Ambient Shadow */}
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity={isNight ? 0.6 : 0.22} />
          <stop offset="60%" stopColor="#000000" stopOpacity={isNight ? 0.25 : 0.08} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Window Light Gradients */}
        <linearGradient id="windowLit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={windowGlow} stopOpacity={windowOpacity} />
          <stop offset="100%" stopColor={isNight ? '#e68a00' : '#b0d8fc'} stopOpacity={windowOpacity * 0.85} />
        </linearGradient>

        {/* Roof Slate Texture Shading */}
        <linearGradient id="roofSlopeL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isNight ? '#2a3346' : isSunset ? '#624f5a' : '#454c58'} />
          <stop offset="100%" stopColor={roofColor} />
        </linearGradient>
        <linearGradient id="roofSlopeR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isNight ? '#1f2533' : isSunset ? '#4d3d47' : '#393f49'} />
          <stop offset="100%" stopColor={isNight ? '#121622' : isSunset ? '#362932' : '#272b33'} />
        </linearGradient>

        {/* Stone Foundation Gradient */}
        <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isNight ? '#282b36' : '#948a7b'} />
          <stop offset="100%" stopColor={isNight ? '#1c1e26' : '#7a7062'} />
        </linearGradient>

        {/* Sconce & Lantern Glow */}
        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd070" stopOpacity={isNight ? 0.9 : isSunset ? 0.6 : 0.15} />
          <stop offset="60%" stopColor="#ff9900" stopOpacity={isNight ? 0.4 : isSunset ? 0.2 : 0} />
          <stop offset="100%" stopColor="#ff7700" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Ground Plinth & Landscaping ── */}
      <ellipse cx="400" cy="460" rx="330" ry="120" fill="url(#groundShadow)" />

      {/* Isometric Lawn Base Plate */}
      <polygon
        points="400,340 680,440 400,540 120,440"
        fill={groundColor}
        stroke={isNight ? '#0e1612' : '#4c7336'}
        strokeWidth="2"
      />
      <polygon
        points="120,440 400,540 400,555 120,455"
        fill={isNight ? '#0b120f' : '#3f5e2d'}
      />
      <polygon
        points="400,540 680,440 680,455 400,555"
        fill={isNight ? '#070c0a' : '#324a23'}
      />

      {/* Concrete Driveway */}
      <polygon
        points="480,420 620,470 560,520 420,460"
        fill={isNight ? '#212630' : isSunset ? '#cfc3b8' : '#d5cfc5'}
      />

      {/* Flagstone Front Walkway */}
      <polygon
        points="350,425 400,445 375,475 320,445"
        fill={isNight ? '#282b36' : isSunset ? '#bfb0a0' : '#c2b8aa'}
      />
      <polygon
        points="375,475 400,445 425,465 395,495"
        fill={isNight ? '#242730' : isSunset ? '#b3a494' : '#b8aea0'}
      />

      {/* ── Stone Foundation Water Table ── */}
      <polygon points="260,370 410,425 410,440 260,385" fill="url(#stoneGrad)" />
      <polygon points="410,425 560,370 560,385 410,440" fill={isNight ? '#161922' : '#6f665a'} />

      {/* ── Main Two-Story House Body ── */}
      {/* Front Siding Wall (facing south-west) */}
      <polygon points="260,250 410,305 410,425 260,370" fill={wallFront} />
      {/* Side Siding Wall (facing south-east) */}
      <polygon points="410,305 560,250 560,370 410,425" fill={wallSide} />

      {/* Horizontal Lap Siding Lines (Front) */}
      {[270, 290, 310, 330, 350].map(y => (
        <line
          key={`lap-f-${y}`}
          x1="260"
          y1={y}
          x2="410"
          y2={y + 55}
          stroke={isNight ? '#1c2236' : isSunset ? '#edd0bf' : '#eee5d8'}
          strokeWidth="1"
        />
      ))}
      {/* Lap Siding Lines (Side) */}
      {[270, 290, 310, 330, 350].map(y => (
        <line
          key={`lap-s-${y}`}
          x1="410"
          y1={y + 55}
          x2="560"
          y2={y}
          stroke={isNight ? '#141826' : isSunset ? '#d8b9a7' : '#dfd7ca'}
          strokeWidth="1"
        />
      ))}

      {/* ── Front Gable Peak ── */}
      <polygon points="260,250 335,160 410,250 410,305 260,250" fill={wallFront} />
      <polygon points="335,160 410,250 410,305 335,160" fill={wallFront} />

      {/* Gable Board & Batten Accent */}
      {[285, 310, 335, 360, 385].map(x => (
        <line
          key={`bb-${x}`}
          x1={x}
          y1={240 - Math.abs(x - 335) * 0.9}
          x2={x}
          y2={250 + (x - 260) * 0.36}
          stroke={isNight ? '#2f3852' : isSunset ? '#dfc0ae' : '#e6ddd0'}
          strokeWidth="1.5"
        />
      ))}

      {/* ── Chimney ── */}
      <polygon
        points="440,140 465,130 465,220 440,230"
        fill={isNight ? '#3a1f18' : isSunset ? '#8b4334' : '#9c4d3b'}
      />
      <polygon
        points="465,130 485,137 485,210 465,220"
        fill={isNight ? '#261410' : isSunset ? '#6b3226' : '#7a3b2d'}
      />
      {/* Chimney Cap */}
      <polygon
        points="435,140 465,127 490,135 460,148"
        fill={isNight ? '#4d463d' : '#c7baa8'}
      />
      {/* Flue Pot */}
      <rect
        x="455"
        y="118"
        width="12"
        height="12"
        rx="2"
        fill={isNight ? '#402319' : '#ad593d'}
      />

      {/* ── Roof Structure ── */}
      {/* Left Gable Slope */}
      <polygon points="335,145 235,245 400,305 480,210" fill="url(#roofSlopeL)" />
      {/* Right Gable Slope */}
      <polygon points="335,145 480,210 580,250 410,305" fill="url(#roofSlopeR)" />
      {/* Fascia & Eaves Edge Trim */}
      <polyline
        points="235,245 335,145 480,210 580,250"
        fill="none"
        stroke={isNight ? '#3a445c' : '#ffffff'}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* ── Attached Carriage Garage (Right Wing) ── */}
      <polygon points="480,310 600,265 600,370 480,415" fill={wallSide} />
      {/* Garage Roof Slope */}
      <polygon points="480,310 540,240 620,270 560,340" fill="url(#roofSlopeR)" />
      {/* Carriage Garage Door Frame */}
      <polygon points="505,340 585,310 585,385 505,415" fill={isNight ? '#161a26' : '#ede7dc'} stroke={isNight ? '#333b54' : '#fff'} strokeWidth="3" />
      {/* Carriage Vertical Paneling */}
      {[525, 545, 565].map(x => (
        <line
          key={`gd-${x}`}
          x1={x}
          y1={335 - (x - 505) * 0.37}
          x2={x}
          y2={410 - (x - 505) * 0.37}
          stroke={isNight ? '#262d40' : '#dad2c4'}
          strokeWidth="1.5"
        />
      ))}
      {/* Garage Upper Transom Windows */}
      <polygon points="512,342 578,318 578,335 512,360" fill="url(#windowLit)" />

      {/* Garage Gooseneck Sconces */}
      <circle cx="500" cy="335" r="4" fill="#2d2b38" />
      <circle cx="500" cy="335" r={isNight ? 18 : 6} fill="url(#lanternGlow)" />
      <circle cx="590" cy="302" r="4" fill="#2d2b38" />
      <circle cx="590" cy="302" r={isNight ? 18 : 6} fill="url(#lanternGlow)" />

      {/* ── Front Covered Porch ── */}
      {/* Porch Roof Gable */}
      <polygon points="310,340 355,300 400,340 400,355 310,355" fill="url(#roofSlopeL)" />
      {/* Porch Floor / Decking */}
      <polygon points="295,415 390,450 430,435 335,400" fill={isNight ? '#1c1f2b' : isSunset ? '#b8aa9a' : '#bcb2a4'} />
      {/* Craftsman Columns */}
      <rect x="312" y="348" width="8" height="65" fill={isNight ? '#333b52' : '#ffffff'} rx="1" />
      <rect x="309" y="398" width="14" height="18" fill="url(#stoneGrad)" rx="1" />

      <rect x="385" y="375" width="8" height="65" fill={isNight ? '#333b52' : '#ffffff'} rx="1" />
      <rect x="382" y="425" width="14" height="18" fill="url(#stoneGrad)" rx="1" />

      {/* Front Entrance Door */}
      <polygon points="340,360 368,370 368,430 340,420" fill={isNight ? '#111b29' : '#22384f'} />
      <circle cx="363" cy="397" r="2" fill="#d4af37" />

      {/* Porch Brass Lantern */}
      <circle cx="354" cy="332" r={isNight ? 24 : 10} fill="url(#lanternGlow)" />
      <rect x="351" y="325" width="6" height="10" fill="#26252b" rx="1" />

      {/* ── Windows (Detailed Sash with Lights & Shutters) ── */}
      {/* Upper Floor Window Left */}
      <g>
        {/* Navy Louvered Shutters */}
        <polygon points="275,270 286,274 286,314 275,310" fill={isNight ? '#141e2e' : '#24374c'} />
        <polygon points="316,285 327,289 327,329 316,325" fill={isNight ? '#141e2e' : '#24374c'} />
        {/* Window Pane Frame */}
        <polygon points="288,275 314,285 314,325 288,315" fill="url(#windowLit)" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="2.5" />
        {/* Window Muntin Grid */}
        <line x1="301" y1="280" x2="301" y2="320" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="1.2" />
        <line x1="288" y1="295" x2="314" y2="305" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="1.2" />
      </g>

      {/* Upper Floor Window Right (Gable Attic Window) */}
      <g>
        <polygon points="360,225 380,232 380,260 360,253" fill="url(#windowLit)" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="2" />
        <line x1="370" y1="228" x2="370" y2="256" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="1" />
      </g>

      {/* Lower Living Room Double Window (Right of Front Porch) */}
      <g>
        <polygon points="430,345 440,341 440,381 430,385" fill={isNight ? '#141e2e' : '#24374c'} />
        <polygon points="480,326 490,322 490,362 480,366" fill={isNight ? '#141e2e' : '#24374c'} />
        <polygon points="442,341 478,328 478,368 442,381" fill="url(#windowLit)" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="2.5" />
        <line x1="460" y1="334" x2="460" y2="374" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="1.2" />
        <line x1="442" y1="361" x2="478" y2="348" stroke={isNight ? '#444f6e' : '#ffffff'} strokeWidth="1.2" />

        {/* Flowering Window Box */}
        <polygon points="440,380 480,365 480,373 440,388" fill={isNight ? '#1c1612' : '#573d2a'} />
        <circle cx="448" cy="378" r="3" fill="#e86b88" />
        <circle cx="458" cy="374" r="3.5" fill="#f7f5ed" />
        <circle cx="468" cy="369" r="3" fill="#688cd8" />
        <circle cx="475" cy="366" r="3" fill="#e86b88" />
      </g>

      {/* ── Mature Landscape Foliage & Trees ── */}
      {/* Front Maple Tree (Left) */}
      <g>
        <path d="M190,440 Q195,380 185,340" stroke={isNight ? '#261f18' : '#594433'} strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="180" cy="330" r="38" fill={isNight ? '#172e1c' : isSunset ? '#5a823b' : '#548c3b'} />
        <circle cx="205" cy="315" r="32" fill={isNight ? '#1f3d26' : isSunset ? '#6b9c46' : '#659c48'} />
        <circle cx="165" cy="305" r="26" fill={isNight ? '#172e1c' : isSunset ? '#4f7333' : '#4d7d35'} />
      </g>

      {/* Evergreen Pine (Back Right) */}
      <g>
        <polygon points="620,310 650,370 590,370" fill={isNight ? '#122619' : '#2b4d32'} />
        <polygon points="620,270 645,325 595,325" fill={isNight ? '#162e1e' : '#355c3c'} />
        <polygon points="620,230 640,285 600,285" fill={isNight ? '#193322' : '#3e6b47'} />
      </g>

      {/* Boxwood Foundation Shrubs */}
      {[270, 290, 425, 495, 595, 615].map((x, i) => (
        <circle
          key={`bush-${x}`}
          cx={x}
          cy={380 + (i % 3) * 18}
          r="10"
          fill={isNight ? '#16261a' : isSunset ? '#456a33' : '#4c7c34'}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 2: FRONT ELEVATION BLUEPRINT & SCHEMATIC VIEW
   ───────────────────────────────────────────────────────────── */
function FrontElevationScene({ timeOfDay }) {
  const isNight = timeOfDay === 'night';
  const gridColor = isNight ? '#242a42' : '#e2e5f0';
  const strokeColor = isNight ? '#8b7efc' : '#4f41ca';
  const dimColor = isNight ? '#6e7494' : '#7b809a';

  return (
    <svg className="visualizer-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      {/* Drafting Grid */}
      <defs>
        <pattern id="elevationGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridColor} strokeWidth="1" strokeDasharray="2,2" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#elevationGrid)" opacity="0.65" />

      {/* Ground Line */}
      <line x1="80" y1="480" x2="720" y2="480" stroke={strokeColor} strokeWidth="2.5" />
      <text x="730" y="484" fill={dimColor} fontSize="11" fontWeight="600">GRADE ±0′-0″</text>

      {/* Foundation & Water Table */}
      <rect x="180" y="440" width="440" height="40" fill={isNight ? '#1a1e2d' : '#ede7dc'} stroke={strokeColor} strokeWidth="2" />
      <text x="195" y="465" fill={dimColor} fontSize="10">STONE MASONRY BASE</text>

      {/* Main Floor Wall */}
      <rect x="180" y="270" width="310" height="170" fill={isNight ? '#141824' : '#faf8f5'} stroke={strokeColor} strokeWidth="2" />
      {/* 2nd Story Main Gable */}
      <polygon points="180,270 335,130 490,270" fill={isNight ? '#181d2c' : '#f5f2ec'} stroke={strokeColor} strokeWidth="2.5" />

      {/* Eaves & Overhang */}
      <line x1="165" y1="280" x2="335" y2="120" stroke={strokeColor} strokeWidth="3" />
      <line x1="335" y1="120" x2="505" y2="280" stroke={strokeColor} strokeWidth="3" />

      {/* Chimney */}
      <rect x="420" y="80" width="45" height="130" fill={isNight ? '#2a1a16' : '#944b3c'} stroke={strokeColor} strokeWidth="2" />
      <rect x="415" y="70" width="55" height="10" fill={strokeColor} />

      {/* Garage (Right Wing) */}
      <rect x="490" y="320" width="130" height="120" fill={isNight ? '#161a26' : '#f3efe8'} stroke={strokeColor} strokeWidth="2" />
      <polygon points="490,320 555,260 620,320" fill={isNight ? '#1c2234' : '#e8e2d8'} stroke={strokeColor} strokeWidth="2" />
      {/* Garage Door */}
      <rect x="505" y="345" width="100" height="95" fill="none" stroke={strokeColor} strokeWidth="2" strokeDasharray="4,3" />
      <text x="525" y="395" fill={dimColor} fontSize="10" fontWeight="600">CARRIAGE DOOR</text>

      {/* Front Entrance Porch */}
      <rect x="290" y="370" width="90" height="70" fill="none" stroke={strokeColor} strokeWidth="2" />
      <polygon points="280,370 335,320 390,370" fill={isNight ? '#22283e' : '#ffffff'} stroke={strokeColor} strokeWidth="2" />
      <line x1="298" y1="370" x2="298" y2="440" stroke={strokeColor} strokeWidth="4" />
      <line x1="372" y1="370" x2="372" y2="440" stroke={strokeColor} strokeWidth="4" />
      <rect x="320" y="380" width="30" height="60" fill={isNight ? '#1a2233' : '#22384f'} stroke={strokeColor} strokeWidth="2" />

      {/* Windows Elevation */}
      <rect x="210" y="310" width="50" height="65" fill={isNight ? '#ffb34733' : '#d2eaff88'} stroke={strokeColor} strokeWidth="1.8" />
      <line x1="235" y1="310" x2="235" y2="375" stroke={strokeColor} strokeWidth="1" />
      <line x1="210" y1="342" x2="260" y2="342" stroke={strokeColor} strokeWidth="1" />

      <rect x="410" y="310" width="50" height="65" fill={isNight ? '#ffb34733' : '#d2eaff88'} stroke={strokeColor} strokeWidth="1.8" />
      <line x1="435" y1="310" x2="435" y2="375" stroke={strokeColor} strokeWidth="1" />
      <line x1="410" y1="342" x2="460" y2="342" stroke={strokeColor} strokeWidth="1" />

      {/* Upper Attic Window */}
      <circle cx="335" cy="210" r="20" fill={isNight ? '#ffb34733' : '#d2eaff88'} stroke={strokeColor} strokeWidth="2" />
      <line x1="335" y1="190" x2="335" y2="230" stroke={strokeColor} strokeWidth="1" />
      <line x1="315" y1="210" x2="355" y2="210" stroke={strokeColor} strokeWidth="1" />

      {/* Architectural Dimension Markers */}
      <g stroke={dimColor} strokeWidth="1">
        {/* Height Dimension */}
        <line x1="140" y1="120" x2="140" y2="480" />
        <line x1="130" y1="120" x2="150" y2="120" />
        <line x1="130" y1="480" x2="150" y2="480" />
        <text x="85" y="305" fill={dimColor} fontSize="12" fontWeight="700">28′-6″ ROOF</text>

        {/* Width Dimension */}
        <line x1="180" y1="515" x2="620" y2="515" />
        <line x1="180" y1="505" x2="180" y2="525" />
        <line x1="620" y1="505" x2="620" y2="525" />
        <text x="365" y="535" fill={dimColor} fontSize="12" fontWeight="700">44′-0″ FOOTPRINT</text>
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 3: ARCHITECTURAL FLOOR PLAN LAYOUT
   ───────────────────────────────────────────────────────────── */
function FloorPlanScene({ timeOfDay }) {
  const isNight = timeOfDay === 'night';
  const wallStroke = isNight ? '#8b7efc' : '#3d348b';
  const textColor = isNight ? '#e2e5f5' : '#1f2438';
  const dimColor = isNight ? '#8b8ea6' : '#6f738a';

  return (
    <svg className="visualizer-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      {/* Background Blueprint Grid */}
      <defs>
        <pattern id="planGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke={isNight ? '#21273d' : '#ebedf7'} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#planGrid)" />

      {/* Exterior Walls (Heavy Cut Line) */}
      <rect
        x="160"
        y="120"
        width="480"
        height="360"
        fill={isNight ? '#121626' : '#ffffff'}
        stroke={wallStroke}
        strokeWidth="6"
        rx="2"
      />

      {/* Room Partition Walls */}
      {/* Dividing Great Room & Primary Suite */}
      <line x1="380" y1="120" x2="380" y2="340" stroke={wallStroke} strokeWidth="4" />
      {/* Kitchen & Dining Divider */}
      <line x1="160" y1="280" x2="380" y2="280" stroke={wallStroke} strokeWidth="4" />
      {/* Garage Wall */}
      <line x1="480" y1="260" x2="640" y2="260" stroke={wallStroke} strokeWidth="5" />
      <line x1="480" y1="260" x2="480" y2="480" stroke={wallStroke} strokeWidth="5" />

      {/* Room 1: Great Room */}
      <g>
        <text x="220" y="180" fill={textColor} fontSize="14" fontWeight="700">GREAT ROOM</text>
        <text x="220" y="200" fill={dimColor} fontSize="11">18′ × 15′ · 9′ Ceiling</text>
        {/* Fireplace Hearth */}
        <rect x="160" y="165" width="18" height="45" fill={isNight ? '#3a1f18' : '#8c483a'} rx="1" />
      </g>

      {/* Room 2: Chef Kitchen & Dining */}
      <g>
        <text x="220" y="340" fill={textColor} fontSize="14" fontWeight="700">CHEF KITCHEN</text>
        <text x="220" y="360" fill={dimColor} fontSize="11">14′ × 12′ · Quartz Island</text>
        {/* Kitchen Island */}
        <rect x="230" y="380" width="80" height="35" fill={isNight ? '#232940' : '#ece6dc'} stroke={wallStroke} strokeWidth="1.5" rx="3" />
      </g>

      {/* Room 3: Primary Bedroom Suite */}
      <g>
        <text x="405" y="170" fill={textColor} fontSize="14" fontWeight="700">PRIMARY SUITE</text>
        <text x="405" y="190" fill={dimColor} fontSize="11">16′ × 14′ · Walk-in Closet</text>
        {/* En-suite Bath */}
        <rect x="520" y="120" width="120" height="90" fill={isNight ? '#161b2e' : '#f4f6fa'} stroke={wallStroke} strokeWidth="2" />
        <text x="535" y="165" fill={textColor} fontSize="11" fontWeight="600">EN-SUITE</text>
      </g>

      {/* Room 4: 2-Car Carriage Garage */}
      <g>
        <text x="515" y="330" fill={textColor} fontSize="14" fontWeight="700">2-CAR GARAGE</text>
        <text x="515" y="350" fill={dimColor} fontSize="11">22′ × 20′ · Attached</text>
        {/* Garage Door Swing / Cutout */}
        <line x1="510" y1="480" x2="610" y2="480" stroke="#10b981" strokeWidth="3" strokeDasharray="5,3" />
      </g>

      {/* Covered Front Porch */}
      <rect x="240" y="480" width="140" height="40" fill="none" stroke={wallStroke} strokeWidth="2" strokeDasharray="4,4" />
      <text x="270" y="505" fill={dimColor} fontSize="11" fontWeight="600">COVERED PORCH</text>
      {/* Front Entry Door Swing */}
      <path d="M 310 480 A 30 30 0 0 1 340 450" fill="none" stroke="#6358dc" strokeWidth="1.5" />
      <line x1="310" y1="480" x2="310" y2="450" stroke="#6358dc" strokeWidth="2" />
    </svg>
  );
}
