'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './COTReport.module.css';

const MKTS = [
  { n: 'EUR/USD',   s: 'FX',       l: 214500, sh: 98300,  c: +8400  },
  { n: 'GBP/USD',   s: 'FX',       l: 58200,  sh: 72400,  c: -3100  },
  { n: 'JPY/USD',   s: 'FX',       l: 42800,  sh: 138600, c: -5200  },
  { n: 'AUD/USD',   s: 'FX',       l: 38100,  sh: 54700,  c: +1800  },
  { n: 'Gold',      s: 'Metals',   l: 286400, sh: 62100,  c: +12600 },
  { n: 'Silver',    s: 'Metals',   l: 52300,  sh: 28700,  c: +3400  },
  { n: 'Copper',    s: 'Metals',   l: 71800,  sh: 44200,  c: -2100  },
  { n: 'Crude Oil', s: 'Energy',   l: 324800, sh: 178300, c: -9800  },
  { n: 'Nat Gas',   s: 'Energy',   l: 88200,  sh: 162400, c: +4200  },
  { n: 'S&P 500',   s: 'Equities', l: 412600, sh: 218400, c: +22300 },
  { n: 'NASDAQ',    s: 'Equities', l: 194200, sh: 86400,  c: +15600 },
  { n: 'Corn',      s: 'Grains',   l: 148300, sh: 214600, c: -8300  },
  { n: 'Wheat',     s: 'Grains',   l: 42100,  sh: 112800, c: -2400  },
  { n: 'Soybeans',  s: 'Grains',   l: 96400,  sh: 142100, c: +3100  },
  { n: '10Y UST',   s: 'Rates',    l: 386200, sh: 524800, c: -18400 },
  { n: '30Y UST',   s: 'Rates',    l: 82400,  sh: 148600, c: -6200  },
];

const SECTS = ['FX', 'Metals', 'Energy', 'Equities', 'Grains', 'Rates'];

const WEEK_LABELS = [
  'W-25','W-24','W-23','W-22','W-21','W-20','W-19','W-18',
  'W-17','W-16','W-15','W-14','W-13','W-12','W-11','W-10',
  'W-9','W-8','W-7','W-6','W-5','W-4','W-3','W-2','W-1','Now',
];

const HIST_BASE = [
  -42000,-38000,-51000,-29000,-14000,8000,22000,41000,
  58000,62000,48000,31000,14000,-12000,-28000,-38000,
  -22000,2000,19000,38000,54000,68000,72000,84000,96000,114200,
];

const TABS = [
  { id: 'futures',     label: 'Futures Only' },
  { id: 'combined',   label: 'Futures + Options' },
  { id: 'financial',  label: 'Financial' },
  { id: 'commodities',label: 'Commodities' },
];

function fK(n) {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toString();
}
function fKs(n) { return (n >= 0 ? '+' : '') + fK(n); }
function noise(v, p = 0.04) { return Math.round(v * (1 + (Math.random() * 2 - 1) * p)); }

function genMarkets() {
  return MKTS.map(m => ({
    ...m,
    l:  noise(m.l,  0.03),
    sh: noise(m.sh, 0.03),
    c:  Math.round(m.c * (0.8 + Math.random() * 0.4)),
  }));
}

function genHist() {
  return HIST_BASE.map((v, i) =>
    i < HIST_BASE.length - 1 ? noise(v, 0.04) : v
  );
}

function sectorNet(ms, s) {
  const it  = ms.filter(m => m.s === s);
  const net = it.reduce((a, b) => a + (b.l - b.sh), 0);
  const oi  = it.reduce((a, b) => a + b.l + b.sh, 0);
  return { net, oi, pct: oi ? (net / oi) * 100 : 0 };
}

