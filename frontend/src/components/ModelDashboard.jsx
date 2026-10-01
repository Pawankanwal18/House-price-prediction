import { useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, Info, LoaderCircle, RotateCcw, Target } from 'lucide-react';
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { compactMoney, money } from '../services/api';

function PriceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="chart-tooltip"><strong>Held-out property</strong><span>Actual: {money(point.actual)}</span><span>Predicted: {money(point.predicted)}</span></div>;
}

export default function ModelDashboard({ metrics, loading, error, retry }) {
  const [allCoefficients, setAllCoefficients] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const min = metrics ? Math.min(0, ...metrics.points.map(p => p.predicted)) : 0;
  const max = metrics ? Math.ceil(Math.max(...metrics.points.flatMap(p => [p.actual, p.predicted])) / 100000) * 100000 : 800000;
  const coefficients = metrics?.coefficients.slice(0, allCoefficients ? undefined : 7) || [];
  const coefficientMax = metrics ? Math.max(...metrics.coefficients.map(c => Math.abs(c.value)), 1) : 1;
  return <section id="model" className="section model-section">
    <div className="section-heading"><div><span className="eyebrow">TRANSPARENCY COMES STANDARD</span><h2>Good predictions. Real evidence.</h2><p>Look under the hood. See how the model actually performs.</p></div><span className="section-badge"><Activity size={14} /> Linear Regression</span></div>
    {loading ? <div className="data-state card" role="status"><LoaderCircle className="spin" /> Loading model evaluation…</div>
      : error ? <div className="data-state card error-state" role="alert"><Info /><p>{error}</p><button className="button secondary" onClick={retry}>Retry model data <RotateCcw size={15} /></button></div>
        : metrics && <>
          <div className="metric-grid">
            {[{ label: 'R² score', value: metrics.r2.toFixed(3), tag: 'MODEL FIT', description: 'Share of price variation explained on unseen properties.', icon: Target },
              { label: 'Mean absolute error', value: money(metrics.mae), tag: 'MAE · USD', description: 'The average absolute difference from the actual sale price.', icon: BarChart3 },
              { label: 'Root mean squared error', value: money(metrics.rmse), tag: 'RMSE · USD', description: 'Typical error size, with more weight on larger misses.', icon: Activity },
              { label: 'Mean squared error', value: metrics.mse.toExponential(2), tag: 'MSE · USD²', description: 'Average squared error. Lower values mean a closer fit.', icon: ArrowUpRight }].map(({ label, value, tag, description, icon: Icon }, i) => <div className={`metric-card card ${i === 0 ? 'metric-featured' : ''}`} key={label}><div className="metric-tag">{tag}<Icon size={16} /></div><strong>{value}</strong><h3>{label}</h3><p>{description}</p></div>)}
          </div>
          <div className="evaluation-note"><CheckCircle2 size={15} /><span>Evaluated on <strong>{metrics.test_rows.toLocaleString()} unseen properties</strong></span><span className="note-divider" /><span>{metrics.train_rows.toLocaleString()} training records</span><span className="note-divider" /><span>80 / 20 split · Random state {metrics.random_state}</span></div>
          <div className="charts-grid">
            <div className="card scatter-card"><div className="chart-heading"><div><h3>Actual vs. predicted prices</h3><p>Every dot is a real held-out property.</p></div><span className="tiny-badge">USD</span></div><div className="scatter-chart" role="img" aria-label={`Scatter plot of ${metrics.test_rows} held-out actual and predicted sale prices. R squared ${metrics.r2.toFixed(3)}. A data table is available below.`}><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 10, right: 12, bottom: 20, left: 6 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 4" /><XAxis type="number" dataKey="actual" name="Actual price" domain={[min, max]} tickFormatter={compactMoney} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Actual sale price', position: 'bottom', offset: 3, fill: 'var(--muted)', fontSize: 11 }} /><YAxis type="number" dataKey="predicted" name="Predicted price" domain={[min, max]} tickFormatter={compactMoney} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={55} /><Tooltip content={<PriceTooltip />} cursor={{ strokeDasharray: '3 3' }} /><ReferenceLine segment={[{ x: min, y: min }, { x: max, y: max }]} stroke="#a5a0bf" strokeDasharray="5 5" /><Scatter data={metrics.points} fill="#8173df" fillOpacity={0.55} isAnimationActive={false} /></ScatterChart></ResponsiveContainer></div><div className="chart-legend"><span><i /> Model prediction</span><span><i className="line-key" /> Ideal prediction</span></div><p className="chart-footnote">Closer to the diagonal means a prediction closer to the actual price.</p><button className="text-button data-table-toggle" onClick={() => setShowPoints(!showPoints)} aria-expanded={showPoints}>{showPoints ? 'Hide' : 'View'} accessible test-set data</button>{showPoints && <div className="test-data table-wrap"><table><caption>All held-out predictions in USD</caption><thead><tr><th>Record</th><th>Actual</th><th>Predicted</th></tr></thead><tbody>{metrics.points.map(point => <tr key={point.id}><td>{point.id}</td><td>{money(point.actual)}</td><td>{money(point.predicted)}</td></tr>)}</tbody></table></div>}</div>
            <div className="card coefficients-card"><div className="chart-heading"><div><h3>What influences the model?</h3><p>Largest signed model coefficients.</p></div><span className="icon-tile small"><BarChart3 size={17} /></span></div><div className="coefficient-list">{coefficients.map(coefficient => <div className="coefficient-row" key={coefficient.feature}><div><span title={coefficient.feature}>{coefficient.feature}</span><strong className={coefficient.value < 0 ? 'negative-value' : ''}>{coefficient.value >= 0 ? '+' : '−'}{compactMoney(Math.abs(coefficient.value))}</strong></div><div className="coefficient-track"><span className={coefficient.value < 0 ? 'negative' : ''} style={{ width: `${Math.abs(coefficient.value) / coefficientMax * 50}%`, left: coefficient.value >= 0 ? '50%' : `${50 - Math.abs(coefficient.value) / coefficientMax * 50}%` }} /></div></div>)}</div><button className="text-button" onClick={() => setAllCoefficients(!allCoefficients)} aria-expanded={allCoefficients}>{allCoefficients ? 'Show fewer coefficients' : 'View all coefficients'} <ArrowUpRight size={14} /></button><p className="coefficient-note"><Info size={14} />{metrics.coefficient_note}</p><details className="baseline-details"><summary>Reference categories</summary>{Object.entries(metrics.baselines).map(([name, value]) => <p key={name}>{name}: {value}</p>)}</details></div>
          </div>
        </>}
  </section>;
}
