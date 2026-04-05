/**
 * Generated demo component showcasing HooksLens features and UI components. Using Claude AI with a custom prompt to generate realistic demo data and descriptions. Not intended for production use or as a reference implementation.
 */
import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`;

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const LIGHT = `
  --bg:#f4f6f9; --surface:#ffffff; --surface2:#f0f2f6; --surface3:#e8eaef;
  --border:#e2e6ec; --border2:#d0d5de;
  --text:#0f172a; --text2:#475569; --text3:#94a3b8; --text4:#cbd5e1;
  --accent:#92650a; --accent2:#b8860b; --accent-bg:#eff6ff; --accent-border:rgba(37,99,235,.18);
  --purple:#b8860b; --purple-bg:#fff8dc; --purple-border:rgba(184,134,11,.18);
  --green:#16a34a; --green-bg:#f0fdf4; --green-border:rgba(22,163,74,.18);
  --yellow:#ca8a04; --yellow-bg:#fefce8; --yellow-border:rgba(202,138,4,.18);
  --red:#dc2626; --red-bg:#fef2f2; --red-border:rgba(220,38,38,.18);
  --orange:#ea580c; --orange-bg:#fff7ed; --orange-border:rgba(234,88,12,.18);
  --cyan:#0891b2; --cyan-bg:#ecfeff; --cyan-border:rgba(8,145,178,.18);
  --shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --shadow-md:0 4px 8px rgba(0,0,0,.07);
  --toggle-icon:"🌙";
`;
const DARK = `
  --bg:#0a0c10; --surface:#111318; --surface2:#181c24; --surface3:#1f2530;
  --border:#1e2330; --border2:#252d3d;
  --text:#e2e8f0; --text2:#94a3b8; --text3:#475569; --text4:#2d3d55;
  --accent:#f0b429; --accent2:#c9a050; --accent-bg:rgba(240,180,41,.1); --accent-border:rgba(240,180,41,.25);
  --purple:#c9a050; --purple-bg:rgba(201,160,80,.1); --purple-border:rgba(201,160,80,.25);
  --green:#22c55e; --green-bg:rgba(34,197,94,.1); --green-border:rgba(34,197,94,.25);
  --yellow:#eab308; --yellow-bg:rgba(234,179,8,.1); --yellow-border:rgba(234,179,8,.25);
  --red:#ef4444; --red-bg:rgba(239,68,68,.1); --red-border:rgba(239,68,68,.25);
  --orange:#f97316; --orange-bg:rgba(249,115,22,.1); --orange-border:rgba(249,115,22,.25);
  --cyan:#06b6d4; --cyan-bg:rgba(6,182,212,.1); --cyan-border:rgba(6,182,212,.25);
  --shadow:0 1px 3px rgba(0,0,0,.3);
  --shadow-md:0 4px 8px rgba(0,0,0,.4);
  --toggle-icon:"☀️";