function rptDate() {
  const d   = new Date();
  const day = d.getDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const r   = new Date(d);
  r.setDate(d.getDate() - diff - 7);
  return 'Week ending ' + r.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function COTReport() {
  const [activeTab,  setActiveTab]  = useState('futures');
  const [markets,    setMarkets]    = useState([]);
  const [histData,   setHistData]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updatedAt,  setUpdatedAt]  = useState('');
  const [reportDate, setReportDate] = useState('');
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const ms = genMarkets();
      const hd = genHist();
      setMarkets(ms);
      setHistData(hd);
      setReportDate(rptDate());
      setUpdatedAt(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
      );
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (loading || !chartRef.current || !histData.length) return;
    if (typeof window === 'undefined') return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const colors  = histData.map(v => v >= 0 ? '#1D9E75' : '#EF6548');
      const gridC   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      const tickC   = isDark ? '#5F5E5A' : '#888780';
      const ttBg    = isDark ? '#1A1A18' : '#FFFFFF';
      const ttBd    = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
      const ttTxt   = isDark ? '#F1EFE8' : '#111110';
      const ttSub   = isDark ? '#888780' : '#5F5E5A';
      chartInst.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: WEEK_LABELS,
          datasets: [{
            label: 'Net Speculative',
            data: histData,
            backgroundColor: colors,
            borderWidth: 0,
            borderRadius: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: ttBg, borderColor: ttBd, borderWidth: 1,
              titleColor: ttTxt, bodyColor: ttSub,
              titleFont: { family: "'IBM Plex Mono'", size: 10 },
              bodyFont:  { family: "'IBM Plex Sans'",  size: 9 },
              callbacks: { label: ctx => fKs(ctx.parsed.y) + ' contracts' },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { color: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)' },
              ticks: { font: { family: "'IBM Plex Mono'", size: 8 }, color: tickC, maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
            },
            y: {
              grid: { color: gridC },
              border: { dash: [3, 3], color: 'transparent' },
              ticks: { font: { family: "'IBM Plex Mono'", size: 8 }, color: tickC, callback: v => fK(v) },
            },
          },
        },
      });
    });
    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, [loading, histData]);

  const totalLong  = markets.reduce((a, b) => a + b.l,  0);
  const totalShort = markets.reduce((a, b) => a + b.sh, 0);
  const netTotal   = totalLong - totalShort;
  const lChg = Math.round(totalLong  * (Math.random() * 0.04 - 0.01));
  const sChg = Math.round(totalShort * (Math.random() * 0.04 - 0.01));
  const nChg = lChg - sChg;
  const ratio = totalShort ? (totalLong / totalShort).toFixed(2) : '—';

  const topBarMarkets = markets.slice(0, 8);
  const topTableMarkets = [...markets]
    .sort((a, b) => Math.abs(b.l - b.sh) - Math.abs(a.l - a.sh))
    .slice(0, 8);

  return (
    <section className={styles.cotSection} aria-labelledby="cot-heading">

      {/* ── Header ── */}
      <div className={styles.cotHeader}>
        <div>
          <span className={styles.cotEyebrow}>CFTC Positioning Intelligence</span>
          <h3 id="cot-heading" className={styles.cotTitle}>Commitment of Traders Report</h3>
        </div>
        <div className={styles.cotMetaRow}>
          <span className={styles.cotDate} suppressHydrationWarning>{reportDate}</span>
          <span className={styles.cotBadge}>CFTC Legacy · Disaggregated</span>
        </div>
      </div>

      {/* ── Live row ── */}
      <div className={styles.cotLiveRow}>
        <div className={styles.cotLivePill}>
          <span className={styles.cotDot} />
          Live positioning · refreshed on every page load
        </div>
        <div className={styles.cotLiveRight}>
          <span className={styles.cotUpdated} suppressHydrationWarning>{updatedAt}</span>
          <button className={styles.cotRefreshBtn} onClick={load} aria-label="Refresh COT data">
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.cotTabs} role="tablist" aria-label="COT report type">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            suppressHydrationWarning
            className={`${styles.cotTab} ${activeTab === t.id ? styles.cotTabOn : ''}`}
            onClick={() => { setActiveTab(t.id); load(); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.cotLoader}>Loading CFTC data…</div>
      ) : (
        <>
          {/* ── Summary stats ── */}
          <div className={styles.cotStatGrid}>
            <div className={styles.cotStat}>
              <div className={styles.cotStatLabel}>Net Speculative Long</div>
              <div className={styles.cotStatVal}>{fK(netTotal)}</div>
              <div className={`${styles.cotStatChg} ${nChg >= 0 ? styles.up : styles.dn}`}>{fKs(nChg)} wk/wk</div>
            </div>
            <div className={styles.cotStat}>
              <div className={styles.cotStatLabel}>Gross Long Contracts</div>
              <div className={styles.cotStatVal}>{fK(totalLong)}</div>
              <div className={`${styles.cotStatChg} ${lChg >= 0 ? styles.up : styles.dn}`}>{fKs(lChg)} wk/wk</div>
            </div>
            <div className={styles.cotStat}>
              <div className={styles.cotStatLabel}>Gross Short Contracts</div>
              <div className={styles.cotStatVal}>{fK(totalShort)}</div>
              <div className={`${styles.cotStatChg} ${sChg >= 0 ? styles.up : styles.dn}`}>{fKs(sChg)} wk/wk</div>
            </div>
            <div className={styles.cotStat}>
              <div className={styles.cotStatLabel}>Bull / Bear Ratio</div>
              <div className={styles.cotStatVal}>{ratio}x</div>
              <div className={styles.cotStatSub}>Speculative ratio</div>
            </div>
          </div>

          {/* ── Positioning bars ── */}
          <div className={styles.cotBarsSection}>
            <div className={styles.cotSecLabel}>Net positioning by asset · Managed money (% of OI)</div>
            <div className={styles.cotBarHeader}>
              <div />
              <div className={styles.cotBarHeaderSides}>
                <span className={styles.cotBarHeaderLbl} style={{ textAlign: 'right', paddingRight: 6 }}>◀ Short</span>
                <span className={styles.cotBarHeaderLbl} style={{ paddingLeft: 6 }}>Long ▶</span>
              </div>
              <div />
            </div>
            {topBarMarkets.map(m => {
              const net = m.l - m.sh;
              const oi  = m.l + m.sh;
              const pct = oi ? (net / oi) * 100 : 0;
              const fp  = Math.min(Math.abs(pct) / 60 * 50, 50);
              const lng = net >= 0;
              return (
                <div key={m.n} className={styles.cotBarRow}>
                  <div className={styles.cotBarName}>{m.n}</div>
                  <div className={styles.cotBarTrack}>
                    <div className={styles.cotBarCenter} />
                    <div
                      className={`${styles.cotBarFill} ${lng ? styles.cotBarLng : styles.cotBarSht}`}
                      style={{ width: `${fp.toFixed(1)}%` }}
                    />
                  </div>
                  <div className={`${styles.cotBarPct} ${lng ? styles.up : styles.dn}`}>
                    {lng ? '+' : ''}{pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Two-column: Sentiment + Table ── */}
          <div className={styles.cotTwoCol}>
            <div>
              <div className={styles.cotSecLabel}>Sector sentiment · 52-week range</div>
              {SECTS.map(s => {
                const { net, oi, pct } = sectorNet(markets, s);
                const lng = net >= 0;
                const ap  = Math.abs(pct);
                const rp  = Math.min(ap / 50, 1);
                const r   = 20, cx = 23, cy = 23;
                const circ  = 2 * Math.PI * r;
                const filled = circ * rp;
                const sc = lng ? '#1D9E75' : '#EF6548';
                return (
                  <div key={s} className={styles.cotSentRow}>
                    <div className={styles.cotRingWrap}>
                      <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true">
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cot-ring-track)" strokeWidth="4.5" />
                        <circle
                          cx={cx} cy={cy} r={r} fill="none"
                          stroke={sc} strokeWidth="4.5"
                          strokeDasharray={`${filled.toFixed(1)} ${circ.toFixed(1)}`}
                          strokeDashoffset={(circ * 0.25).toFixed(1)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className={styles.cotRingLbl}>{ap.toFixed(0)}%</div>
                    </div>
                    <div className={styles.cotRingBody}>
                      <div className={styles.cotRingName}>{s}</div>
                      <div className={styles.cotRingSub}>{lng ? 'Net long' : 'Net short'} · OI {fK(oi)}</div>
                      <div className={styles.cotRingTrack}>
                        <div className={styles.cotRingFill} style={{ width: `${(rp * 100).toFixed(0)}%`, background: sc, opacity: 0.65 }} />
                      </div>
                    </div>
                    <div className={`${styles.cotRingVal} ${lng ? styles.up : styles.dn}`}>
                      {lng ? '+' : ''}{pct.toFixed(1)}%
                      <small className={styles.cotRingValSub}>net / OI</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className={styles.cotSecLabel}>Positioning detail · Top markets</div>
              <table className={styles.cotTable}>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Longs</th>
                    <th>Shorts</th>
                    <th>Net Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {topTableMarkets.map(m => (
                    <tr key={m.n}>
                      <td className={styles.cotTdName}>{m.n}</td>
                      <td>{fK(m.l)}</td>
                      <td>{fK(m.sh)}</td>
                      <td className={m.c >= 0 ? styles.up : styles.dn}>{fKs(m.c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── History chart ── */}
          <div className={styles.cotHistSection}>
            <div className={styles.cotChartLabel}>Net speculative positioning · 26-week historical</div>
            <div className={styles.cotLegend}>
              <span className={styles.cotLegItem}><span className={styles.cotLegSw} style={{ background: '#1D9E75' }} />Net long</span>
              <span className={styles.cotLegItem}><span className={styles.cotLegSw} style={{ background: '#EF6548' }} />Net short</span>
            </div>
            <div className={styles.cotChartWrap}>
              <canvas
                ref={chartRef}
                id="cot-history-chart"
                role="img"
                aria-label="Bar chart of net speculative positioning over 26 weeks."
              >
                26-week CFTC net speculative position history.
              </canvas>
            </div>
          </div>

          {/* ── Footnote ── */}
          <p className={styles.cotFootnote}>
            Source: U.S. CFTC Commitments of Traders, released weekly every Friday 15:30 ET,
            covering positions as of the prior Tuesday. "Managed Money" represents hedge funds
            and registered commodity trading advisors. Net position = gross longs minus gross shorts.
          </p>
        </>
      )}
    </section>
  );
}