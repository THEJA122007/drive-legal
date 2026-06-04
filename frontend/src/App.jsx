import { useState, useEffect, useRef, useCallback } from "react";
import './index.css';

const API = "http://localhost:3001/api";

const COUNTRIES = ["Bangladesh", "Bhutan", "India", "Nepal", "Sri Lanka", "Myanmar", "Thailand"];

// ── Country name aliases for robust matching ──────────────────────────────────
// Maps common variations returned by reverse-geocoding APIs → our canonical name
const COUNTRY_ALIASES = {
  "bangladesh":       "Bangladesh",
  "bd":               "Bangladesh",
  "bhutan":           "Bhutan",
  "bt":               "Bhutan",
  "kingdom of bhutan":"Bhutan",
  "india":            "India",
  "in":               "India",
  "republic of india":"India",
  "bharat":           "India",
  "hindustan":        "India",
  "nepal":            "Nepal",
  "np":               "Nepal",
  "federal democratic republic of nepal": "Nepal",
  "sri lanka":        "Sri Lanka",
  "lk":               "Sri Lanka",
  "democratic socialist republic of sri lanka": "Sri Lanka",
  "ceylon":           "Sri Lanka",
  "myanmar":          "Myanmar",
  "mm":               "Myanmar",
  "burma":            "Myanmar",
  "republic of the union of myanmar": "Myanmar",
  "thailand":         "Thailand",
  "th":               "Thailand",
  "kingdom of thailand": "Thailand",
};

function resolveCountry(raw) {
  if (!raw) return "";
  const str = (typeof raw === "object" ? raw.english || raw.name || "" : raw).trim().toLowerCase();
  if (COUNTRY_ALIASES[str]) return COUNTRY_ALIASES[str];
  // Partial match fallback
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    if (str.includes(alias) || alias.includes(str)) return canonical;
  }
  return "";
}

const TABS = [
  { id: "dashboard", label: "Dashboard",    icon: "⊞" },
  { id: "country",   label: "Country Info", icon: "🌏" },
  { id: "violation", label: "Violations",   icon: "⚠️" },
  { id: "compare",   label: "Compare",      icon: "⇄" },
  { id: "checklist", label: "Checklist",    icon: "✓" },
  { id: "chat",      label: "Ask AI",       icon: "💬" },
];

const DASHBOARD_CARDS = [
  { tab: "country",   icon: "🌏", title: "Country Overview",  desc: "Traffic law overview for your current location." },
  { tab: "violation", icon: "⚠️", title: "Violation Lookup",  desc: "Laws, penalties, and how to stay out of trouble." },
  { tab: "compare",   icon: "⇄",  title: "Compare Laws",      desc: "Side-by-side traffic law differences between two countries." },
  { tab: "checklist", icon: "✓",  title: "Travel Checklist",  desc: "Documents and requirements before you drive." },
  { tab: "chat",      icon: "💬", title: "Ask a Question",    desc: "Get answers on anything traffic-law related." },
];

// ── Hardcoded checklists ──────────────────────────────────────────────────────