`;

const BASE_CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;overflow:hidden;font-size:16px;}
.app{display:grid;grid-template-rows:52px 1fr;grid-template-columns:264px 1fr;height:100vh;width:100vw;}

/* TOPBAR */
.topbar{grid-column:1/-1;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;justify-content:space-between;box-shadow:var(--shadow);}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:-.5px;display:flex;align-items:center;gap:8px;}
.logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;}
.logo-ver{font-size:11px;padding:1px 5px;border-radius:3px;background:var(--purple-bg);border:1px solid var(--purple-border);color:var(--purple);margin-left:2px;font-family:'JetBrains Mono',monospace;}
.logo-path{font-size:12px;color:var(--text3);background:var(--surface2);border:1px solid var(--border);padding:2px 8px;border-radius:4px;font-family:'JetBrains Mono',monospace;}
.topbar-right{display:flex;align-items:center;gap:8px;}
.theme-btn{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:5px;color:var(--text2);font-family:'Inter',sans-serif;font-size:13px;transition:all .15s;}
.theme-btn:hover{background:var(--surface3);color:var(--text);}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:13px;padding:3px 9px;border-radius:16px;border:1px solid;}
.pill-default{color:var(--text2);background:var(--surface2);border-color:var(--border);}
.pill-green{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
.pill-yellow{background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--yellow);}
.pill-red{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.pill-orange{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);}
.pill-purple{background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.pulse{animation:pulse 2s infinite;}

/* SIDEBAR */
.sidebar{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--border);margin:10px;border-radius:7px;overflow:hidden;box-shadow:var(--shadow);}
.stat-box{background:var(--surface);padding:8px 9px;}
.stat-val{font-size:20px;font-weight:700;font-family:'Syne',sans-serif;line-height:1;}
.stat-val.c-blue{color:var(--accent)}.stat-val.c-green{color:var(--green)}.stat-val.c-yellow{color:var(--yellow)}.stat-val.c-red{color:var(--red)}.stat-val.c-orange{color:var(--orange)}.stat-val.c-purple{color:var(--purple)}
.stat-label{font-size:11px;color:var(--text3);margin-top:2px;}
.nav-section{padding:4px 0;border-top:1px solid var(--border);}
.nav-section-label{font-size:11px;font-weight:600;letter-spacing:1px;color:var(--text3);text-transform:uppercase;padding:5px 14px 4px;}
.nav-item{display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;font-size:13px;color:var(--text2);transition:all .12s;border-left:2px solid transparent;user-select:none;}
.nav-item:hover{background:var(--surface2);color:var(--text);}
.nav-item.active{background:var(--accent-bg);color:var(--accent);border-left-color:var(--accent);}
.nav-badge{margin-left:auto;font-size:11px;padding:1px 6px;border-radius:10px;background:var(--surface2);border:1px solid var(--border2);color:var(--text3);}
.nav-badge.orange{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);}
.nav-badge.red{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.nav-badge.yellow{background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--yellow);}
.nav-badge.purple{background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);}
.route-nav-item{display:flex;align-items:center;padding:5px 14px;cursor:pointer;font-size:13px;color:var(--text2);transition:all .1s;border-left:2px solid transparent;gap:5px;font-family:'JetBrains Mono',monospace;}
.route-nav-item:hover{background:var(--surface2);color:var(--text);}
.route-nav-item.active{background:var(--accent-bg);color:var(--accent);border-left-color:var(--accent);}
.current-badge{font-size:8px;padding:1px 5px;border-radius:3px;background:var(--accent-bg);border:1px solid var(--accent-border);color:var(--accent);}
.cov-pct-label{font-size:11px;margin-left:auto;font-family:'Inter',sans-serif;}

/* ALERT STRIPS */
.alert-strip{padding:6px 20px;display:flex;align-items:center;gap:8px;font-size:12px;flex-shrink:0;border-bottom:1px solid;}
.alert-strip.purple{background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);}
.alert-strip.orange{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);}
.alert-strip.red{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.alert-dismiss{margin-left:auto;cursor:pointer;color:var(--text3);font-size:13px;line-height:1;}
.alert-dismiss:hover{color:var(--text);}

/* MAIN HEADER */
.main{display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}
.main-header{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;gap:10px;box-shadow:var(--shadow);}
.main-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px;}
.main-subtitle{font-size:12px;color:var(--text3);margin-top:2px;}
.toolbar{display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
.toolbar-row{display:flex;gap:6px;align-items:center;}
.btn{font-family:'Inter',sans-serif;font-size:13px;padding:4px 11px;border-radius:5px;cursor:pointer;border:1px solid var(--border2);background:var(--surface);color:var(--text2);transition:all .12s;box-shadow:var(--shadow);}
.btn:hover{background:var(--surface2);color:var(--text);}
.search-input{font-family:'JetBrains Mono',monospace;font-size:13px;background:var(--surface);border:1px solid var(--border2);color:var(--text);padding:4px 10px;border-radius:5px;width:200px;outline:none;box-shadow:var(--shadow);}
.search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg);}
.search-input::placeholder{color:var(--text4);}
.route-filter{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.route-filter-label{font-size:12px;color:var(--text3);}
.route-chip{font-size:12px;padding:2px 8px;border-radius:4px;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text3);transition:all .12s;white-space:nowrap;}
.route-chip:hover{border-color:var(--accent);color:var(--accent);}
.route-chip.active{background:var(--accent-bg);border-color:var(--accent-border);color:var(--accent);font-weight:500;}
.content{flex:1;overflow-y:auto;padding:16px 20px;}

/* HOOK CARDS */
.hooks-section{margin-bottom:18px;}
.hooks-section-title{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:7px;padding-bottom:6px;border-bottom:1px solid var(--border);}
.hook-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:11px 14px;margin-bottom:6px;box-shadow:var(--shadow);transition:box-shadow .15s;border-left-width:3px;}
.hook-card:hover{box-shadow:var(--shadow-md);}
.hook-card.ok{border-left-color:var(--border);}
.hook-card.flag-mismatch{border-left-color:var(--purple);background:var(--purple-bg);}
.hook-card.flag-error{border-left-color:var(--red);}
.hook-card.flag-stalled{border-left-color:var(--orange);}
.hc-row1{display:flex;align-items:center;gap:7px;margin-bottom:5px;}
.hc-name{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--text);}
.hc-desc{font-size:12px;color:var(--text3);line-height:1.4;}
.hc-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:5px;}
.hc-key{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface2);padding:2px 6px;border-radius:3px;border:1px solid var(--border);}

/* BADGES */
.badge{display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:2px 7px;border-radius:9px;font-weight:500;border:1px solid;white-space:nowrap;}
.badge-swr{background:var(--accent-bg);border-color:var(--accent-border);color:var(--accent);}
.badge-custom{background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);}
.badge-effect{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);}
.badge-mutation{background:var(--cyan-bg,rgba(6,182,212,.1));border-color:var(--cyan-border,rgba(6,182,212,.2));color:var(--cyan);}
.badge-fresh{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
.badge-fetching{background:var(--accent-bg);border-color:var(--accent-border);color:var(--accent);}
.badge-stale{background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--yellow);}
.badge-error{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.badge-stalled{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);animation:pulse 1.2s infinite;}
.badge-polling{background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--yellow);}
.badge-mismatch{background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);}
.badge-dup{background:var(--orange-bg);border-color:var(--orange-border);color:var(--orange);}
.badge-http-ok{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}
.badge-http-bad{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.badge-http-warn{background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--yellow);}
.badge-muted{background:var(--surface2);border-color:var(--border);color:var(--text3);}

/* TABLE */
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;box-shadow:var(--shadow);}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead{background:var(--surface2);}
th{text-align:left;padding:8px 12px;font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);}
tr.trow{border-bottom:1px solid var(--border);transition:background .08s;cursor:pointer;}
tr.trow:last-child{border-bottom:none;}
tr.trow:hover{background:var(--surface2);}
tr.trow.flagged{background:var(--purple-bg);border-left:2px solid var(--purple);}
td{padding:8px 12px;vertical-align:middle;}
.mono{font-family:'JetBrains Mono',monospace;font-size:12px;}
.dur-fast{color:var(--green);font-family:'JetBrains Mono',monospace;}
.dur-med{color:var(--yellow);font-family:'JetBrains Mono',monospace;}
.dur-slow{color:var(--red);font-family:'JetBrains Mono',monospace;}

/* PARAM INSPECTOR */
.pi-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:12px;box-shadow:var(--shadow);}
.pi-header{padding:10px 14px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;}
.pi-body{padding:12px 14px;}
.pi-shapes{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
.pi-shape{padding:6px 10px;border-radius:5px;}
.pi-shape.shape-a{background:var(--accent-bg);border:1px solid var(--accent-border);}
.pi-shape.shape-b{background:var(--purple-bg);border:1px solid var(--purple-border);}
.pi-shape-label{font-size:11px;font-weight:600;margin-bottom:3px;color:var(--text3);}
.pi-shape-keys{display:flex;gap:4px;flex-wrap:wrap;}
.pi-key{font-family:'JetBrains Mono',monospace;font-size:12px;}
.pi-shape.shape-a .pi-key{color:var(--accent);}
.pi-shape.shape-b .pi-key{color:var(--purple);}
.pi-example{font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 8px;border-radius:4px;margin-top:4px;}
.pi-example.ex-a{background:var(--accent-bg);border:1px solid var(--accent-border);color:var(--accent);}
.pi-example.ex-b{background:var(--purple-bg);border:1px solid var(--purple-border);color:var(--purple);}
.pi-fix{padding:8px 10px;border-radius:5px;font-size:12px;background:var(--purple-bg);border:1px solid var(--purple-border);color:var(--text2);margin-top:8px;line-height:1.5;}

/* COVERAGE */
.cov-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px 20px;}
.cov-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;box-shadow:var(--shadow);}
.cov-card-header{padding:9px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface2);}
.cov-card-title{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;}
.cov-row{display:flex;align-items:center;padding:7px 12px;border-bottom:1px solid var(--border);gap:8px;font-size:12px;}
.cov-row:last-child{border-bottom:none;}
.cov-key{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'JetBrains Mono',monospace;font-size:12px;}
.cov-bar-track{width:80px;height:7px;background:var(--surface3);border-radius:3px;overflow:hidden;flex-shrink:0;}
.cov-bar{height:100%;border-radius:3px;transition:width .3s;}
.cov-empty{padding:18px 12px;font-size:12px;color:var(--text3);text-align:center;}

/* WATERFALL */
.wf-header{display:flex;align-items:center;gap:8px;padding:9px 20px;border-bottom:1px solid var(--border);font-size:12px;color:var(--text3);background:var(--surface);flex-shrink:0;}
.wf-legend{display:flex;gap:10px;margin-left:auto;}
.wf-legend-item{display:flex;align-items:center;gap:3px;font-size:11px;}
.wf-row{display:flex;align-items:center;padding:5px 20px;border-bottom:1px solid var(--border);gap:8px;min-height:30px;background:var(--surface);}
.wf-row:hover{background:var(--surface2);}
.wf-key{width:185px;flex-shrink:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'JetBrains Mono',monospace;}
.wf-origin{width:52px;flex-shrink:0;}
.wf-route{width:120px;flex-shrink:0;font-size:11px;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'JetBrains Mono',monospace;}
.wf-track{flex:1;height:18px;background:var(--surface2);border-radius:3px;position:relative;overflow:hidden;border:1px solid var(--border);}
.wf-bar{height:100%;border-radius:2px;position:absolute;left:0;display:flex;align-items:center;padding:0 5px;font-size:8px;font-weight:600;white-space:nowrap;overflow:hidden;font-family:'JetBrains Mono',monospace;}
.wf-bar.wf-success{background:var(--green-bg);color:var(--green);border-right:2px solid var(--green);}
.wf-bar.wf-error{background:var(--red-bg);color:var(--red);border-right:2px solid var(--red);}
.wf-bar.wf-slow{background:var(--orange-bg);color:var(--orange);border-right:2px solid var(--orange);}
.wf-bar.wf-pending{background:var(--accent-bg);color:var(--accent);border-right:2px solid var(--accent);animation:pulse 1s infinite;}
.wf-dur{width:50px;flex-shrink:0;text-align:right;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;}
.wf-conc{width:22px;flex-shrink:0;text-align:center;}
.conc-badge{font-size:8px;padding:1px 4px;border-radius:3px;background:var(--purple-bg);border:1px solid var(--purple-border);color:var(--purple);}

/* TIMELINE */
.timeline-panel{border-top:2px solid var(--border);background:var(--surface);flex-shrink:0;height:188px;display:flex;flex-direction:column;}
.timeline-header{display:flex;align-items:center;justify-content:space-between;padding:7px 20px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface2);}
.timeline-title{font-size:12px;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:6px;}
.timeline-hint{font-size:11px;color:var(--text3);}
.timeline-scroll{overflow-y:auto;flex:1;}
.tl-row{display:flex;align-items:center;gap:8px;padding:5px 20px;border-bottom:1px solid var(--border);font-family:'JetBrains Mono',monospace;font-size:11px;}
@keyframes slide-in{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
.tl-row{animation:slide-in .12s ease;}
.tl-row.flag-p{background:var(--purple-bg);border-left:2px solid var(--purple);}
.tl-row.flag-d{background:var(--orange-bg);border-left:2px solid var(--orange);}
.tl-row.flag-e{background:var(--red-bg);border-left:2px solid var(--red);}
.tl-time{color:var(--text3);width:74px;flex-shrink:0;font-size:11px;}
.tl-type{width:110px;flex-shrink:0;font-size:11px;font-weight:600;}
.tl-type.fetch,.tl-type.external-fetch{color:var(--accent)}
.tl-type.success,.tl-type.external-success{color:var(--green)}
.tl-type.error,.tl-type.external-error,.tl-type.mutation-error{color:var(--red)}
.tl-type.dedup{color:var(--text3)}
.tl-type.slow{color:var(--orange)}
.tl-type.stalled{color:var(--orange)}
.tl-type.mutation,.tl-type.mutation-success{color:var(--purple)}
.tl-type.param-mismatch{color:var(--purple)}
.tl-type.duplicate-fetch{color:var(--orange)}
.tl-route{color:var(--accent);width:140px;flex-shrink:0;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tl-hook{width:120px;flex-shrink:0;font-size:11px;color:var(--purple);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tl-key{color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tl-dur{color:var(--text3);width:50px;text-align:right;flex-shrink:0;}
.tl-flag{flex-shrink:0;width:14px;font-size:12px;}

::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--surface2);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
`;

