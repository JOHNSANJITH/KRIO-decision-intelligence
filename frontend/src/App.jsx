import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const navItems = [
  ["overview", "Overview", "grid"],
  ["forecast", "Forecast", "trend"],
  ["scenarios", "Scenarios", "sliders"],
  ["decision", "Decision", "target"],
  ["monitoring", "Monitoring", "shield"],
];

function money(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function compactMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

function percent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(n % 1 === 0 ? 0 : 1)}%`;
}

function runway(value) {
  return value === null || value === undefined ? "Self-funding" : `${Number(value).toFixed(1)} mo`;
}

function Icon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    trend: <><polyline points="3 17 8 12 12 15 21 6"/><polyline points="15 6 21 6 21 12"/></>,
    target: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></>,
    sliders: <><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2"/></>,
    shield: <path d="M12 3l7 3v5c0 4.6-3 7.8-7 10-4-2.2-7-5.4-7-10V6l7-3z"/>,
    spark: <><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M5.6 5.6l2.8 2.8"/><path d="M15.6 15.6l2.8 2.8"/><path d="M18.4 5.6l-2.8 2.8"/><path d="M8.4 15.6l-2.8 2.8"/></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></>,
    refresh: <><polyline points="20 11 20 5 14 5"/><polyline points="4 13 4 19 10 19"/><path d="M20 5a8 8 0 0 0-13.7 2.9L4 11"/><path d="M4 19a8 8 0 0 0 13.7-2.9L20 13"/></>,
    arrow: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    check: <path d="M5 12l4 4L19 6"/>,
    warning: <><path d="M12 3l9 16H3L12 3z"/><path d="M12 9v4"/><path d="M12 16h.01"/></>,
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
  };
  return <svg {...p}>{shapes[name] || shapes.grid}</svg>;
}

function Panel({ className = "", children, onClick, role = undefined }) {
  return <div className={`glass-panel ${className}`} onClick={onClick} role={role}>{children}</div>;
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="view-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

function RevenueChart({ data }) {
  if (!data?.length) return <div className="empty-state">No revenue observations.</div>;
  const width = 980;
  const height = 310;
  const padX = 42;
  const padY = 28;
  const values = data.map((d) => Number(d.revenue));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const x = (i) => padX + (i * (width - padX * 2)) / Math.max(data.length - 1, 1);
  const y = (v) => height - padY - ((v - min) / range) * (height - padY * 2);
  const points = data.map((d, i) => `${x(i)},${y(Number(d.revenue))}`).join(" ");
  const area = `${padX},${height - padY} ${points} ${width - padX},${height - padY}`;
  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span><i className="legend-dot" /> Revenue</span>
        <span>{String(data[0].month).slice(0, 7)} — {String(data[data.length - 1].month).slice(0, 7)}</span>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="krioRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c73ff" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#7c73ff" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.2, 0.45, 0.7].map((ratio) => <line key={ratio} x1={padX} x2={width - padX} y1={height - padY - ratio * (height - padY * 2)} y2={height - padY - ratio * (height - padY * 2)} className="grid-line" />)}
        <polygon points={area} fill="url(#krioRevenueFill)" />
        <polyline points={points} className="revenue-line" />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={x(i)} cy={y(Number(d.revenue))} r={i === data.length - 1 ? 5.5 : 3.5} className="revenue-point" />
            <title>{`${String(d.month).slice(0, 7)} · ${money(d.revenue)}`}</title>
          </g>
        ))}
      </svg>
      <div className="chart-axis"><span>{String(data[0].month).slice(0, 7)}</span><span>{compactMoney(values[Math.floor(values.length / 2)])}</span><span>{String(data[data.length - 1].month).slice(0, 7)}</span></div>
    </div>
  );
}

function MetricCard({ label, value, detail, tone, icon, onClick }) {
  return (
    <button className={`glass-panel metric-card interactive-card ${tone || ""}`} onClick={onClick} type="button">
      <div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Icon name={icon} size={16} /></span></div>
      <div className="metric-value">{value}</div>
      <div className="metric-footer"><span>{detail}</span></div>
    </button>
  );
}

function ScenarioPill({ change }) {
  const n = Number(change);
  const cls = n > 0 ? "positive" : n < 0 ? "negative" : "neutral";
  return <span className={`scenario-pill ${cls}`}>{percent(n)}</span>;
}

function ModelBars({ models }) {
  if (!models?.length) return <div className="empty-state">No model results.</div>;
  const max = Math.max(...models.map((m) => Number(m.wape ?? 0)), 1);
  const best = models.reduce((a, b) => Number(b.wape ?? Infinity) < Number(a.wape ?? Infinity) ? b : a, models[0]);
  return <div className="model-bars">{models.map((m) => (
    <div className="model-row" key={m.model}>
      <div className="model-row-top"><span>{m.model}</span><strong>{m.wape}% WAPE</strong></div>
      <div className="model-track"><div className={`model-fill ${m.model === best.model ? "selected" : ""}`} style={{ width: `${Math.max(8, (Number(m.wape ?? 0) / max) * 100)}%` }} /></div>
    </div>
  ))}</div>;
}

function App() {
  const [activeView, setActiveView] = useState("overview");
  const [snapshot, setSnapshot] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [error, setError] = useState("");
  const [planningMonths, setPlanningMonths] = useState(6);
  const [minRunway, setMinRunway] = useState(6);
  const [selectedScenario, setSelectedScenario] = useState(10);
  const [customChange, setCustomChange] = useState(10);
  const [customResult, setCustomResult] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (options = {}) => {
    setLoading(true);
    setError("");
    const horizon = Number(options.planningMonths ?? planningMonths);
    const runwayGuardrail = Number(options.minRunway ?? minRunway);
    try {
      const [decisionResponse, dataResponse] = await Promise.all([
        fetch(`${API_BASE}/api/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ min_runway_months: runwayGuardrail, planning_months: horizon, min_change: -0.3, max_change: 0.3 }),
        }),
        fetch(`${API_BASE}/api/demo/data`),
      ]);
      if (!decisionResponse.ok) {
        const detail = await decisionResponse.text();
        throw new Error(`Decision API ${decisionResponse.status}: ${detail}`);
      }
      if (!dataResponse.ok) {
        const detail = await dataResponse.text();
        throw new Error(`Data API ${dataResponse.status}: ${detail}`);
      }
      const decisionJson = await decisionResponse.json();
      const dataJson = await dataResponse.json();
      setSnapshot(decisionJson);
      setData(dataJson.data || []);
      setLastUpdated(new Date());
      setCustomResult(null);
    } catch (err) {
      setError(err.message || "Unable to connect to Krio backend");
    } finally {
      setLoading(false);
    }
  };

  const runCustomScenario = async () => {
    setScenarioLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: [customChange / 100], planning_months: planningMonths }),
      });
      if (!response.ok) throw new Error("Scenario request failed");
      const result = await response.json();
      setCustomResult(result.scenarios?.[0] || null);
    } catch (err) {
      setError(err.message || "Unable to run scenario");
    } finally {
      setScenarioLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const metrics = snapshot?.metrics;
  const forecast = snapshot?.forecast;
  const optimization = snapshot?.optimization;
  const decision = snapshot?.decision;
  const monitoring = snapshot?.monitoring;
  const scenarios = snapshot?.scenarios || [];
  const selectedScenarioData = customResult || scenarios.find((s) => Number(s.change_percent) === Number(selectedScenario)) || scenarios[0];
  const bestScenario = useMemo(() => scenarios.length ? [...scenarios].sort((a, b) => Number(b.horizon_profit) - Number(a.horizon_profit))[0] : null, [scenarios]);

  const go = (view) => setActiveView(view);

  if (loading && !snapshot) {
    return <div className="full-loading"><div className="loading-state"><span className="spinner" /><div><strong>Building Krio</strong><span>Loading forecasting, scenarios and decision policy...</span></div></div></div>;
  }

  if (!snapshot) {
    return (
      <div className="full-loading">
        <div className="loading-state error-state">
          <Icon name="warning" size={20} />
          <div>
            <strong>Unable to load Krio</strong>
            <span>{error || "The API did not return a decision snapshot."}</span>
            <button className="primary-button" type="button" onClick={() => load()} disabled={loading}>
              {loading ? "Retrying" : "Retry connection"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="krio-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <aside className="sidebar glass-panel">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div><div className="brand-name">Krio</div><div className="brand-subtitle">Decision Intelligence</div></div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Workspace</div>
          {navItems.map(([id, label, icon]) => (
            <button className={`nav-item ${activeView === id ? "active" : ""}`} type="button" key={id} onClick={() => go(id)}>
              <Icon name={icon} size={17} /><span>{label}</span>{activeView === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </div>
        <div className="sidebar-spacer" />
        <button className="sidebar-mini glass-inner" type="button" onClick={() => go("overview")}>
          <div className="mini-icon"><Icon name="database" size={16} /></div>
          <div><strong>SaaS growth model</strong><span>{data.length} monthly observations</span></div>
        </button>
        <div className="sidebar-version">KRIO 1.2.1</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">Applied Decision Intelligence</div>
            <h1>{activeView === "overview" ? "Business Command Center" : navItems.find((i) => i[0] === activeView)?.[1]}</h1>
            <p className="subtitle">Forecast what happens. Test what-if scenarios. Optimize the next move.</p>
          </div>
          <div className="top-actions">
            <div className="status-chip"><span className="status-dot" /> System online</div>
            <button className="primary-button" type="button" onClick={() => load()} disabled={loading}><Icon name={loading ? "refresh" : "spark"} size={16} /> {loading ? "Running" : "Run analysis"}</button>
          </div>
        </header>

        {error && <div className="error-banner"><Icon name="warning" size={16} /><span>{error}</span><button type="button" onClick={() => setError("")}>Dismiss</button></div>}
        {loading && snapshot && <div className="refresh-strip"><span className="spinner small" /> Recomputing against {planningMonths}-month planning horizon and {minRunway}-month liquidity buffer...</div>}

        {!snapshot ? null : (
          <div className="content-stack">
            {activeView === "overview" && (
              <>
                <section className="command-grid">
                  <button className={`glass-panel recommendation-card ${String(decision?.recommendation || "hold").toLowerCase()} interactive-card`} type="button" onClick={() => go("decision")}>
                    <div className="panel-topline"><span>Recommended action</span><span className="live-badge">Live</span></div>
                    <div className="recommendation-action">{decision?.recommendation || "HOLD"}<span className="action-arrow">→</span></div>
                    <div className="recommendation-change">{percent(optimization?.recommended_change_percent)} marketing spend</div>
                    <p>{snapshot.explanation?.summary}</p>
                    <div className="recommendation-bottom"><span>Current liquidity</span><strong>{runway(metrics?.runway_months)}</strong></div>
                  </button>

                  <button className="glass-panel optimization-card interactive-card" type="button" onClick={() => go("scenarios")}>
                    <div className="panel-topline"><span>Optimization target</span><span className="objective-badge">Max horizon profit</span></div>
                    <div className="optimization-value">{compactMoney(optimization?.marketing_spend)}</div>
                    <div className="muted-caption">Target monthly marketing spend</div>
                    <div className={`optimization-status ${optimization?.feasible ? "good" : "warn"}`}><span>{optimization?.feasible ? "Feasible" : "Guardrail pressure"}</span><strong>{planningMonths}-month plan</strong></div>
                    <div className="optimization-mini-grid">
                      <div><span>Horizon revenue</span><strong>{compactMoney(optimization?.horizon_revenue)}</strong></div>
                      <div><span>Horizon profit</span><strong>{compactMoney(optimization?.horizon_profit)}</strong></div>
                      <div><span>Ending cash</span><strong>{compactMoney(optimization?.ending_cash)}</strong></div>
                    </div>
                  </button>
                </section>

                <section className="metrics-grid">
                  <MetricCard label="Revenue" value={compactMoney(metrics?.latest_revenue)} detail={`${percent(metrics?.revenue_growth_percent)} vs first month`} tone="violet" icon="trend" onClick={() => go("forecast")} />
                  <MetricCard label="Customer acquisition" value={money(metrics?.cac)} detail="Aggregate CAC" tone="blue" icon="target" onClick={() => go("scenarios")} />
                  <MetricCard label="Latest cash flow" value={compactMoney(metrics?.burn_rate)} detail="Positive means operating burn" tone="rose" icon="clock" onClick={() => go("decision")} />
                  <MetricCard label="Liquidity" value={runway(metrics?.runway_months)} detail={`${minRunway}-month planning buffer`} tone="green" icon="shield" onClick={() => go("monitoring")} />
                </section>

                <section className="primary-grid">
                  <Panel className="chart-card"><div className="panel-header"><div><div className="section-label">Business trend</div><h2>Revenue trajectory</h2></div><div className="header-metric"><span>Latest</span><strong>{compactMoney(metrics?.latest_revenue)}</strong></div></div><RevenueChart data={data} /></Panel>
                  <button className="glass-panel forecast-card interactive-card" type="button" onClick={() => go("forecast")}>
                    <div className="panel-header"><div><div className="section-label">Forecast engine</div><h2>Next-period outlook</h2></div><span className="model-badge">{forecast?.model || "—"}</span></div>
                    <div className="forecast-value">{compactMoney(forecast?.prediction)}</div>
                    <div className="forecast-sub">Projected next-period revenue</div>
                    <div className="forecast-divider" />
                    <div className="forecast-head"><span>Model</span><span>WAPE</span></div>
                    <ModelBars models={forecast?.models} />
                  </button>
                </section>

                <section className="secondary-grid">
                  <Panel className="scenario-card"><div className="panel-header"><div><div className="section-label">Scenario engine</div><h2>Marketing allocation lab</h2></div><span className="control-badge">{planningMonths}-month horizon</span></div>
                    <div className="scenario-list">{scenarios.slice(0, 5).map((s) => <button type="button" className={`scenario-row ${bestScenario?.change_percent === s.change_percent ? "best" : ""}`} key={s.change_percent} onClick={() => { setSelectedScenario(Number(s.change_percent)); go("scenarios"); }}><ScenarioPill change={s.change_percent}/><div><span>Marketing</span><strong>{compactMoney(s.marketing_spend)}</strong></div><div><span>Revenue</span><strong>{compactMoney(s.horizon_revenue)}</strong></div><div><span>Profit</span><strong>{compactMoney(s.horizon_profit)}</strong></div><div><span>Cash</span><strong>{compactMoney(s.ending_cash)}</strong></div></button>)}</div>
                    <div className="scenario-note"><Icon name="sliders" size={14} /> Select a scenario to inspect it in detail.</div>
                  </Panel>
                  <Panel className="health-card"><div className="panel-header"><div><div className="section-label">Model health</div><h2>System signals</h2></div><span className="health-badge"><span /> {monitoring?.status || "unknown"}</span></div>
                    <div className="health-list"><div className="health-item"><div className="health-left"><span className="health-icon green"><Icon name="check" size={14}/></span><div><span>Forecast</span><small>Selected by WAPE</small></div></div><strong>{forecast?.model}</strong></div><div className="health-item"><div className="health-left"><span className="health-icon blue"><Icon name="database" size={14}/></span><div><span>Data</span><small>Active observations</small></div></div><strong>{data.length}</strong></div><div className="health-item"><div className="health-left"><span className="health-icon rose"><Icon name="shield" size={14}/></span><div><span>Decision guardrail</span><small>Minimum liquidity buffer</small></div></div><strong>{minRunway} mo</strong></div></div>
                  </Panel>
                </section>
              </>
            )}

            {activeView === "forecast" && (
              <>
                <SectionHeader eyebrow="Forecast engine" title="Forecast workspace" subtitle="Inspect the actual model comparison feeding Krio's decision layer." action={<button className="ghost-button" type="button" onClick={() => go("overview")}>Overview</button>} />
                <section className="forecast-overview-grid"><Panel className="hero-mini-card"><span className="section-label">Selected model</span><strong>{forecast?.model || "—"}</strong><span>Best holdout WAPE</span><em>{forecast?.models?.find((m) => m.model === forecast.model)?.wape ?? "—"}%</em></Panel><Panel className="hero-mini-card"><span className="section-label">Next period</span><strong>{compactMoney(forecast?.prediction)}</strong><span>Training observations</span><em>{forecast?.train_size ?? "—"}</em></Panel><Panel className="hero-mini-card"><span className="section-label">Validation</span><strong>{forecast?.models?.length ?? 0}</strong><span>Model candidates</span><em>Chronological holdout</em></Panel></section>
                <section className="forecast-main-grid"><Panel className="chart-card large"><div className="section-label">Historical data</div><h2>Revenue trajectory</h2><RevenueChart data={data}/></Panel><Panel className="comparison-card"><div className="section-label">Model comparison</div><h2>Forecast leaderboard</h2><div className="comparison-list">{forecast?.models?.map((m) => <div key={m.model} className={`comparison-row ${m.model === forecast.model ? "selected" : ""}`}><div><strong>{m.model}</strong><span>Prediction {compactMoney(m.prediction)}</span></div><div><strong>{m.wape}%</strong><span>WAPE</span></div></div>)}</div></Panel></section>
              </>
            )}

            {activeView === "scenarios" && (
              <>
                <SectionHeader eyebrow="Scenario engine" title="Marketing allocation lab" subtitle="Change the planning horizon and liquidity guardrail, then rerun the actual optimization model." action={<button className="ghost-button" type="button" onClick={() => go("overview")}>Overview</button>} />
                <section className="scenario-control-grid">
                  <Panel className="control-panel"><div className="section-label">Planning horizon</div><h2>How far ahead should Krio optimize?</h2><div className="range-value">{planningMonths} <span>months</span></div><input className="range-input" type="range" min="1" max="18" step="1" value={planningMonths} onChange={(e) => setPlanningMonths(Number(e.target.value))}/><div className="range-labels"><span>1</span><span>9</span><span>18 months</span></div></Panel>
                  <Panel className="control-panel"><div className="section-label">Liquidity guardrail</div><h2>Minimum cash buffer</h2><div className="range-value">{minRunway} <span>months</span></div><input className="range-input" type="range" min="0" max="18" step="1" value={minRunway} onChange={(e) => setMinRunway(Number(e.target.value))}/><div className="range-labels"><span>0</span><span>9</span><span>18 months</span></div><button className="primary-button wide" type="button" onClick={() => load()} disabled={loading}>{loading ? "Recomputing" : "Re-run optimization"}</button></Panel>
                </section>
                <Panel className="scenario-focus-card"><div className="panel-header"><div><div className="section-label">Selected scenario</div><h2>{customResult ? "Custom scenario result" : "Decision surface"}</h2></div><span className="objective-badge">{planningMonths}-month projection</span></div><div className="scenario-focus-value">{selectedScenarioData ? percent(selectedScenarioData.change_percent) : "—"}</div><div className="muted-caption">Marketing spend change</div><div className="focus-stats"><div><span>Monthly spend</span><strong>{compactMoney(selectedScenarioData?.marketing_spend)}</strong></div><div><span>Horizon revenue</span><strong>{compactMoney(selectedScenarioData?.horizon_revenue)}</strong></div><div><span>Horizon profit</span><strong>{compactMoney(selectedScenarioData?.horizon_profit)}</strong></div><div><span>Ending cash</span><strong>{compactMoney(selectedScenarioData?.ending_cash)}</strong></div></div></Panel>
                <Panel className="scenario-table-panel"><div className="panel-header"><div><div className="section-label">Decision surface</div><h2>Scenario matrix</h2></div><span className="control-badge">Select a row</span></div><div className="scenario-matrix"><div className="matrix-head"><span>Change</span><span>Spend</span><span>Horizon revenue</span><span>Horizon profit</span><span>Ending cash</span></div>{scenarios.map((s) => <button type="button" className={`matrix-row ${selectedScenarioData?.change_percent === s.change_percent && !customResult ? "selected" : ""}`} key={s.change_percent} onClick={() => { setCustomResult(null); setSelectedScenario(Number(s.change_percent)); }}><ScenarioPill change={s.change_percent}/><span>{compactMoney(s.marketing_spend)}</span><span>{compactMoney(s.horizon_revenue)}</span><span>{compactMoney(s.horizon_profit)}</span><span>{compactMoney(s.ending_cash)}</span></button>)}</div>
                  <div className="scenario-slider-row"><div><div className="section-label">Custom scenario</div><strong>{percent(customChange)} marketing spend</strong></div><input className="range-input" type="range" min="-30" max="30" step="5" value={customChange} onChange={(e) => setCustomChange(Number(e.target.value))}/><button className="secondary-button" type="button" disabled={scenarioLoading} onClick={runCustomScenario}>{scenarioLoading ? "Running" : "Run scenario"}</button></div>
                  {customResult && <div className="result-strip"><Icon name="check" size={14}/><span>{percent(customResult.change_percent)} scenario at {planningMonths} months: {compactMoney(customResult.horizon_profit)} projected horizon profit and {compactMoney(customResult.ending_cash)} ending cash.</span></div>}
                </Panel>
              </>
            )}

            {activeView === "decision" && (
              <>
                <SectionHeader eyebrow="Decision policy" title="Decision workspace" subtitle="See how the deterministic policy converts forecasts, metrics and constraints into an action." action={<button className="ghost-button" type="button" onClick={() => go("overview")}>Overview</button>} />
                <section className="decision-grid"><Panel className={`decision-hero ${String(decision?.recommendation || "hold").toLowerCase()}`}><div className="panel-topline"><span>Policy output</span><span className="live-badge">Deterministic</span></div><div className="decision-word">{decision?.recommendation}</div><div className="decision-change">{percent(optimization?.recommended_change_percent)} recommended change</div><p>{snapshot.explanation?.summary}</p><button className="primary-button" type="button" onClick={() => load()} disabled={loading}><Icon name="refresh" size={15}/> Re-run decision</button></Panel><Panel className="constraint-card"><div className="section-label">Optimization result</div><h2>Recommended spend</h2><div className="big-number">{compactMoney(optimization?.marketing_spend)}</div><div className="constraint-list"><div><span>Planning horizon</span><strong>{planningMonths} months</strong></div><div><span>Horizon profit</span><strong>{compactMoney(optimization?.horizon_profit)}</strong></div><div><span>Ending cash</span><strong>{compactMoney(optimization?.ending_cash)}</strong></div><div><span>Guardrail</span><strong>{minRunway} months</strong></div><div><span>Feasibility</span><strong>{optimization?.feasible ? "Within buffer" : "Pressure"}</strong></div></div></Panel></section>
                <section className="decision-evidence-grid"><Panel className="evidence-card"><div className="section-label">Decision drivers</div><h2>Why this action</h2><div className="driver-grid">{(snapshot.explanation?.drivers || []).map((x) => <div className="driver-item" key={x}><span className="driver-dot"/>{x}</div>)}</div></Panel><Panel className="evidence-card"><div className="section-label">Guardrails</div><h2>Policy boundaries</h2><div className="driver-grid">{(snapshot.explanation?.assumptions || []).map((x) => <div className="driver-item" key={x}><span className="driver-dot muted-dot"/>{x}</div>)}</div></Panel><Panel className="evidence-card"><div className="section-label">Next move</div><h2>Continue analysis</h2><p className="insight-summary">Change the planning horizon or liquidity guardrail in the scenario workspace and rerun the model.</p><div className="button-row"><button className="secondary-button" type="button" onClick={() => go("scenarios")}>Open scenarios</button><button className="secondary-button" type="button" onClick={() => go("forecast")}>Open forecast</button></div></Panel></section>
              </>
            )}

            {activeView === "monitoring" && (
              <>
                <SectionHeader eyebrow="Monitoring" title="System health" subtitle="Inspect the data footprint, model state and optimization signals for the current run." action={<button className="ghost-button" type="button" onClick={() => go("overview")}>Overview</button>} />
                <section className="monitor-grid"><Panel className="health-summary"><div className="panel-topline"><span>System status</span><span className="health-badge"><span/> {monitoring?.status}</span></div><div className="health-summary-value">Operational</div><p>Local decision model with {data.length} observations.</p></Panel><Panel className="health-summary"><div className="section-label">Forecast model</div><div className="health-summary-value small">{forecast?.model}</div><p>Selected using holdout WAPE.</p></Panel><Panel className="health-summary"><div className="section-label">Scenario guardrail</div><div className="health-summary-value">{minRunway} mo</div><p>Minimum liquidity buffer for the optimizer.</p></Panel></section>
                <section className="monitor-detail-grid"><Panel className="comparison-card"><div className="section-label">Signals</div><h2>Monitoring checks</h2><div className="monitor-list"><div><span>Revenue trend</span><strong>{metrics?.revenue_trend}</strong></div><div><span>Data quality</span><strong>{snapshot?.monitoring?.status}</strong></div><div><span>Optimization</span><strong>{optimization?.feasible ? "Within buffer" : "Pressure"}</strong></div><div><span>Last update</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "—"}</strong></div></div></Panel><Panel className="comparison-card"><div className="section-label">Recent data</div><h2>Latest periods</h2><div className="mini-table">{data.slice(-6).map((row) => <div key={row.month}><span>{String(row.month).slice(0,7)}</span><strong>{compactMoney(row.revenue)}</strong><em>{compactMoney(row.marketing_spend)}</em></div>)}</div></Panel></section>
              </>
            )}

            <footer className="footer"><span>Krio 1.2.1</span><span>Applied Decision Intelligence</span><span>{planningMonths}-month plan</span><span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}` : "Ready"}</span></footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
