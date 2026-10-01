import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bath, BedDouble, Check, ChevronDown, CircleHelp, History, House, Info, LoaderCircle, LockKeyhole, MapPin, RotateCcw, Ruler, ShieldCheck, Sparkles, Trash2, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { displayFeature, money, predictPrice, validateForm } from '../services/api';
import { useHistory } from '../hooks/useLocalState';

export function getNeighborhoodLabel(value, metadata) {
  if (!value) return '';
  const options = metadata?.fields?.find(f => f.name === 'neighborhood')?.options;
  return options?.find(o => o.value === value)?.label || value.replaceAll('_', ' ');
}

export function ResultCard({ result, metadata, busy, resultRef }) {
  const maximum = result ? Math.max(result.predicted_price, metadata?.training_median_price || 160000) * 1.12 : 1;

  // Derived financial & market insight metrics
  const pricePerSqFt = result && result.features?.area ? Math.round(result.predicted_price / result.features.area) : null;
  const loan = result ? result.predicted_price * 0.8 : 0;
  const monthlyRate = 0.065 / 12;
  const numPayments = 360;
  const estimatedMonthly = result ? Math.round(loan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)) : null;
  const medianPrice = metadata?.training_median_price || 160000;
  const diffFromMedian = result ? Math.round(((result.predicted_price - medianPrice) / medianPrice) * 100) : 0;

  return (
    <div className={`result-card ${result ? 'has-result' : ''}`} ref={resultRef} tabIndex={-1} aria-label="Property estimate" aria-busy={busy}>
      <div className="result-topline">
        <span><Sparkles size={16} /> VALUATION INSIGHT</span>
        <span className="currency-tag">USD · HISTORICAL</span>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {busy ? (
          <div className="empty-result">
            <div className="result-house"><LoaderCircle className="spin" size={38} /></div>
            <h3>Crunching the numbers…</h3>
            <p>Evaluating feature weights through the trained linear regression pipeline.</p>
          </div>
        ) : result ? (
          <div className="estimate-content">
            <span className="estimate-label">Predicted Market Valuation</span>
            <h3 className="price">{money(result.predicted_price)}</h3>
            <div className="estimate-meta">
              <span className="meta-location"><MapPin size={13} /> {getNeighborhoodLabel(result.features.neighborhood, metadata)}, Ames, IA</span>
              <span className={`meta-diff ${diffFromMedian >= 0 ? 'positive' : 'negative'}`}>
                {diffFromMedian >= 0 ? `+${diffFromMedian}%` : `${diffFromMedian}%`} vs median
              </span>
            </div>
            <span className="success-label"><Check size={13} /> Regression model inference complete</span>
          </div>
        ) : (
          <div className="empty-result">
            <div className="result-house">
              <House size={36} strokeWidth={1.4} />
              <span><Sparkles size={13} /></span>
            </div>
            <h3>Your estimate awaits.</h3>
            <p>Select a preset or customize property specs on the left to reveal instant valuation metrics.</p>
            <div className="empty-price">$ — — — , — — —</div>
            <span className="empty-label">Instant data-driven estimate</span>
          </div>
        )}
      </div>

      {result && !busy && (
        <>
          {/* Property Spec Pills */}
          <div className="result-summary">
            <span><Ruler size={15} /> {result.features.area.toLocaleString()} sq ft</span>
            <span><BedDouble size={15} /> {result.features.bedrooms} bedrooms</span>
            <span><Bath size={15} /> {result.features.full_baths + 0.5 * result.features.half_baths} baths</span>
          </div>

          {/* Quick Financial Indicators */}
          <div className="result-insights-grid">
            <div className="insight-pill">
              <DollarSign size={15} />
              <div>
                <strong>${pricePerSqFt} <small>/ sq ft</small></strong>
                <span>Living area rate</span>
              </div>
            </div>
            <div className="insight-pill">
              <Calculator size={15} />
              <div>
                <strong>${estimatedMonthly?.toLocaleString()} <small>/ mo</small></strong>
                <span>Est. 30yr mortgage*</span>
              </div>
            </div>
          </div>

          {/* Comparison Track */}
          <div className="price-comparison">
            <div>
              <span>This property estimate</span>
              <strong>{money(result.predicted_price)}</strong>
            </div>
            <div className="price-track">
              <span style={{ width: `${Math.min(100, Math.max(5, (result.predicted_price / maximum) * 100))}%` }} />
            </div>
            <div>
              <span>Ames dataset median</span>
              <strong>{money(medianPrice)}</strong>
            </div>
            <div className="price-track median">
              <span style={{ width: `${Math.min(100, Math.max(5, (medianPrice / maximum) * 100))}%` }} />
            </div>
            <p>*Mortgage estimate assumes 20% down @ 6.5% interest. For educational reference only.</p>
          </div>

          {/* Expandable Field Breakdown */}
          <details className="result-details">
            <summary>
              <span>View full property parameters ({metadata?.fields?.length || 0})</span>
              <ChevronDown size={15} />
            </summary>
            <dl>
              {metadata?.fields?.map(field => (
                <div key={field.name}>
                  <dt>{field.label}</dt>
                  <dd>{displayFeature(field, result.features[field.name])}</dd>
                </div>
              ))}
            </dl>
            <small>Model pipeline: {result.model_version}</small>
          </details>
        </>
      )}

      <div className="result-disclaimer">
        <ShieldCheck size={18} />
        <p>{result?.disclaimer || metadata?.disclaimer || 'Ames, Iowa historical records (2006–2010). Not a certified professional appraisal.'}</p>
      </div>
    </div>
  );
}