// ─── Mock data ──────────────────────
const PAGES = {
  "/products/[productId]": {
    swr: [
      {
        id: 1,
        hookName: "useProduct",
        desc: "Fetches product details and pricing. SWR.",
        key: "/api/products/[productId]",
        type: "swr",
        status: "fresh",
        dur: 89,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: false,
        interval: null,
      },
      {
        id: 2,
        hookName: "useReviews",
        desc: "Product reviews. SWR. Sends productId while legacy useEffect still sends product. API 400s on SWR request.",
        key: "['/api/reviews',{productId:'P-301',page:1}]",
        type: "swr",
        status: "error",
        dur: null,
        err: 2,
        slow: 0,
        badReq: 2,
        http: 400,
        mismatch: true,
        dup: true,
        interval: null,
      },
      {
        id: 3,
        hookName: "useInventory",
        desc: "Stock level monitoring. SWR with 10s polling.",
        key: "/api/inventory/[productId]",
        type: "swr",
        status: "fresh",
        dur: 203,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: false,
        interval: 10000,
      },
      {
        id: 4,
        hookName: "addToCart",
        desc: "Mutation that adds product to cart. useSWRMutation.",
        key: "addToCart",
        type: "mutation",
        status: "fresh",
        dur: 312,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: false,
        interval: null,
      },
    ],
    custom: [
      {
        id: 5,
        hookName: "useProductBundle",
        desc: "Custom hook composing useProduct + useRecommendations. Creates 2 overlapping SWR subscriptions pending cleanup.",
        key: "/api/products/[id] + /api/recommendations/[id]",
        type: "custom",
        status: "fresh",
        dur: 390,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: false,
        interval: null,
      },
    ],
    effect: [
      {
        id: 6,
        hookName: "useEffect (reviews)",
        desc: "Legacy useEffect reviews fetch. Uses product param and conflicts with SWR hook using productId.",
        key: "/api/reviews?product=P-301&page=1",
        type: "effect",
        status: "fresh",
        dur: 290,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: true,
        dup: true,
        interval: null,
      },
    ],
  },
  "/catalog": {
    swr: [
      {
        id: 7,
        hookName: "useProductList",
        desc: "Paginated product catalog with filters.",
        key: "['/api/products',{page:1,category:'electronics'}]",
        type: "swr",
        status: "fresh",
        dur: 142,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: true,
        interval: null,
      },
    ],
    custom: [],
    effect: [
      {
        id: 8,
        hookName: "useEffect (catalog)",
        desc: "Legacy useEffect calling same URL as useProductList. Duplicate candidate to remove.",
        key: "/api/products?page=1&category=electronics",
        type: "effect",
        status: "fresh",
        dur: 155,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: true,
        interval: null,
      },
    ],
  },
  "/orders": {
    swr: [
      {
        id: 9,
        hookName: "useOrders",
        desc: "Order history fetch. Consistently slow with intermittent 500 responses.",
        key: "/api/orders/[userId]",
        type: "swr",
        status: "error",
        dur: 4021,
        err: 3,
        slow: 2,
        badReq: 0,
        http: 500,
        mismatch: false,
        dup: false,
        interval: null,
      },
    ],
    custom: [],
    effect: [
      {
        id: 10,
        hookName: "useEffect (orders x3)",
        desc: "Three separate order useEffect calls. Candidate for one consolidated useSWR key.",
        key: "/api/orders?userId=42",
        type: "effect",
        status: "fresh",
        dur: 112,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: false,
        interval: null,
      },
    ],
  },
  "/cart": {
    swr: [
      {
        id: 11,
        hookName: "useCart",
        desc: "Shopping cart state. 3s polling. Currently stalled and likely blocked by expensive render path.",
        key: "/api/cart/current",
        type: "swr",
        status: "stalled",
        dur: null,
        err: 0,
        slow: 1,
        badReq: 0,
        http: null,
        mismatch: false,
        dup: true,
        interval: 3000,
      },
    ],
    custom: [],
    effect: [
      {
        id: 12,
        hookName: "useEffect (cart)",
        desc: "Duplicate fetch for cart endpoint. Remove once useCart stall is resolved.",
        key: "/api/cart/current",
        type: "effect",
        status: "fresh",
        dur: 95,
        err: 0,
        slow: 0,
        badReq: 0,
        http: 200,
        mismatch: false,
        dup: true,
        interval: null,
      },
    ],
  },
};