const CHECKLISTS = {
  Bangladesh: [
    { cat: "Documents", items: ["Valid driving licence (BRTA-issued)", "Vehicle registration certificate", "Up-to-date fitness certificate", "Third-party insurance paper", "Route permit (if applicable)", "Tax token"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Original home country driving licence", "Passport / valid ID", "Vehicle import or rental papers"] },
    { cat: "On the Road", items: ["Reflective triangle / warning sign", "First-aid kit", "Fire extinguisher (commercial vehicles)", "Seat belts fastened — all passengers", "No mobile phone while driving"] },
    { cat: "Know Before You Go", items: ["Drive on the left side of the road", "Speed limit: 50 km/h urban, 80 km/h highway", "Blood alcohol limit: 0.08% (effectively zero for professionals)", "Helmet mandatory for motorcyclists and pillion riders"] },
  ],
  Bhutan: [
    { cat: "Documents", items: ["Valid driving licence", "Vehicle registration certificate", "Insurance certificate", "Road Safety and Transport Authority (RSTA) permit"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Home country licence", "Passport", "Bhutan entry permit / visa"] },
    { cat: "On the Road", items: ["Seat belts for driver and front passenger", "Helmet for motorcyclists", "No phone use while driving", "Reflective vest (recommended)"] },
    { cat: "Know Before You Go", items: ["Drive on the left side", "Mountain roads — horn use at blind corners is customary", "Speed limit: 50 km/h in towns", "Strictly no overtaking near corners or crests"] },
  ],
  India: [
    { cat: "Documents", items: ["Valid driving licence (issued by RTO)", "Vehicle registration certificate (RC book)", "Pollution Under Control (PUC) certificate", "Valid insurance certificate (third-party minimum)", "Road tax receipt (if applicable)"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Original home country driving licence", "Passport and valid visa", "Rental agreement / vehicle papers if renting"] },
    { cat: "On the Road", items: ["Seat belts mandatory — driver and all passengers", "Helmet mandatory for rider and pillion (ISI-marked)", "No mobile phone use while driving", "Reflective warning triangle", "First-aid kit (recommended)", "Fire extinguisher (commercial and passenger vehicles)"] },
    { cat: "Know Before You Go", items: ["Drive on the left side of the road", "Speed limit: 50 km/h in urban areas, 100 km/h on national highways", "BAC (blood alcohol) limit: 0.03% — strictly enforced", "FASTag (electronic toll) mandatory on national highways", "Odd/even vehicle restrictions apply in some cities (e.g. Delhi) on certain days", "Overloading and over-speeding attract heavy challan (fine) under Motor Vehicles Act 2019"] },
  ],
  Nepal: [
    { cat: "Documents", items: ["Valid driving licence (DoTM-issued)", "Bluebook (vehicle ownership)", "Insurance certificate", "Pollution under control (PUC) certificate"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Home country licence", "Passport", "Vehicle entry permit (if bringing own car)"] },
    { cat: "On the Road", items: ["Seat belts mandatory", "Helmet mandatory for rider and pillion", "No mobile phone while driving", "Warning triangle", "First-aid kit (recommended)"] },
    { cat: "Know Before You Go", items: ["Drive on the left side", "Speed limit: 40 km/h urban, 80 km/h highway", "No drinking and driving — BAC limit 0.05%", "Kathmandu valley has vehicle plate-based odd/even restrictions on some days"] },
  ],
  "Sri Lanka": [
    { cat: "Documents", items: ["Valid driving licence (DMT-issued)", "Vehicle revenue licence", "Insurance certificate (third-party minimum)", "Emission test certificate"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Home country licence", "Passport", "Rental / temporary registration papers if applicable"] },
    { cat: "On the Road", items: ["Seat belts mandatory — front seats", "Helmet mandatory for motorcyclists", "No mobile phone while driving", "Fire extinguisher in vehicle (recommended)", "Reflective triangle"] },
    { cat: "Know Before You Go", items: ["Drive on the left side", "Speed limit: 50 km/h urban, 100 km/h expressway", "BAC limit: 0.08%", "Expressway driving requires a separate permit for some vehicle classes"] },
  ],
  Myanmar: [
    { cat: "Documents", items: ["Valid driving licence (Road Transport Administration Dept.)", "Vehicle registration certificate", "Insurance certificate", "Roadworthiness certificate"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP) — verify current acceptance", "Home country licence", "Passport and valid visa", "Note: Foreign driving access is restricted in many areas — confirm before travel"] },
    { cat: "On the Road", items: ["Seat belts mandatory", "Helmet mandatory for motorcyclists", "No phone use while driving", "Headlights required at night and rain"] },
    { cat: "Know Before You Go", items: ["Drive on the right side of the road", "Most vehicles are right-hand drive (historical)", "Speed limit: 50 km/h in towns, 80 km/h on highways", "BAC limit: 0.05%"] },
  ],
  Thailand: [
    { cat: "Documents", items: ["Valid Thai driving licence or International Driving Permit (IDP)", "Vehicle registration booklet (เล่มทะเบียน)", "Compulsory third-party insurance (Por Ror Bor)", "Voluntary motor insurance (recommended)", "Annual vehicle inspection sticker (for older vehicles)"] },
    { cat: "Visitor Requirements", items: ["International Driving Permit (IDP)", "Home country driving licence", "Passport", "Rental agreement (if renting)"] },
    { cat: "On the Road", items: ["Seat belts mandatory — all seats on highways", "Helmet mandatory for motorcyclists and pillion", "No mobile phone while driving", "Warning triangle", "First-aid kit (recommended)"] },
    { cat: "Know Before You Go", items: ["Drive on the left side", "Speed limit: 80 km/h in urban, 120 km/h on motorways", "BAC limit: 0.05%", "Expressway tolls — carry cash or Easy Pass card", "Road tax and insurance must be current"] },
  ],
};

// ── Hardcoded comparison data ─────────────────────────────────────────────────

const COMPARE_DATA = {
  Bangladesh:  { side: "Left",  urban: "50 km/h", highway: "80 km/h",  helmet: "Mandatory", seatbelt: "Front seats",          phone: "Prohibited", bac: "0.08% (zero for professionals)", licence: "BRTA licence / IDP for visitors" },
  Bhutan:      { side: "Left",  urban: "50 km/h", highway: "—",        helmet: "Mandatory", seatbelt: "Front seats",          phone: "Prohibited", bac: "0.08%",                          licence: "RSTA licence / IDP for visitors" },
  India:       { side: "Left",  urban: "50 km/h", highway: "100 km/h", helmet: "Mandatory (ISI-marked)", seatbelt: "All seats", phone: "Prohibited", bac: "0.03%",                        licence: "RTO licence / IDP for visitors" },
  Nepal:       { side: "Left",  urban: "40 km/h", highway: "80 km/h",  helmet: "Mandatory", seatbelt: "All seats",            phone: "Prohibited", bac: "0.05%",                          licence: "DoTM licence / IDP for visitors" },
  "Sri Lanka": { side: "Left",  urban: "50 km/h", highway: "100 km/h", helmet: "Mandatory", seatbelt: "Front seats",          phone: "Prohibited", bac: "0.08%",                          licence: "DMT licence / IDP for visitors" },
  Myanmar:     { side: "Right", urban: "50 km/h", highway: "80 km/h",  helmet: "Mandatory", seatbelt: "All seats",            phone: "Prohibited", bac: "0.05%",                          licence: "RTAD licence / IDP (restricted for foreigners)" },
  Thailand:    { side: "Left",  urban: "80 km/h", highway: "120 km/h", helmet: "Mandatory", seatbelt: "All seats (highways)", phone: "Prohibited", bac: "0.05%",                          licence: "DLT licence / IDP for visitors" },
};

const COMPARE_FIELDS = [
  { key: "side",     label: "Driving Side" },
  { key: "urban",    label: "Urban Speed Limit" },
  { key: "highway",  label: "Highway Speed Limit" },
  { key: "helmet",   label: "Helmet Law" },
  { key: "seatbelt", label: "Seat Belt" },
  { key: "phone",    label: "Mobile Phone" },
  { key: "bac",      label: "BAC Limit (DUI)" },
  { key: "licence",  label: "Licence Required" },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function Spinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "2px solid var(--border)", borderTopColor: "var(--accent)",
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px", borderRadius: 8,
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
      color: "#fca5a5", fontSize: 13,
    }}>
      {msg}
    </div>
  );
}

function ResultBox({ title, content, loading }) {
  if (loading) {
    return (
      <div style={{
        marginTop: 20, padding: "20px", background: "var(--surface2)",
        border: "1px solid var(--border)", borderRadius: 10,
        display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 13,
      }}>
        <Spinner /> Fetching information…
      </div>
    );
  }
  if (!content) return null;
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
    .replace(/^-\s+/gm, "• ");
  return (
    <div style={{
      marginTop: 20, padding: "18px 20px", background: "var(--surface2)",
      border: "1px solid var(--border)", borderRadius: 10, animation: "fadeUp 0.2s ease",
    }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.6px", color: "var(--accent)", marginBottom: 10,
        }}>{title}</div>
      )}
      <div
        style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    </div>
  );
}

// ── Location Badge ────────────────────────────────────────────────────────────

function LocationBadge({ city, state, country, loading, onRefresh }) {
  const label = [city, state, country].filter(Boolean).join(", ");
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 30,
      background: "rgba(240,192,64,0.09)", border: "1px solid rgba(240,192,64,0.25)",
      fontSize: 13, fontWeight: 600, color: "var(--accent)",
      marginBottom: 20, cursor: onRefresh ? "pointer" : "default",
      transition: "background 0.15s",
    }}
      onClick={onRefresh}
      title={onRefresh ? "Refresh location" : undefined}
    >
      <span style={{ fontSize: 15 }}>📍</span>
      {loading ? "Detecting location…" : (label || "Location unknown")}
      {onRefresh && !loading && (
        <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>↺</span>
      )}
    </div>
  );
}

// ── Location Error Banner ─────────────────────────────────────────────────────
// Shown when geolocation succeeded but the country isn't in our supported list.

function LocationMismatchBanner({ rawCountry, onManualPick }) {
  if (!rawCountry) return null;
  return (
    <div style={{
      marginBottom: 16, padding: "12px 16px", borderRadius: 10,
      background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
      fontSize: 13, color: "#fcd34d", lineHeight: 1.6,
    }}>
      <strong>"{rawCountry}"</strong> isn't in our supported country list yet.
      Please pick a country manually:
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {COUNTRIES.map(c => (
          <button
            key={c}
            onClick={() => onManualPick(c)}
            style={{
              padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(251,191,36,0.4)",
              background: "transparent", color: "#fcd34d", fontSize: 12, cursor: "pointer",
            }}
          >{c}</button>
        ))}
      </div>
    </div>
  );
}

// ── Country Panel ─────────────────────────────────────────────────────────────

function CountryPanel({ detectedCountry, detectedCity, detectedState, locationLoading, onRefreshLocation, rawCountry, onManualPick, panelState, setPanelState }) {
  const { result, loading, error } = panelState;
  const fetchedFor = useRef("");
  const set = useCallback((patch) => setPanelState(s => ({ ...s, ...patch })), [setPanelState]);

  useEffect(() => {
    const key = [detectedCity, detectedState, detectedCountry].filter(Boolean).join(",");
    if (detectedCountry && key !== fetchedFor.current && !loading) {
      fetchCountry(detectedCountry, detectedCity, detectedState);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCountry, detectedCity, detectedState]);

  async function fetchCountry(c, city, state) {
    if (!c) return;
    const key = [city, state, c].filter(Boolean).join(",");
    fetchedFor.current = key;
    set({ loading: true, error: "", result: "" });
    try {
      const r = await fetch(`${API}/country`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: c, city: city || "", state: state || "" }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      set({ result: d.info, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      fetchedFor.current = "";
    }
  }

  const locationLabel = [detectedCity, detectedState, detectedCountry].filter(Boolean).join(", ");
  const showMismatch = !detectedCountry && !locationLoading && rawCountry;
  const showNoLocation = !detectedCountry && !locationLoading && !rawCountry;

  return (
    <div className="panel">
      <div className="panel-title">Traffic Overview</div>
      <div className="panel-sub">Live traffic law summary based on your current location.</div>

      <LocationBadge
        city={detectedCity}
        state={detectedState}
        country={detectedCountry}
        loading={locationLoading}
        onRefresh={onRefreshLocation}
      />

      {showMismatch && (
        <LocationMismatchBanner rawCountry={rawCountry} onManualPick={onManualPick} />
      )}

      {showNoLocation && (
        <div style={{
          padding: "18px 20px", borderRadius: 10,
          background: "var(--surface2)", border: "1px solid var(--border)",
          fontSize: 14, color: "var(--muted)", lineHeight: 1.6,
        }}>
          Location access is required to load traffic laws. Please allow location permission and try again.
          <div style={{ marginTop: 12 }}>
            <span style={{ marginRight: 8, fontSize: 13 }}>Or pick manually:</span>
            {COUNTRIES.map(c => (
              <button
                key={c}
                onClick={() => onManualPick(c)}
                style={{
                  marginRight: 6, marginBottom: 6,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--accent)", fontSize: 12, cursor: "pointer",
                }}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      <ErrorMsg msg={error} />
      <ResultBox
        title={locationLabel || undefined}
        content={result}
        loading={loading && !result}
      />
    </div>
  );
}

// ── Violation Panel ───────────────────────────────────────────────────────────

function ViolationPanel({ detectedCountry, detectedCity, detectedState, locationLoading, onRefreshLocation, rawCountry, onManualPick, panelState, setPanelState }) {
  const { violation, result, loading, error } = panelState;
  const set = useCallback((patch) => setPanelState(s => ({ ...s, ...patch })), [setPanelState]);

  const EXAMPLES = [
    "Running a red light",
    "Speeding on highway",
    "No helmet while riding",
    "Using phone while driving",
    "Driving under the influence",
    "Illegal U-turn",
  ];

  async function submit() {
    const v = violation?.trim();
    if (!detectedCountry || !v) return;
    set({ loading: true, error: "", result: "" });
    try {
      const r = await fetch(`${API}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: detectedCountry,
          city: detectedCity || "",
          state: detectedState || "",
          violation: v,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      set({ result: d.details, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  }

  const locationLabel = [detectedCity, detectedState, detectedCountry].filter(Boolean).join(", ");
  const canSubmit = !!detectedCountry && !!violation?.trim() && !loading;
  const showMismatch = !detectedCountry && !locationLoading && rawCountry;
  const showNoLocation = !detectedCountry && !locationLoading && !rawCountry;

  return (
    <div className="panel">
      <div className="panel-title">Violation Lookup</div>
      <div className="panel-sub">Find out the law, fine, and how to avoid any specific violation at your location.</div>

      <LocationBadge
        city={detectedCity}
        state={detectedState}
        country={detectedCountry}
        loading={locationLoading}
        onRefresh={onRefreshLocation}
      />

      {showMismatch && (
        <LocationMismatchBanner rawCountry={rawCountry} onManualPick={onManualPick} />
      )}

      {showNoLocation && (
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: "var(--surface2)", border: "1px solid var(--border)",
          fontSize: 14, color: "var(--muted)", marginBottom: 16,
        }}>
          Location access is needed to look up violations. Please allow location permission.
          <div style={{ marginTop: 10 }}>
            {COUNTRIES.map(c => (
              <button
                key={c}
                onClick={() => onManualPick(c)}
                style={{
                  marginRight: 6, marginBottom: 6,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--accent)", fontSize: 12, cursor: "pointer",
                }}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Describe the Violation</label>
        <textarea
          className="form-textarea"
          placeholder="Describe the violation or pick an example below…"
          value={violation}
          onChange={e => set({ violation: e.target.value })}
          disabled={!detectedCountry}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            className={`btn btn-ghost${violation === ex ? " active-tag" : ""}`}
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => set({ violation: ex })}
            disabled={!detectedCountry}
          >{ex}</button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={!canSubmit}>
        {loading ? <><Spinner size={14} /> Looking up…</> : "Look Up"}
      </button>

      <ErrorMsg msg={error} />
      <ResultBox
        title={locationLabel && violation ? `${violation} — ${locationLabel}` : undefined}
        content={result}
        loading={loading && !result}
      />
    </div>
  );
}

// ── Compare Panel ─────────────────────────────────────────────────────────────

function ComparePanel({ detectedCountry, panelState, setPanelState }) {
  const { c1, c2 } = panelState;
  const set = useCallback((patch) => setPanelState(s => ({ ...s, ...patch })), [setPanelState]);

  const seeded = useRef(false);
  useEffect(() => {
    if (detectedCountry && !seeded.current) {
      set({ c1: detectedCountry });
      seeded.current = true;
    }
  }, [detectedCountry, set]);

  const d1 = c1 ? COMPARE_DATA[c1] : null;
  const d2 = c2 ? COMPARE_DATA[c2] : null;

  return (
    <div className="panel">
      <div className="panel-title">Compare Countries</div>
      <div className="panel-sub">Pick two countries to see how their traffic laws differ. Differences are highlighted.</div>
      <div className="form-row" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Country A</label>
          <select className="form-select" value={c1} onChange={e => set({ c1: e.target.value })}>
            <option value="">Select…</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Country B</label>
          <select className="form-select" value={c2} onChange={e => set({ c2: e.target.value })}>
            <option value="">Select…</option>
            {COUNTRIES.filter(c => c !== c1).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {!c1 || !c2 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Select both countries to see the comparison.</div>
      ) : (
        <div style={{ overflowX: "auto", animation: "fadeUp 0.2s ease" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "9px 12px", color: "var(--muted)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "1px solid var(--border)", width: "28%" }}>Rule</th>
                <th style={{ textAlign: "left", padding: "9px 12px", color: "var(--accent)", fontWeight: 700, fontSize: 13, borderBottom: "1px solid var(--border)" }}>{c1}</th>
                <th style={{ textAlign: "left", padding: "9px 12px", color: "var(--accent)", fontWeight: 700, fontSize: 13, borderBottom: "1px solid var(--border)" }}>{c2}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_FIELDS.map((f, i) => {
                const same = d1[f.key] === d2[f.key];
                return (
                  <tr key={f.key} style={{ background: i % 2 === 0 ? "var(--surface2)" : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: 13 }}>{f.label}</td>
                    <td style={{ padding: "10px 12px", color: same ? "var(--text)" : "var(--accent2)", fontWeight: same ? 400 : 600 }}>{d1[f.key]}</td>
                    <td style={{ padding: "10px 12px", color: same ? "var(--text)" : "var(--accent2)", fontWeight: same ? 400 : 600 }}>{d2[f.key]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            Orange values differ between countries. Always verify with local transport authorities.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Checklist Panel ───────────────────────────────────────────────────────────

function ChecklistPanel({ detectedCountry, panelState, setPanelState }) {
  const { country, checked } = panelState;
  const set = useCallback((patch) => setPanelState(s => ({ ...s, ...patch })), [setPanelState]);

  const seeded = useRef(false);
  useEffect(() => {
    if (detectedCountry && !seeded.current) {
      set({ country: detectedCountry });
      seeded.current = true;
    }
  }, [detectedCountry, set]);

  const data = country ? CHECKLISTS[country] : null;
  const allKeys = data ? data.flatMap((cat, ci) => cat.items.map((_, ii) => `${ci}-${ii}`)) : [];
  const doneCount = allKeys.filter(k => checked[k]).length;

  const toggle = (key) => set({ checked: { ...checked, [key]: !checked[key] } });
  const reset = () => set({ checked: {} });

  return (
    <div className="panel">
      <div className="panel-title">Travel Checklist</div>
      <div className="panel-sub">Everything you need before driving in your destination country.</div>
      <div className="form-group" style={{ marginBottom: data ? 16 : 0 }}>
        <label className="form-label">Destination</label>
        <select
          className="form-select"
          value={country}
          onChange={e => { set({ country: e.target.value, checked: {} }); seeded.current = true; }}
        >
          <option value="">Pick a country…</option>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {data && (
        <div style={{ animation: "fadeUp 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{doneCount} of {allKeys.length} checked</span>
            {doneCount > 0 && (
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={reset}>Reset</button>
            )}
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--surface2)", marginBottom: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${allKeys.length ? (doneCount / allKeys.length) * 100 : 0}%`,
              background: doneCount === allKeys.length ? "var(--success)" : "var(--accent)",
              borderRadius: 2, transition: "width 0.3s, background 0.3s",
            }} />
          </div>

          {doneCount === allKeys.length && allKeys.length > 0 && (
            <div style={{
              marginBottom: 20, padding: "10px 14px", borderRadius: 8,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              color: "#86efac", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            }}>
              ✓ All items checked — you're ready to drive in {country}.
            </div>
          )}

          {data.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 22 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.6px", color: "var(--accent)", marginBottom: 8,
              }}>{cat.cat}</div>
              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`;
                const done = !!checked[key];
                return (
                  <div
                    key={ii}
                    onClick={() => toggle(key)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 12px", marginBottom: 5,
                      background: done ? "rgba(240,192,64,0.06)" : "var(--surface2)",
                      border: `1px solid ${done ? "rgba(240,192,64,0.2)" : "var(--border)"}`,
                      borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      marginTop: 1, width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${done ? "var(--accent)" : "var(--muted)"}`,
                      background: done ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {done && <span style={{ color: "#000", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize: 14, lineHeight: 1.5,
                      color: done ? "var(--muted)" : "var(--text)",
                      textDecoration: done ? "line-through" : "none",
                      transition: "all 0.15s",
                    }}>{item}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ detectedCountry, detectedCity, detectedState, panelState, setPanelState }) {
  const { country, messages, inputValue } = panelState;
  const set = useCallback((patch) => setPanelState(s => ({ ...s, ...patch })), [setPanelState]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (detectedCountry && !seeded.current) {
      set({ country: detectedCountry });
      seeded.current = true;
    }
  }, [detectedCountry, set]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const SUGGESTIONS = [
    "Can tourists drive with an International Driving Permit?",
    "What's the speed limit on highways?",
    "What happens if I'm caught driving drunk?",
    "Do I need special insurance as a foreigner?",
  ];

  async function send(q) {
    const text = (q || inputValue || "").trim();
    if (!country || !text) return;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nextMsgs = [...messages, { role: "user", text, time: ts }];
    set({ messages: nextMsgs, inputValue: "" });
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, question: text }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      const ts2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      set({ messages: [...nextMsgs, { role: "ai", text: d.answer, time: ts2 }] });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
    .replace(/^-\s+/gm, "• ");

  return (
    <div className="panel">
      <div className="panel-title">Ask a Question</div>
      <div className="panel-sub">
        {country
          ? `Asking about traffic laws in ${country}. Switch country to change context.`
          : "Select a country, then ask anything about traffic laws."}
      </div>
      <div className="form-group">
        <label className="form-label">Country</label>
        <select
          className="form-select"
          value={country}
          onChange={e => { set({ country: e.target.value }); seeded.current = true; }}
        >
          <option value="">Pick a country…</option>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {messages.length === 0 && country && !loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "5px 11px" }}
              onClick={() => send(s)}
            >{s}</button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div
                className="msg-bubble"
                dangerouslySetInnerHTML={{ __html: m.role === "ai" ? fmt(m.text) : m.text }}
              />
              <div className="msg-time">{m.role === "ai" ? "Drive Legal" : "You"} · {m.time}</div>
            </div>
          ))}
          {loading && (
            <div className="msg ai">
              <div className="msg-bubble" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Spinner size={14} />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <ErrorMsg msg={error} />

      <div style={{ display: "flex", gap: 10, marginTop: messages.length > 0 ? 12 : 0 }}>
        <input
          className="form-input"
          placeholder={country ? `Ask about traffic laws in ${country}…` : "Select a country first…"}
          value={inputValue}
          onChange={e => set({ inputValue: e.target.value })}
          onKeyDown={onKey}
          disabled={!country || loading}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => send()}
          disabled={!country || !inputValue?.trim() || loading}
        >Send</button>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

const INIT_PANEL_STATE = {
  country:   { result: "", loading: false, error: "" },
  violation: { violation: "", result: "", loading: false, error: "" },
  compare:   { c1: "", c2: "" },
  checklist: { country: "", checked: {} },
  chat:      { country: "", messages: [], inputValue: "" },
};

export default function DriveLegal() {
  const [tab, setTab] = useState("dashboard");

  // ── Location state ──────────────────────────────────────────────────────────
  const [location, setLocation]               = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [detectedCity, setDetectedCity]       = useState("");
  const [detectedState, setDetectedState]     = useState("");
  // rawCountry holds whatever the API returned when it didn't match our list
  const [rawCountry, setRawCountry]           = useState("");

  const [panelStates, setPanelStates] = useState(INIT_PANEL_STATE);

  const makeSetter = useCallback((key) => (patch) =>
    setPanelStates(s => ({
      ...s,
      [key]: typeof patch === "function" ? patch(s[key]) : { ...s[key], ...patch },
    })), []);

  useEffect(() => { detectLocation(); }, []);

  async function detectLocation() {
    if (!navigator.geolocation) {
      console.warn("DriveLegal: Geolocation not supported by this browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`${API}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
          });
          const d = await r.json();
          console.log("DriveLegal: location API response →", d); // debug

          if (d?.country) {
            setLocation(d);

            // ── Normalise city / state ──────────────────────────────────────
            const city  = d.city?.english  || d.city  || "";
            const state = d.state?.english || d.state || d.county?.english || d.county || "";
            setDetectedCity(city);
            setDetectedState(state);

            // ── Robust country resolution ───────────────────────────────────
            // Try all the string forms the API might return
            const candidates = [
              d.country?.english,
              d.country?.name,
              d.country,
              d.countryName,
              d.country_name,
              d.address?.country,
            ].filter(Boolean);

            let matched = "";
            for (const candidate of candidates) {
              matched = resolveCountry(candidate);
              if (matched) break;
            }

            console.log("DriveLegal: candidates →", candidates, "matched →", matched);

            if (matched) {
              setDetectedCountry(matched);
              setRawCountry("");
            } else {
              // Not in our list — store raw string so we can show the mismatch banner
              setRawCountry(candidates[0] || "Unknown");
              setDetectedCountry("");
            }
          } else {
            console.warn("DriveLegal: location API returned no country field.", d);
          }
        } catch (err) {
          console.error("DriveLegal: location API error →", err);
        }
        setLocationLoading(false);
      },
      (err) => {
        console.warn("DriveLegal: geolocation error →", err.code, err.message);
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // Called from mismatch banners and manual pick buttons
  function handleManualPick(country) {
    setDetectedCountry(country);
    setRawCountry("");
  }

  const locationLabel = [
    detectedCity,
    detectedState,
    detectedCountry || rawCountry,
  ].filter(Boolean).join(", ") || (locationLoading ? "Detecting…" : "Location unknown");

  function pickCountry(c) {
    setDetectedCountry(c);
    setRawCountry("");
    setTab("country");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">
          <div className="icon-shield">⚖</div>
          Drive<span style={{ color: "var(--accent)" }}>Legal</span>
        </div>
        <div className="location-pill" onClick={detectLocation} title="Refresh location">
          <div className={`dot ${detectedCountry ? "" : "inactive"}`} />
          {locationLoading ? "Detecting…" : locationLabel}
        </div>
      </header>

      {tab === "dashboard" && (
        <section className="hero">
          <div className="hero-badge">Traffic Law Guide · South &amp; Southeast Asia</div>
          <h1>Know the road<br />before you drive.</h1>
          <p>Traffic laws, violations, and requirements across Bangladesh, Bhutan, India, Nepal, Sri Lanka, Myanmar, and Thailand.</p>
          <div className="hero-countries">
            {COUNTRIES.map(c => (
              <div
                key={c}
                className={`country-tag ${detectedCountry === c ? "active" : ""}`}
                onClick={() => pickCountry(c)}
                title={`View ${c} traffic laws`}
              >{c}</div>
            ))}
          </div>
        </section>
      )}

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === "dashboard" && (
          <>
            {(detectedCountry || rawCountry) && (
              <div style={{
                marginBottom: 20, padding: "12px 16px",
                background: "rgba(240,192,64,0.07)", border: "1px solid rgba(240,192,64,0.2)",
                borderRadius: 9, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>📍</span>
                {detectedCountry ? (
                  <span>
                    You're in <strong style={{ color: "var(--accent)" }}>{locationLabel}</strong> — all tools will default to this.{" "}
                    <span
                      style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => setTab("country")}
                    >View laws →</span>
                  </span>
                ) : (
                  <span>
                    Detected <strong style={{ color: "var(--accent)" }}>{rawCountry}</strong> — not in our list.{" "}
                    <span
                      style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => setTab("country")}
                    >Pick a country →</span>
                  </span>
                )}
              </div>
            )}
            <div className="dashboard-grid">
              {DASHBOARD_CARDS.map(card => (
                <div className="dash-card" key={card.tab} onClick={() => setTab(card.tab)}>
                  <div className="card-icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <div className="card-arrow">›</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* All panels always mounted — display:none preserves state across tab switches */}
        <div style={{ display: tab === "country"   ? "block" : "none" }}>
          <CountryPanel
            detectedCountry={detectedCountry}
            detectedCity={detectedCity}
            detectedState={detectedState}
            locationLoading={locationLoading}
            onRefreshLocation={detectLocation}
            rawCountry={rawCountry}
            onManualPick={handleManualPick}
            panelState={panelStates.country}
            setPanelState={makeSetter("country")}
          />
        </div>
        <div style={{ display: tab === "violation" ? "block" : "none" }}>
          <ViolationPanel
            detectedCountry={detectedCountry}
            detectedCity={detectedCity}
            detectedState={detectedState}
            locationLoading={locationLoading}
            onRefreshLocation={detectLocation}
            rawCountry={rawCountry}
            onManualPick={handleManualPick}
            panelState={panelStates.violation}
            setPanelState={makeSetter("violation")}
          />
        </div>
        <div style={{ display: tab === "compare"   ? "block" : "none" }}>
          <ComparePanel
            detectedCountry={detectedCountry}
            panelState={panelStates.compare}
            setPanelState={makeSetter("compare")}
          />
        </div>
        <div style={{ display: tab === "checklist" ? "block" : "none" }}>
          <ChecklistPanel
            detectedCountry={detectedCountry}
            panelState={panelStates.checklist}
            setPanelState={makeSetter("checklist")}
          />
        </div>
        <div style={{ display: tab === "chat"      ? "block" : "none" }}>
          <ChatPanel
            detectedCountry={detectedCountry}
            detectedCity={detectedCity}
            detectedState={detectedState}
            panelState={panelStates.chat}
            setPanelState={makeSetter("chat")}
          />
        </div>
      </main>

      <footer className="footer">
        Drive Legal · For reference only — verify with local transport authorities · Not legal advice
      </footer>
    </div>
  );
}