export default function Predictor({ metadata, loading, error, retry }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const { history, add, clear, storageError } = useHistory();
  const resultRef = useRef(null);
  const formRef = useRef(null);

  // Initialize with defaults when metadata loads
  useEffect(() => {
    if (metadata) {
      setValues(Object.fromEntries(metadata.fields.map(field => [field.name, field.default])));
    }
  }, [metadata]);

  // Preset Configurations for fast one-click testing
  const presets = [
    {
      id: 'suburban',
      label: 'Suburban Classic',
      badge: '3 Bed · 2 Bath',
      values: {
        neighborhood: 'Somerset',
        area: 1650,
        lot_area: 8800,
        bedrooms: 3,
        full_baths: 2,
        half_baths: 1,
        property_age: 12,
        house_style: 'Two_Story',
        garage_cars: 2,
        central_air: 'Y',
      },
    },
    {
      id: 'estate',
      label: 'Executive Villa',
      badge: '4 Bed · 3 Bath',
      values: {
        neighborhood: 'Stone_Brook',
        area: 2580,
        lot_area: 12500,
        bedrooms: 4,
        full_baths: 3,
        half_baths: 1,
        property_age: 4,
        house_style: 'Two_Story',
        garage_cars: 3,
        central_air: 'Y',
      },
    },
    {
      id: 'starter',
      label: 'Cozy Cottage',
      badge: '2 Bed · 1 Bath',
      values: {
        neighborhood: 'North_Ames',
        area: 1100,
        lot_area: 7200,
        bedrooms: 2,
        full_baths: 1,
        half_baths: 0,
        property_age: 38,
        house_style: 'One_Story',
        garage_cars: 1,
        central_air: 'Y',
      },
    },
  ];

  function applyPreset(preset) {
    if (!metadata || busy) return;
    setActivePreset(preset.id);
    const newValues = { ...values, ...preset.values };
    setValues(newValues);
    setErrors({});
    setMessage('');

    // Trigger auto-prediction for instant gratification
    submitWithValues(newValues);
  }

  function reset() {
    if (!metadata) return;
    setActivePreset(null);
    setValues(Object.fromEntries(metadata.fields.map(field => [field.name, field.default])));
    setErrors({});
    setMessage('');
    setResult(null);
  }

  async function submitWithValues(inputVals) {
    if (busy || !metadata) return;
    const validation = validateForm(inputVals, metadata.fields);
    setErrors(validation);
    setMessage('');
    if (Object.keys(validation).length) {
      formRef.current?.elements.namedItem(Object.keys(validation)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      const submitted = Object.fromEntries(
        metadata.fields.map(field => [
          field.name,
          field.type === 'number' ? Number(inputVals[field.name]) : inputVals[field.name],
        ])
      );
      const response = await predictPrice(submitted);
      setResult(add(response));
      requestAnimationFrame(() => {
        if (window.innerWidth < 992 && resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        resultRef.current?.focus({ preventScroll: true });
      });
    } catch (failure) {
      setMessage(failure.message);
      setErrors(failure.fields || {});
    } finally {
      setBusy(false);
    }
  }

  function showHistoryItem(item) {
    setResult(item);
    requestAnimationFrame(() => {
      if (window.innerWidth < 992 && resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      resultRef.current?.focus({ preventScroll: true });
    });
  }

  async function submit(event) {
    event.preventDefault();
    submitWithValues(values);
  }

  function renderField(field) {
    const shared = {
      id: field.name,
      name: field.name,
      value: values[field.name] ?? '',
      required: true,
      disabled: busy,
      'aria-invalid': Boolean(errors[field.name]),
      'aria-describedby': errors[field.name] ? `${field.name}-error` : undefined,
      onChange: e => {
        setActivePreset(null);
        setValues(current => ({ ...current, [field.name]: e.target.value }));
        setErrors(current => ({ ...current, [field.name]: undefined }));
      },
    };

    return (
      <div className={`field field-${field.name}`} key={field.name}>
        <label htmlFor={field.name}>
          {field.label}
          {field.name === 'property_age' && (
            <span title="Age at historical valuation recorded in Ames, not today's age.">
              <CircleHelp size={13} />
            </span>
          )}
        </label>
        <div className="input-wrap">
          {field.name === 'neighborhood' && <MapPin className="input-icon" size={17} />}
          {field.type === 'category' ? (
            <>
              <select {...shared}>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow" size={15} />
            </>
          ) : (
            <>
              <input
                {...shared}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                inputMode="numeric"
              />
              {field.unit && <span className="input-unit">{field.unit}</span>}
            </>
          )}
        </div>
        {errors[field.name] && (
          <span className="field-error" id={`${field.name}-error`}>
            {errors[field.name]}
          </span>
        )}
      </div>
    );
  }

  return (
    <section id="predict" className="section predictor-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PRECISION MODELING · REAL DATA</span>
          <h2>Calculate your home’s value.</h2>
          <p>Customize property dimensions or click a fast preset to run the regression model.</p>
        </div>
        <span className="section-badge">
          <span className="status-dot" /> Ames, Iowa · Transparent AI
        </span>
      </div>

      {/* Preset Quick Selectors */}
      <div className="predictor-presets-bar">
        <span className="presets-label"><Sparkles size={13} /> Quick Presets:</span>
        <div className="presets-list">
          {presets.map(p => (
            <button
              key={p.id}
              type="button"
              className={`preset-chip ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => applyPreset(p)}
              disabled={busy || !metadata}
            >
              <strong>{p.label}</strong>
              <small>{p.badge}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="predictor-grid">
        {/* Input Form Card */}
        <div className="form-card card">
          <div className="card-heading">
            <div className="icon-tile"><House size={20} /></div>
            <div>
              <h3>Property Parameters</h3>
              <p>Adjust the key architectural and layout features below.</p>
            </div>
          </div>

          {loading ? (
            <div className="data-state" role="status">
              <LoaderCircle className="spin" /> Loading property parameters…
            </div>
          ) : error ? (
            <div className="data-state error-state" role="alert">
              <Info />
              <p>{error}</p>
              <button className="button secondary" onClick={retry}>
                Try again <RotateCcw size={15} />
              </button>
            </div>
          ) : metadata && (
            <form onSubmit={submit} noValidate ref={formRef}>
              {/* Group 1: Location */}
              <div className="form-group">
                <div className="group-label"><span>01</span> Location & Neighborhood</div>
                <div className="location-row">
                  {metadata.fields.filter(f => f.group === 'location').map(renderField)}
                  <div className="location-note">
                    <MapPin size={17} />
                    <div>Ames, Iowa<span>United States</span></div>
                  </div>
                </div>
              </div>

              {/* Group 2: Space */}
              <div className="form-group">
                <div className="group-label">
                  <span>02</span> Space & Living Dimensions
                  <small>Above-ground finished rooms</small>
                </div>
                <div className="fields-grid">
                  {metadata.fields.filter(f => f.group === 'space').map(renderField)}
                </div>
              </div>

              {/* Group 3: Features */}
              <div className="form-group">
                <div className="group-label"><span>03</span> Architecture & Amenities</div>
                <div className="fields-grid property-fields">
                  {metadata.fields.filter(f => f.group === 'property').map(renderField)}
                </div>
                <p className="field-hint">Property age is measured at the historical recording period.</p>
              </div>

              {(message || errors.form) && (
                <p className="form-error" role="alert">
                  <Info size={17} />
                  {message || errors.form}
                </p>
              )}

              <div className="form-actions">
                <button className="button primary predict-button" type="submit" disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
                  {busy ? 'Calculating Estimate…' : 'Calculate Valuation'}
                  {!busy && <ArrowRight size={18} />}
                </button>
                <button
                  type="button"
                  className="reset-button"
                  onClick={reset}
                  disabled={busy}
                  title="Reset to dataset defaults"
                  aria-label="Reset form to defaults"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              <p className="privacy-line">
                <LockKeyhole size={12} /> Privacy protected. Calculations run against local model weights.
              </p>
            </form>
          )}
        </div>

        {/* Output Valuation Column */}
        <div className="result-column">
          <ResultCard result={result} metadata={metadata} busy={busy} resultRef={resultRef} />
          <div className="insight-note">
            <div className="icon-tile small"><TrendingUp size={18} /></div>
            <div>
              <h4>Linear Regression Pipeline</h4>
              <p>Evaluates one-hot categorical encodings and standard-scaled continuous features derived from 2,930 historical records.</p>
              <a href="#model">Inspect model metrics <ArrowRight size={13} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      <div className="history-section">
        <div className="history-heading">
          <h3>
            <History size={18} /> Session History <span>{history.length}</span>
          </h3>
          <button className="text-button" onClick={clear} disabled={!history.length || busy}>
            <Trash2 size={14} /> Clear history
          </button>
        </div>

        {history.length ? (
          <>
            {/* Desktop Table View */}
            <div className="table-wrap desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Neighborhood</th>
                    <th>Living Area</th>
                    <th>Bed / Bath</th>
                    <th>Estimated Value</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id}>
                      <td>
                        <span className="history-location">{getNeighborhoodLabel(item.features.neighborhood, metadata)}</span>
                        <small>{new Date(item.saved_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>
                      </td>
                      <td>{item.features.area.toLocaleString()} sq ft</td>
                      <td>{item.features.bedrooms} bds · {item.features.full_baths + 0.5 * item.features.half_baths} ba</td>
                      <td className="history-price">
                        <strong>{money(item.predicted_price)}</strong> <small>USD</small>
                      </td>
                      <td>
                        <button
                          className="text-button"
                          disabled={busy || !metadata}
                          onClick={() => showHistoryItem(item)}
                          aria-label={`View estimate for ${getNeighborhoodLabel(item.features.neighborhood, metadata)}`}
                        >
                          View <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Responsive Mobile / Tablet Card View */}
            <div className="history-cards-mobile mobile-only">
              {history.map(item => (
                <div className="history-mobile-card" key={`mob-${item.id}`}>
                  <div className="history-card-top">
                    <div>
                      <strong>{getNeighborhoodLabel(item.features.neighborhood, metadata)}</strong>
                      <small>{new Date(item.saved_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>
                    </div>
                    <span className="history-card-price">{money(item.predicted_price)}</span>
                  </div>
                  <div className="history-card-meta">
                    <span>{item.features.area.toLocaleString()} sq ft</span>
                    <span>·</span>
                    <span>{item.features.bedrooms} bds, {item.features.full_baths} ba</span>
                    <button
                      className="text-button"
                      onClick={() => showHistoryItem(item)}
                    >
                      Inspect <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="history-empty">
            <History size={19} />
            <p>Your session estimates will appear here for comparison.</p>
            <span>Stored in browser memory</span>
          </div>
        )}

        {storageError && (
          <p className="field-hint" role="status">
            Local storage is unavailable in this environment. Estimates remain accessible during this active session.
          </p>
        )}
      </div>
    </section>
  );
}