const COVERAGE = [
  {
    route: "/products/[productId]",
    swr: 4,
    effect: 1,
    total: 5,
    pct: 80,
    dups: ["/api/reviews"],
    inconsistent: ["/api/reviews"],
  },
  {
    route: "/catalog",
    swr: 1,
    effect: 1,
    total: 2,
    pct: 50,
    dups: ["/api/products"],
    inconsistent: [],
  },
  {
    route: "/orders",
    swr: 1,
    effect: 3,
    total: 4,
    pct: 25,
    dups: [],
    inconsistent: [],
  },
  {
    route: "/cart",
    swr: 1,
    effect: 1,
    total: 2,
    pct: 50,
    dups: ["/api/cart/current"],
    inconsistent: [],
  },
  {
    route: "/dashboard",
    swr: 6,
    effect: 0,
    total: 6,
    pct: 100,
    dups: [],
    inconsistent: [],
  },
];

const MISMATCHES = [
  {
    endpoint: "/api/reviews",
    route: "/products/[productId]",
    sets: [
      ["productId", "page"],
      ["product", "page"],
    ],
    count: 4,
    examples: [
      "/api/reviews?productId=P-301&page=1",
      "/api/reviews?product=P-301&page=1",
    ],
  },
];

const WF = [
  {
    id: 1,
    key: "useProduct -> /api/products/P-301",
    route: "/products/[productId]",
    origin: "swr",
    start: 0,
    dur: 89,
    status: "wf-success",
    http: 200,
    conc: ["useInventory"],
  },
  {
    id: 2,
    key: "useInventory -> /api/inventory/P-301",
    route: "/products/[productId]",
    origin: "swr",
    start: 20,
    dur: 203,
    status: "wf-success",
    http: 200,
    conc: ["useProduct"],
  },
  {
    id: 3,
    key: "useReviews -> /api/reviews?productId=P-301",
    route: "/products/[productId]",
    origin: "swr",
    start: 250,
    dur: null,
    status: "wf-error",
    http: 400,
    conc: [],
  },
  {
    id: 4,
    key: "useEffect -> /api/reviews?product=P-301",
    route: "/products/[productId]",
    origin: "effect",
    start: 260,
    dur: 290,
    status: "wf-success",
    http: 200,
    conc: ["useReviews"],
  },
  {
    id: 5,
    key: "useOrders -> /api/orders/42",
    route: "/orders",
    origin: "swr",
    start: 0,
    dur: 4021,
    status: "wf-slow",
    http: 500,
    conc: [],
  },
  {
    id: 6,
    key: "useCart -> /api/cart/current",
    route: "/cart",
    origin: "swr",
    start: 500,
    dur: null,
    status: "wf-pending",
    http: null,
    conc: [],
  },
];

const INIT_TL = [
  {
    id: 1,
    time: "10:22:01.100",
    type: "param-mismatch",
    route: "/products/[productId]",
    hook: "useReviews",
    key: "/api/reviews",
    dur: null,
    http: null,
    flag: "p",
  },
  {
    id: 2,
    time: "10:22:01.350",
    type: "error",
    route: "/products/[productId]",
    hook: "useReviews",
    key: "/api/reviews?productId=P-301",
    dur: "—",
    http: 400,
    flag: "e",
  },
  {
    id: 3,
    time: "10:22:01.360",
    type: "external-fetch",
    route: "/products/[productId]",
    hook: "useEffect",
    key: "/api/reviews?product=P-301",
    dur: null,
    http: null,
    flag: "",
  },
  {
    id: 4,
    time: "10:22:01.650",
    type: "duplicate-fetch",
    route: "/products/[productId]",
    hook: "useEffect",
    key: "/api/reviews",
    dur: null,
    http: null,
    flag: "d",
  },
  {
    id: 5,
    time: "10:22:01.655",
    type: "external-success",
    route: "/products/[productId]",
    hook: "useEffect",
    key: "/api/reviews?product=P-301",
    dur: "290ms",
    http: 200,
    flag: "",
  },
  {
    id: 6,
    time: "10:22:03.400",
    type: "slow",
    route: "/orders",
    hook: "useOrders",
    key: "/api/orders/42",
    dur: "4021ms",
    http: 500,
    flag: "e",
  },
  {
    id: 7,
    time: "10:22:08.100",
    type: "stalled",
    route: "/cart",
    hook: "useCart",
    key: "/api/cart/current",
    dur: ">5000ms",
    http: null,
    flag: "e",
  },
  {
    id: 8,
    time: "10:22:09.000",
    type: "success",
    route: "/products/[productId]",
    hook: "useProduct",
    key: "/api/products/P-301",
    dur: "89ms",
    http: 200,
    flag: "",
  },
];

const NAV = [
  { id: "page", icon: "⊡", label: "Current Page", badge: null, bc: "" },
  { id: "registry", icon: "◈", label: "All Hooks", badge: null, bc: "" },
  {
    id: "params",
    icon: "⊛",
    label: "Param Inspector",
    badge: "1",
    bc: "purple",
  },
  { id: "coverage", icon: "◉", label: "Fetch Coverage", badge: null, bc: "" },
  { id: "waterfall", icon: "≋", label: "Waterfall", badge: null, bc: "" },
  { id: "polling", icon: "⟳", label: "Polling", badge: "3", bc: "yellow" },
];

function tn() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
const httpCls = (s) =>
  !s ? "muted" : s < 300 ? "http-ok" : s < 400 ? "http-warn" : "http-bad";
const durCls = (d) =>
  d == null ? "" : d < 150 ? "fast" : d < 500 ? "med" : "slow";

function Badge({ c, children }) {
  return <span className={`badge badge-${c}`}>{children}</span>;
}

function HookCard({ h }) {
  const fc =
    h.mismatch || h.dup
      ? "flag-mismatch"
      : h.status === "stalled" || h.status === "error"
        ? "flag-error"
        : "ok";
  return (
    <div className={`hook-card ${fc}`}>
      <div className="hc-row1">
        <span className="hc-name">{h.hookName}</span>
        <Badge c={h.type}>{h.type}</Badge>
        <Badge c={h.status}>
          <span
            className="dot"
            style={{
              background:
                h.status === "fresh"
                  ? "var(--green)"
                  : h.status === "fetching"
                    ? "var(--accent)"
                    : h.status === "stalled"
                      ? "var(--orange)"
                      : h.status === "error"
                        ? "var(--red)"
                        : "var(--yellow)",
              animation: ["fetching", "stalled"].includes(h.status)
                ? "pulse 1.2s infinite"
                : "none",
            }}
          />
          {h.status}
        </Badge>
        {h.http && <Badge c={httpCls(h.http)}>{h.http}</Badge>}
        {h.dur != null && (
          <span
            className={`dur-${durCls(h.dur)}`}
            style={{ marginLeft: "auto", fontSize: 12 }}
          >
            {h.dur}ms
          </span>
        )}
        {h.status === "stalled" && (
          <span
            style={{ color: "var(--orange)", fontSize: 12, marginLeft: "auto" }}
          >
            stalled &gt;5s
          </span>
        )}
      </div>
      {h.desc && <div className="hc-desc">{h.desc}</div>}
      <div className="hc-meta">
        <span className="hc-key">{h.key}</span>
        {h.mismatch && <Badge c="mismatch">⊛ param mismatch</Badge>}
        {h.dup && <Badge c="dup">⧉ duplicate</Badge>}
        {h.badReq > 0 && <Badge c="error">4xx ×{h.badReq}</Badge>}
        {h.slow > 0 && <Badge c="stale">⚡ slow ×{h.slow}</Badge>}
        {h.interval && <Badge c="polling">⟳ {h.interval / 1000}s poll</Badge>}
      </div>
    </div>
  );
}

export default function HooksLens() {
  const [dark, setDark] = useState(true);
  const [nav, setNav] = useState("page");
  const [page, setPage] = useState("/products/[productId]");
  const [tl, setTl] = useState(INIT_TL);
  const [rf, setRf] = useState("all");
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);
  const [dimP, setDimP] = useState(false);
  const [dimD, setDimD] = useState(false);
  const pr = useRef(false);
  pr.current = paused;
  const nid = useRef(600);

  // Live simulation
  useEffect(() => {
    const pg = PAGES[page];
    const all = [...pg.swr, ...pg.custom, ...pg.effect];
    const iv = setInterval(() => {
      if (pr.current) return;
      if (Math.random() < 0.4) {
        const h = all[Math.floor(Math.random() * all.length)];
        const types = ["success", "external-success", "dedup", "fetch"];
        const t = types[Math.floor(Math.random() * types.length)];
        setTl((prev) =>
          [
            {
              id: nid.current++,
              time: tn(),
              type: t,
              route: page,
              hook: h.hookName,
              key: h.key,
              dur: t.includes("success")
                ? `${Math.floor(Math.random() * 180 + 40)}ms`
                : null,
              http: t.includes("success") ? 200 : null,
              flag: "",
            },
            ...prev,
          ].slice(0, 80),
        );
      }
    }, 2200);
    return () => clearInterval(iv);
  }, [page]);

  const pages = Object.keys(PAGES);
  const pg = PAGES[page];
  const allOnPage = [...pg.swr, ...pg.custom, ...pg.effect];
  const allHooks = pages.flatMap((p) =>
    [...PAGES[p].swr, ...PAGES[p].custom, ...PAGES[p].effect].map((h) => ({
      ...h,
      route: p,
    })),
  );
  const filtered = allHooks.filter(
    (h) =>
      (rf === "all" || h.route === rf) &&
      (h.hookName.toLowerCase().includes(search.toLowerCase()) ||
        h.key.toLowerCase().includes(search.toLowerCase())),
  );
  const fCoverage =
    rf === "all" ? COVERAGE : COVERAGE.filter((c) => c.route === rf);
  const fMismatches =
    rf === "all" ? MISMATCHES : MISMATCHES.filter((m) => m.route === rf);
  const fWf = rf === "all" ? WF : WF.filter((w) => w.route === rf);
  const fPollingHooks = allHooks.filter(
    (h) => h.interval && (rf === "all" || h.route === rf),
  );

  const paramCt = MISMATCHES.length;
  const dupCt = allOnPage.filter((h) => h.dup).length;
  const stallCt = allHooks.filter((h) => h.status === "stalled").length;
  const badReqCt = allHooks.filter((h) => h.badReq > 0).length;
  const pollingCt = allHooks.filter((h) => h.interval).length;
  const fTl = rf === "all" ? tl : tl.filter((e) => e.route === rf);
  const wfMax = Math.max(...fWf.map((w) => w.start + (w.dur || 1200)), 1500);

  const themeVars = dark ? DARK : LIGHT;

  return (
    <>
      <style>{`${BASE_CSS} :root{${themeVars}}`}</style>
      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="logo">
              <div className="logo-icon">🔍</div>
              hookslens
              <span className="logo-ver">DEMO</span>
            </div>
            <span className="logo-path">/hookslens</span>
          </div>
          <div className="topbar-right">
            <button className="theme-btn" onClick={() => setDark((d) => !d)}>
              {dark ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>
            <span className={`pill pill-green`}>
              <span
                className="dot pulse"
                style={{ background: "var(--green)" }}
              />
              connected
            </span>
            {paramCt > 0 && (
              <span className="pill pill-purple">⊛ {paramCt} mismatch</span>
            )}
            {dupCt > 0 && (
              <span className="pill pill-orange">⧉ {dupCt} duplicate</span>
            )}
            {stallCt > 0 && (
              <span className="pill pill-red">
                <span
                  className="dot pulse"
                  style={{ background: "var(--red)" }}
                />
                {stallCt} stalled
              </span>
            )}
            {badReqCt > 0 && (
              <span className="pill pill-red">4xx on {badReqCt}</span>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-val c-blue">{allHooks.length}</div>
              <div className="stat-label">hooks</div>
            </div>
            <div className="stat-box">
              <div className="stat-val c-purple">{paramCt}</div>
              <div className="stat-label">mismatches</div>
            </div>
            <div className="stat-box">
              <div className="stat-val c-orange">
                {allHooks.filter((h) => h.dup).length}
              </div>
              <div className="stat-label">duplicates</div>
            </div>
            <div className="stat-box">
              <div className="stat-val c-red">{badReqCt}</div>
              <div className="stat-label">4xx hooks</div>
            </div>
            <div className="stat-box">
              <div className="stat-val c-orange">{stallCt}</div>
              <div className="stat-label">stalled</div>
            </div>
            <div className="stat-box">
              <div className="stat-val c-yellow">{pollingCt}</div>
              <div className="stat-label">polling</div>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Views</div>
            {NAV.map((n) => (
              <div
                key={n.id}
                className={`nav-item ${nav === n.id ? "active" : ""}`}
                onClick={() => setNav(n.id)}
              >
                <span style={{ fontSize: 13 }}>{n.icon}</span>
                <span>{n.label}</span>
                {n.badge && (
                  <span className={`nav-badge ${n.bc}`}>{n.badge}</span>
                )}
              </div>
            ))}
          </div>

          <div className="nav-section" style={{ flex: 1, overflowY: "auto" }}>
            <div className="nav-section-label">Pages</div>
            {pages.map((r) => {
              const phooks = PAGES[r];
              const total =
                phooks.swr.length + phooks.custom.length + phooks.effect.length;
              const cov = COVERAGE.find((c) => c.route === r);
              const isCurrent = r === page;
              return (
                <div
                  key={r}
                  className={`route-nav-item ${isCurrent ? "active" : ""}`}
                  onClick={() => {
                    setPage(r);
                    setNav("page");
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r}
                  </span>
                  {isCurrent && <span className="current-badge">now</span>}
                  {cov && (
                    <span
                      className="cov-pct-label"
                      style={{
                        color:
                          cov.pct >= 75
                            ? "var(--green)"
                            : cov.pct >= 50
                              ? "var(--yellow)"
                              : "var(--red)",
                      }}
                    >
                      {cov.pct}%
                    </span>
                  )}
                  <span className="nav-badge">{total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* Alert strips */}
          {paramCt > 0 && !dimP && (
            <div className="alert-strip purple">
              <strong>⊛ Param mismatch</strong> — <code>/api/reviews</code> uses{" "}
              <code>productId</code> in SWR but <code>product</code> in
              useEffect. API returns 400 on the SWR call.
              <span className="alert-dismiss" onClick={() => setDimP(true)}>
                ×
              </span>
            </div>
          )}
          {dupCt > 0 && !dimD && (
            <div className="alert-strip orange">
              <strong>⧉ Duplicate</strong> — <code>/api/reviews</code> fired by
              both SWR and useEffect on <code>{page}</code>. Remove one.
              <span className="alert-dismiss" onClick={() => setDimD(true)}>
                ×
              </span>
            </div>
          )}
          {stallCt > 0 && (
            <div className="alert-strip red">
              <strong>⚠ Stalled</strong> — <code>useCart</code> in-flight &gt;5s
              on <code>/cart</code>. Heavy render or blocked upstream promise.
            </div>
          )}

          {/* Header */}
          <div className="main-header">
            <div>
              <div className="main-title">
                {nav === "page" && (
                  <>
                    <span>⊡</span>
                    {page}
                  </>
                )}
                {nav === "registry" && (
                  <>
                    <span>◈</span>All Hooks Registry
                  </>
                )}
                {nav === "params" && (
                  <>
                    <span style={{ color: "var(--purple)" }}>⊛</span>Param
                    Inspector
                  </>
                )}
                {nav === "coverage" && (
                  <>
                    <span>◉</span>Fetch Coverage Audit
                  </>
                )}
                {nav === "waterfall" && (
                  <>
                    <span>≋</span>Concurrency Waterfall
                  </>
                )}
                {nav === "polling" && (
                  <>
                    <span style={{ color: "var(--yellow)" }}>⟳</span>Polling
                    Monitor
                  </>
                )}
              </div>
              <div className="main-subtitle">
                {nav === "page" &&
                  `${allOnPage.length} hooks · ${pg.swr.length} SWR · ${pg.custom.length} custom · ${pg.effect.length} useEffect`}
                {nav === "registry" &&
                  `${allHooks.length} hooks across ${pages.length} pages`}
                {nav === "params" &&
                  `${paramCt} endpoint${paramCt === 1 ? "" : "s"} with inconsistent param key shapes`}
                {nav === "coverage" && `SWR adoption rate per page`}
                {nav === "waterfall" &&
                  `SWR and useEffect fetch cycles overlaid`}
                {nav === "polling" && `${pollingCt} hooks with refreshInterval`}
              </div>
            </div>
            <div className="toolbar">
              <div className="toolbar-row">
                <input
                  className="search-input"
                  placeholder="filter by hook or key…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn" onClick={() => setPaused((p) => !p)}>
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button className="btn" onClick={() => setTl([])}>
                  Clear log
                </button>
              </div>
              {nav !== "page" && (
                <div className="route-filter">
                  <span className="route-filter-label">page:</span>
                  <span
                    className={`route-chip ${rf === "all" ? "active" : ""}`}
                    onClick={() => setRf("all")}
                  >
                    all
                  </span>
                  {pages.map((r) => (
                    <span
                      key={r}
                      className={`route-chip ${rf === r ? "active" : ""}`}
                      onClick={() => setRf(r)}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PAGE VIEW ── */}
          {nav === "page" && (
            <div className="content">
              {pg.swr.length > 0 && (
                <div className="hooks-section">
                  <div className="hooks-section-title">
                    <Badge c="swr">SWR</Badge>SWR Hooks · {pg.swr.length}
                  </div>
                  {pg.swr.map((h) => (
                    <HookCard key={h.id} h={h} />
                  ))}
                </div>
              )}
              {pg.custom.length > 0 && (
                <div className="hooks-section">
                  <div className="hooks-section-title">
                    <Badge c="custom">custom</Badge>Custom Hooks ·{" "}
                    {pg.custom.length}
                  </div>
                  {pg.custom.map((h) => (
                    <HookCard key={h.id} h={h} />
                  ))}
                </div>
              )}
              {pg.effect.length > 0 && (
                <div className="hooks-section">
                  <div className="hooks-section-title">
                    <Badge c="effect">useEffect</Badge>
                    Legacy Fetches · {pg.effect.length}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--orange)",
                        fontFamily: "Inter,sans-serif",
                      }}
                    >
                      migration candidates
                    </span>
                  </div>
                  {pg.effect.map((h) => (
                    <HookCard key={h.id} h={h} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REGISTRY ── */}
          {nav === "registry" && (
            <div className="content">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "18%" }}>Hook Name</th>
                      <th style={{ width: "28%" }}>Fetch Key</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>HTTP</th>
                      <th>4xx</th>
                      <th>⊛</th>
                      <th>⧉</th>
                      <th>Dur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h) => (
                      <tr
                        key={h.id}
                        className={`trow ${h.mismatch ? "flagged" : ""}`}
                      >
                        <td>
                          <span className="mono" style={{ fontWeight: 700 }}>
                            {h.hookName}
                          </span>
                        </td>
                        <td>
                          <span className="mono">{h.key}</span>
                        </td>
                        <td>
                          <Badge c={h.type}>{h.type}</Badge>
                        </td>
                        <td>
                          <Badge c={h.status}>{h.status}</Badge>
                        </td>
                        <td>
                          {h.http ? (
                            <Badge c={httpCls(h.http)}>{h.http}</Badge>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {h.badReq > 0 ? (
                            <Badge c="error">×{h.badReq}</Badge>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {h.mismatch ? (
                            <Badge c="mismatch">⊛</Badge>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {h.dup ? (
                            <Badge c="dup">⧉</Badge>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {h.dur != null ? (
                            <span className={`dur-${durCls(h.dur)}`}>
                              {h.dur}ms
                            </span>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PARAMS ── */}
          {nav === "params" && (
            <div className="content">
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text3)",
                  marginBottom: 14,
                  lineHeight: 1.6,
                  maxWidth: 640,
                }}
              >
                Endpoints called with inconsistent param key names. This causes
                silent 400s when the API expects one param name but receives
                another — a common bug during SWR migration when the old
                useEffect and new SWR hook use different param names.
              </p>
              {fMismatches.length === 0 ? (
                <div className="empty-panel">
                  No param mismatches for this page
                </div>
              ) : (
                fMismatches.map((m, i) => (
                  <div key={i} className="pi-card">
                    <div className="pi-header">
                      <span
                        className="mono"
                        style={{ fontWeight: 700, fontSize: 12 }}
                      >
                        {m.endpoint}
                      </span>
                      <Badge c="mismatch">⊛ {m.count} mismatched calls</Badge>
                    </div>
                    <div className="pi-body">
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text3)",
                          marginBottom: 8,
                        }}
                      >
                        Param key shapes seen on this endpoint:
                      </div>
                      <div className="pi-shapes">
                        {m.sets.map((s, j) => (
                          <div
                            key={j}
                            className={`pi-shape shape-${j === 0 ? "a" : "b"}`}
                          >
                            <div className="pi-shape-label">
                              Shape {j + 1} ·{" "}
                              {j === 0 ? "SWR hook" : "useEffect"}
                            </div>
                            <div className="pi-shape-keys">
                              {s.map((k, ki) => (
                                <span
                                  key={ki}
                                  className="pi-key"
                                  style={{ marginRight: 6 }}
                                >
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text3)",
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        Example URLs:
                      </div>
                      {m.examples.map((u, j) => (
                        <div
                          key={j}
                          className={`pi-example ex-${j === 0 ? "a" : "b"}`}
                        >
                          {u}
                        </div>
                      ))}
                      <div className="pi-fix">
                        <strong style={{ color: "var(--purple)" }}>Fix:</strong>{" "}
                        Search codebase for both{" "}
                        <code className="mono">{m.sets[0]?.join(", ")}</code>{" "}
                        and{" "}
                        <code className="mono">{m.sets[1]?.join(", ")}</code> —
                        standardise to whichever the API route handler expects
                        and update all call sites.
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── COVERAGE ── */}
          {nav === "coverage" && (
            <div className="content" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "9px 20px",
                  background: "var(--surface2)",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text2)",
                }}
              >
                SWR coverage = % of HTTP fetches going through SWR per page. Low
                coverage means inconsistent patterns, likely duplicate calls,
                and harder debugging.
              </div>
              <div className="cov-grid">
                <div className="cov-card">
                  <div className="cov-card-header">
                    <div className="cov-card-title">SWR Coverage by Page</div>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      % via SWR
                    </span>
                  </div>
                  {fCoverage.map((c, i) => (
                    <div key={i} className="cov-row">
                      <div className="cov-key">{c.route}</div>
                      <div className="cov-bar-track">
                        <div
                          className="cov-bar"
                          style={{
                            width: `${c.pct}%`,
                            background:
                              c.pct >= 75
                                ? "var(--green)"
                                : c.pct >= 50
                                  ? "var(--yellow)"
                                  : "var(--red)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          width: 32,
                          textAlign: "right",
                          fontSize: 12,
                          color:
                            c.pct >= 75
                              ? "var(--green)"
                              : c.pct >= 50
                                ? "var(--yellow)"
                                : "var(--red)",
                          fontFamily: "JetBrains Mono,monospace",
                        }}
                      >
                        {c.pct}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cov-card">
                  <div className="cov-card-header">
                    <div className="cov-card-title">⧉ Duplicate Fetches</div>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      same URL — SWR + useEffect
                    </span>
                  </div>
                  {fCoverage.filter((c) => c.dups.length > 0).length === 0 ? (
                    <div className="cov-empty">None found ✓</div>
                  ) : (
                    fCoverage
                      .filter((c) => c.dups.length > 0)
                      .map((c, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "5px 12px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              marginBottom: 2,
                              fontFamily: "JetBrains Mono,monospace",
                              color: "var(--text2)",
                            }}
                          >
                            {c.route}
                          </div>
                          {c.dups.map((d, j) => (
                            <div
                              key={j}
                              className="cov-row"
                              style={{ padding: "2px 0" }}
                            >
                              <Badge c="dup">⧉</Badge>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--text3)",
                                  marginLeft: 4,
                                  fontFamily: "JetBrains Mono,monospace",
                                }}
                              >
                                {d}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))
                  )}
                </div>
                <div className="cov-card">
                  <div className="cov-card-header">
                    <div className="cov-card-title">⊛ Inconsistent Params</div>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      same endpoint, diff keys
                    </span>
                  </div>
                  {fCoverage.filter((c) => c.inconsistent.length > 0).length ===
                  0 ? (
                    <div className="cov-empty">None found ✓</div>
                  ) : (
                    fCoverage
                      .filter((c) => c.inconsistent.length > 0)
                      .map((c, i) => (
                        <div key={i} className="cov-row">
                          <div className="cov-key">{c.route}</div>
                          {c.inconsistent.map((u, j) => (
                            <Badge key={j} c="mismatch">
                              {u}
                            </Badge>
                          ))}
                        </div>
                      ))
                  )}
                </div>
                <div className="cov-card">
                  <div className="cov-card-header">
                    <div className="cov-card-title">Unmigrated Pages</div>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      0% SWR, all useEffect
                    </span>
                  </div>
                  {fCoverage.filter((c) => c.swr === 0).length === 0 ? (
                    <div className="cov-empty">All pages use SWR ✓</div>
                  ) : (
                    fCoverage
                      .filter((c) => c.swr === 0)
                      .map((c, i) => (
                        <div key={i} className="cov-row">
                          <div className="cov-key">{c.route}</div>
                          <span
                            style={{ fontSize: 11, color: "var(--orange)" }}
                          >
                            {c.effect} raw fetches
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── WATERFALL ── */}
          {nav === "waterfall" && (
            <div
              className="content"
              style={{ padding: 0, display: "flex", flexDirection: "column" }}
            >
              <div className="wf-header">
                Fetch timeline — SWR and useEffect overlaid · bar width =
                relative duration
                <div className="wf-legend">
                  {[
                    ["swr", "var(--accent)"],
                    ["effect", "var(--orange)"],
                  ].map(([l, c]) => (
                    <div key={l} className="wf-legend-item">
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          background: `${c}22`,
                          borderRadius: 2,
                          border: `1px solid ${c}`,
                        }}
                      />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {fWf.length === 0 ? (
                  <div className="cov-empty" style={{ margin: 12 }}>
                    No waterfall entries for this page
                  </div>
                ) : (
                  fWf.map((w) => {
                    const lp = (w.start / wfMax) * 100;
                    const wp = w.dur ? Math.max((w.dur / wfMax) * 100, 1.5) : 8;
                    return (
                      <div key={w.id} className="wf-row">
                        <div className="wf-key" title={w.key}>
                          {w.key}
                        </div>
                        <div className="wf-origin">
                          <Badge c={w.origin}>{w.origin}</Badge>
                        </div>
                        <div className="wf-route">{w.route}</div>
                        <div className="wf-track">
                          <div
                            className={`wf-bar ${w.status}`}
                            style={{ left: `${lp}%`, width: `${wp}%` }}
                          >
                            {w.dur ? `${w.dur}ms` : "…"}
                          </div>
                        </div>
                        <div className="wf-dur">
                          {w.http ? (
                            <Badge c={httpCls(w.http)}>{w.http}</Badge>
                          ) : (
                            "—"
                          )}
                        </div>
                        <div className="wf-conc">
                          {w.conc.length > 0 && (
                            <span className="conc-badge">+{w.conc.length}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── POLLING ── */}
          {nav === "polling" && (
            <div className="content">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hook Name</th>
                      <th>Fetch Key</th>
                      <th>Interval</th>
                      <th>Slow ×</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fPollingHooks.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-panel">
                            No polling hooks for this page
                          </div>
                        </td>
                      </tr>
                    ) : (
                      fPollingHooks.map((h) => (
                        <tr key={h.id} className="trow">
                          <td>
                            <span className="mono" style={{ fontWeight: 700 }}>
                              {h.hookName}
                            </span>
                          </td>
                          <td>
                            <span className="mono">{h.key}</span>
                          </td>
                          <td>
                            <Badge c="polling">
                              ⟳ every {h.interval / 1000}s
                            </Badge>
                          </td>
                          <td>
                            {h.slow > 0 ? (
                              <Badge c="stale">⚡ ×{h.slow}</Badge>
                            ) : (
                              <span
                                style={{ color: "var(--green)", fontSize: 12 }}
                              >
                                ✓ none
                              </span>
                            )}
                          </td>
                          <td>
                            <Badge c={h.status}>{h.status}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TIMELINE — always at bottom */}
          <div className="timeline-panel">
            <div className="timeline-header">
              <div className="timeline-title">
                Live Timeline
                {allHooks.some((h) => h.status === "stalled") && (
                  <span
                    style={{
                      color: "var(--orange)",
                      fontSize: 11,
                      animation: "pulse 1s infinite",
                    }}
                  >
                    ⚠ stalled
                  </span>
                )}
              </div>
              <span className="timeline-hint">
                purple = param mismatch · orange = duplicate · red = error/stall
                · hook name shown
              </span>
            </div>
            <div className="timeline-scroll">
              {fTl.map((e) => (
                <div
                  key={e.id}
                  className={`tl-row ${e.flag === "p" ? "flag-p" : e.flag === "d" ? "flag-d" : e.flag === "e" ? "flag-e" : ""}`}
                >
                  <span className="tl-flag">
                    {e.flag === "p"
                      ? "⊛"
                      : e.flag === "d"
                        ? "⧉"
                        : e.flag === "e"
                          ? "⚠"
                          : ""}
                  </span>
                  <span className="tl-time">{e.time}</span>
                  <span className={`tl-type ${e.type}`}>{e.type}</span>
                  <span className="tl-route">{e.route}</span>
                  <span className="tl-hook">{e.hook}</span>
                  <span className="tl-key">{e.key}</span>
                  {e.http && <Badge c={httpCls(e.http)}>{e.http}</Badge>}
                  <span className="tl-dur">{e.dur || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
