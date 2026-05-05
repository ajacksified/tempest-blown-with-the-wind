/* eslint react/no-unescaped-entities: 0, react/jsx-props-no-spreading: 0 */
import { useState, useCallback, useRef } from 'react';
import T from 'prop-types';

import Heading from '../../components/heading';
import Nav from '../../components/Nav';
import Recognition from '../../components/Recognition';
import Competitions from '../../components/competitions';
import Citations from '../../components/citations';
import Orders from '../../components/orders';
import Closing from '../../components/closing';
import Footer from '../../components/footer';
import EditableText from '../../components/EditableText';
import ConfigEditor from '../../components/ConfigEditor';
import styles from '../../components/styles';
import config from '../../config';
import { rankImages, ranks } from '../../components/ranks';
import Link from '../../components/link';
import FlightInfo from '../../components/flightInfo';

// ---------------------------------------------------------------------------
// Default state seeded from report 38
// ---------------------------------------------------------------------------

const DEFAULT_REPORT_NUMBER = 39;

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const _today = new Date();
const _yesterday = new Date(_today); _yesterday.setDate(_today.getDate() - 1);
const _eightDaysAgo = new Date(_today); _eightDaysAgo.setDate(_today.getDate() - 8);

const DEFAULT_START_DATE = isoDate(_eightDaysAgo);
const DEFAULT_END_DATE = isoDate(_yesterday);
const DEFAULT_SUBMISSION_DATE = isoDate(_today);

const DEFAULT_CITATIONS = [
];

const DEFAULT_CITATIONS_CHANGE = '+0';

const DEFAULT_ORDERS = [
  { name: 'TIE-TC 1', id: 1, title: 'Capture of Zaarin' },
];

const DEFAULT_COMPETITIONS = [
];

const DEFAULT_INTRO_HTML = '<p>Write your intro here.</p>';
const DEFAULT_CLOSING_HTML = `<p>Fly, report, compete, and keep the storm moving.</p>`;
const DEFAULT_ORDERS_NOTE_HTML = '<p>Top priority are the TCiB battles; besides those, these are some of the missions we\'re close to earning citations on.</p>';

// ---------------------------------------------------------------------------
// Toolbar styles (editor-only chrome, not copied)
// ---------------------------------------------------------------------------

const toolbarStyle = {
  backgroundColor: '#1a1a2e',
  borderBottom: '2px solid #0095ff',
  padding: '0.75em 1em',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5em',
  alignItems: 'center',
};

// Breaks out of the 860px article constraint to use full viewport width
const editorWrapStyle = {
  position: 'relative',
  left: '50%',
  marginLeft: '-50vw',
  width: '100vw',
};

const sidebarStyle = {
  width: '280px',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
  maxHeight: '100vh',
  overflowY: 'auto',
  backgroundColor: '#0d0d1a',
  borderRight: '1px solid #333',
  padding: '1rem',
  fontSize: '13px',
};

const reportPaneStyle = {
  flex: 1,
  maxWidth: '860px',
  padding: '1rem',
  minWidth: 0,
  fontFamily: 'Monospace',
  backgroundColor: '#000000',
  color: '#ffffff',
};

const inputStyle = {
  backgroundColor: '#0d0d1a',
  color: '#ffffff',
  border: '1px solid #555',
  padding: '0.3em 0.5em',
  fontFamily: 'Monospace',
  fontSize: '14px',
  borderRadius: '3px',
};

const buttonStyle = {
  padding: '0.4em 1em',
  cursor: 'pointer',
  fontFamily: 'Monospace',
  fontSize: '14px',
  borderRadius: '3px',
  border: 'none',
};

const primaryButton = {
  ...buttonStyle,
  backgroundColor: '#0095ff',
  color: '#fff',
};

const successButton = {
  ...buttonStyle,
  backgroundColor: '#00aa55',
  color: '#fff',
};

const sectionFormStyle = {
  marginBottom: '1.25rem',
};

const sidebarSectionHead = {
  display: 'block',
  color: '#0095ff',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const labelStyle = {
  color: '#aaa',
  fontSize: '12px',
  display: 'block',
  marginBottom: '2px',
};

// ---------------------------------------------------------------------------
// Inline editable pilot activity row
// ---------------------------------------------------------------------------

function EditablePilotActivity({ pilot, activity, onChange }) {
  const { PIN, name, rank } = pilot;
  const RankImage = rankImages[rank];

  function field(key, label) {
    return (
      <div style={{ marginBottom: '0.25em' }}>
        <dt style={{ display: 'inline', ...styles.listItemLabel }}>{label}</dt>
        <dd
          style={{ ...styles.dd, outline: 'none', paddingLeft: '0.4em', display: 'inline' }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onChange(PIN, key, e.currentTarget.textContent)}
        >
          {activity[key] || ''}
        </dd>
        <br />
      </div>
    );
  }

  return (
    <article style={styles.pilotCard}>
      <h4 style={styles.h4}>
        {RankImage && <RankImage />}
        <Link
          href={`https://tc.emperorshammer.org/record.php?pin=${PIN}&type=profile`}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'relative', bottom: '7px' }}
        >
          {`${ranks[rank] ? ranks[rank].toUpperCase() : rank} ${name}`}
        </Link>
      </h4>

      <dl style={{ marginTop: '0', marginBottom: '0' }}>
        {field('communication', 'Comms')}
        {field('flightActivity', 'Activity')}
        {field('notes', 'Notes')}
      </dl>
    </article>
  );
}

EditablePilotActivity.propTypes = {
  pilot: T.shape({
    PIN: T.number.isRequired,
    name: T.string.isRequired,
    rank: T.string.isRequired,
    activity: T.object,
  }).isRequired,
  activity: T.shape({
    communication: T.string,
    flightActivity: T.string,
    notes: T.string,
  }).isRequired,
  onChange: T.func.isRequired,
};

// ---------------------------------------------------------------------------
// Editable activity section (replaces <Activity>)
// ---------------------------------------------------------------------------

function EditableActivity({ activityData, pilotActivity, onPilotChange }) {
  if (!activityData.length) {
    return (
      <section id="activity" aria-labelledby="activity-heading" style={styles.sectionBlock}>
        <p id="activity-heading" style={styles.sectionPrefix}>[CMDR] PILOT ACTIVITY LOG</p>
        <p style={{ ...styles.p, color: '#aaa', fontStyle: 'italic' }}>
          Enter dates above and click &quot;Load Data&quot; to populate pilot activity.
        </p>
      </section>
    );
  }

  const flightNumbers = activityData.map((a) => (((a.sqnSlot - 1) / 4) >> 0) + 1);

  return (
    <section id="activity" aria-labelledby="activity-heading" style={styles.sectionBlock}>
      <p id="activity-heading" style={styles.sectionPrefix}>[CMDR] PILOT ACTIVITY LOG</p>
      {activityData.map((pilot, i) => {
        const flight = flightNumbers[i];
        const prevFlight = i > 0 ? flightNumbers[i - 1] : 0;
        return (
          <div key={pilot.PIN}>
            {flight !== prevFlight && (
              <section aria-labelledby={`flight-${flight}-heading`}>
                <FlightInfo flight={flight} />
              </section>
            )}
            <EditablePilotActivity
              pilot={pilot}
              activity={pilotActivity[pilot.PIN] || {}}
              onChange={onPilotChange}
            />
          </div>
        );
      })}
    </section>
  );
}

EditableActivity.propTypes = {
  activityData: T.arrayOf(T.object).isRequired,
  pilotActivity: T.object.isRequired,
  onPilotChange: T.func.isRequired,
};

// ---------------------------------------------------------------------------
// Form: Orders
// ---------------------------------------------------------------------------

function OrdersForm({ orders, onChange }) {
  const [draft, setDraft] = useState({ name: '', id: '', title: '' });

  function remove(idx) {
    onChange(orders.filter((_, i) => i !== idx));
  }

  function add() {
    if (!draft.name || !draft.id || !draft.title) return;
    onChange([...orders, { ...draft, id: Number(draft.id) }]);
    setDraft({ name: '', id: '', title: '' });
  }

  return (
    <div style={sectionFormStyle}>
      <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }}>
        {orders.map((o, i) => (
          <li key={o.id} style={{ marginBottom: '0.25em' }}>
            {o.name} — {o.title}
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.3em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, width: '90px', fontSize: '12px' }} placeholder="TIE-TC 1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input style={{ ...inputStyle, width: '50px', fontSize: '12px' }} placeholder="ID" type="number" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1, minWidth: '120px', fontSize: '12px' }} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <button type="button" onClick={add} style={{ ...primaryButton, fontSize: '12px' }}>+ Add</button>
      </div>
    </div>
  );
}

OrdersForm.propTypes = {
  orders: T.arrayOf(T.shape({ name: T.string, id: T.number, title: T.string })).isRequired,
  onChange: T.func.isRequired,
};

// ---------------------------------------------------------------------------
// Form: Competitions
// ---------------------------------------------------------------------------

function CompetitionsForm({ competitions, onChange }) {
  const [draft, setDraft] = useState({ id: '', name: '', ends: '', units: '', notes: '', highlight: false });

  function remove(idx) {
    onChange(competitions.filter((_, i) => i !== idx));
  }

  function add() {
    if (!draft.id || !draft.name || !draft.ends || !draft.units) return;
    onChange([...competitions, { ...draft }]);
    setDraft({ id: '', name: '', ends: '', units: '', notes: '', highlight: false });
  }

  return (
    <div style={sectionFormStyle}>
      <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }}>
        {competitions.map((c, i) => (
          <li key={c.id} style={{ marginBottom: '0.25em' }}>
            {c.highlight ? '★ ' : ''}{c.name} (until {c.ends})
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.3em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, width: '50px', fontSize: '12px' }} placeholder="ID" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1, minWidth: '120px', fontSize: '12px' }} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input style={{ ...inputStyle, width: '95px', fontSize: '12px' }} placeholder="YYYY-MM-DD" value={draft.ends} onChange={(e) => setDraft({ ...draft, ends: e.target.value })} />
        <input style={{ ...inputStyle, width: '100px', fontSize: '12px' }} placeholder="Units" value={draft.units} onChange={(e) => setDraft({ ...draft, units: e.target.value })} />
        <input style={{ ...inputStyle, flex: 2, minWidth: '120px', fontSize: '12px' }} placeholder="Notes (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <label style={{ color: '#ccc', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={draft.highlight} onChange={(e) => setDraft({ ...draft, highlight: e.target.checked })} />
          ★
        </label>
        <button type="button" onClick={add} style={{ ...primaryButton, fontSize: '12px' }}>+ Add</button>
      </div>
    </div>
  );
}

CompetitionsForm.propTypes = {
  competitions: T.arrayOf(T.object).isRequired,
  onChange: T.func.isRequired,
};

// ---------------------------------------------------------------------------
// Form: Citations
// ---------------------------------------------------------------------------

function CitationsForm({ citations, citationsChange, onCitationsChange, onChangeChange }) {
  const [draft, setDraft] = useState('');

  function remove(idx) {
    onCitationsChange(citations.filter((_, i) => i !== idx));
  }

  function add() {
    if (!draft.trim()) return;
    onCitationsChange([...citations, draft.trim()]);
    setDraft('');
  }

  return (
    <div style={sectionFormStyle}>
      <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }}>
        {citations.map((c, i) => (
          <li key={c} style={{ marginBottom: '0.25em' }}>
            {c}
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.3em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: '120px', fontSize: '12px' }} placeholder="e.g. TIE-TC 12" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button type="button" onClick={add} style={{ ...primaryButton, fontSize: '12px' }}>+ Add</button>
        <label style={{ color: '#aaa', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
          Δ
          <input
            style={{ ...inputStyle, width: '50px', fontSize: '12px' }}
            placeholder="+0"
            value={citationsChange}
            onChange={(e) => onChangeChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

CitationsForm.propTypes = {
  citations: T.arrayOf(T.string).isRequired,
  citationsChange: T.string.isRequired,
  onCitationsChange: T.func.isRequired,
  onChangeChange: T.func.isRequired,
};

// ---------------------------------------------------------------------------
// Main editor page
// ---------------------------------------------------------------------------

export default function ReportEditorV2() {
  const reportContentRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState('Copy HTML');

  // Report metadata
  const [reportNumber, setReportNumber] = useState(DEFAULT_REPORT_NUMBER);
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const [submissionDate, setSubmissionDate] = useState(DEFAULT_SUBMISSION_DATE);
  const [statusLine, setStatusLine] = useState('');

  // Prose sections
  const [introHtml, setIntroHtml] = useState(DEFAULT_INTRO_HTML);
  const [closingHtml, setClosingHtml] = useState(DEFAULT_CLOSING_HTML);
  const [ordersNoteHtml, setOrdersNoteHtml] = useState(DEFAULT_ORDERS_NOTE_HTML);

  // Structured data
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [competitions, setCompetitions] = useState(DEFAULT_COMPETITIONS);
  const [citations, setCitations] = useState(DEFAULT_CITATIONS);
  const [citationsChange, setCitationsChange] = useState(DEFAULT_CITATIONS_CHANGE);

  // Pilot data
  const [activityData, setActivityData] = useState([]);
  const [pilotActivity, setPilotActivity] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // -------------------------------------------------------------------------
  // Load Data
  // -------------------------------------------------------------------------

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const squadronData = await fetch(
        `https://api.emperorshammer.org/squadron/${config.squadronId}`,
      ).then((r) => r.json());

      const pilotData = await Promise.all(
        squadronData.pilots.map(({ PIN: pin }) => fetch(
          `https://gonk.vercel.app/api/activity?pilotId=${pin}&startDate=${startDate}&endDate=${endDate}`,
        ).then((r) => r.json())),
      );

      const merged = pilotData.map((data, i) => ({
        ...squadronData.pilots[i],
        ...data,
      }));

      setActivityData(merged);

      // Pre-populate pilot activity keys, preserving any already-typed values
      setPilotActivity((prev) => {
        const next = { ...prev };
        merged.forEach(({ PIN }) => {
          if (!next[PIN]) {
            next[PIN] = { communication: '', flightActivity: '', notes: '' };
          }
        });
        return next;
      });
    } catch (err) {
      setLoadError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Per-pilot activity field update
  // -------------------------------------------------------------------------

  const handlePilotChange = useCallback((pin, key, value) => {
    setPilotActivity((prev) => ({
      ...prev,
      [pin]: { ...(prev[pin] || {}), [key]: value },
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Copy HTML
  // -------------------------------------------------------------------------

  function copyHtml() {
    const node = reportContentRef.current.cloneNode(true);
    node.querySelectorAll('[data-editor-only]').forEach((el) => el.remove());
    node.querySelectorAll('[contenteditable]').forEach((el) => {
      el.removeAttribute('contenteditable');
    });
    navigator.clipboard.writeText(node.outerHTML).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy HTML'), 2000);
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div style={editorWrapStyle}>
      {/* Sticky toolbar — full width */}
      <div data-editor-only="true" style={{ position: 'sticky', top: 0, zIndex: 100, ...toolbarStyle }}>
        <span style={{ color: '#0095ff', fontWeight: 'bold', marginRight: '0.5em' }}>
          ✏ Report Editor
        </span>

        <label style={labelStyle}>
          #
          <input
            type="number"
            value={reportNumber}
            onChange={(e) => setReportNumber(Number(e.target.value))}
            style={{ ...inputStyle, width: '60px', marginLeft: '4px' }}
          />
        </label>

        <label style={labelStyle}>
          Start
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
        </label>

        <label style={labelStyle}>
          End
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
        </label>

        <label style={labelStyle}>
          Submitted
          <input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
        </label>

        <label style={labelStyle}>
          Status
          <input
            type="text"
            value={statusLine}
            onChange={(e) => setStatusLine(e.target.value)}
            placeholder="optional status note"
            style={{ ...inputStyle, width: '200px', marginLeft: '4px' }}
          />
        </label>

        <button type="button" onClick={loadData} disabled={loading} style={primaryButton}>
          {loading ? 'Loading…' : 'Load Data'}
        </button>

        {loadError && (
          <span style={{ color: '#ff6666', fontSize: '13px' }}>{loadError}</span>
        )}

        <button type="button" onClick={copyHtml} style={{ ...successButton, marginLeft: 'auto' }}>
          {copyLabel}
        </button>
      </div>

      {/* Body: sidebar + report */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Left sidebar — all editor forms, excluded from copy */}
        <div data-editor-only="true" style={sidebarStyle}>
          <ConfigEditor />

          <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

          <span style={sidebarSectionHead}>Orders</span>
          <OrdersForm orders={orders} onChange={setOrders} />

          <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

          <span style={sidebarSectionHead}>Competitions</span>
          <CompetitionsForm competitions={competitions} onChange={setCompetitions} />

          <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

          <span style={sidebarSectionHead}>
            Citations
            <span style={{ fontWeight: 'normal', opacity: 0.7, marginLeft: '0.5em' }}>(Δ count)</span>
          </span>
          <CitationsForm
            citations={citations}
            citationsChange={citationsChange}
            onCitationsChange={setCitations}
            onChangeChange={setCitationsChange}
          />
        </div>

        {/* Report content — this is what gets copied */}
        <div ref={reportContentRef} style={reportPaneStyle} className="crt">
          <style>
            {`
            @keyframes flicker {
              0% {
                opacity: 0.27861;
              }
              5% {
                opacity: 0.34769;
              }
              10% {
                opacity: 0.23604;
              }
              15% {
                opacity: 0.90626;
              }
              20% {
                opacity: 0.18128;
              }
              25% {
                opacity: 0.83891;
              }
              30% {
                opacity: 0.65583;
              }
              35% {
                opacity: 0.67807;
              }
              40% {
                opacity: 0.26559;
              }
              45% {
                opacity: 0.84693;
              }
              50% {
                opacity: 0.96019;
              }
              55% {
                opacity: 0.08594;
              }
              60% {
                opacity: 0.20313;
              }
              65% {
                opacity: 0.71988;
              }
              70% {
                opacity: 0.53455;
              }
              75% {
                opacity: 0.37288;
              }
              80% {
                opacity: 0.71428;
              }
              85% {
                opacity: 0.70419;
              }
              90% {
                opacity: 0.7003;
              }
              95% {
                opacity: 0.36108;
              }
              100% {
                opacity: 0.24387;
              }
            }
            @keyframes textShadow {
              0% {
                text-shadow: 0.4389924193300864px 0 1px rgba(0,30,255,0.5), -0.4389924193300864px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              5% {
                text-shadow: 2.7928974010788217px 0 1px rgba(0,30,255,0.5), -2.7928974010788217px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              10% {
                text-shadow: 0.02956275843481219px 0 1px rgba(0,30,255,0.5), -0.02956275843481219px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              15% {
                text-shadow: 0.40218538552878136px 0 1px rgba(0,30,255,0.5), -0.40218538552878136px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              20% {
                text-shadow: 3.4794037899852017px 0 1px rgba(0,30,255,0.5), -3.4794037899852017px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              25% {
                text-shadow: 1.6125630401149584px 0 1px rgba(0,30,255,0.5), -1.6125630401149584px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              30% {
                text-shadow: 0.7015590085143956px 0 1px rgba(0,30,255,0.5), -0.7015590085143956px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              35% {
                text-shadow: 3.896914047650351px 0 1px rgba(0,30,255,0.5), -3.896914047650351px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              40% {
                text-shadow: 3.870905614848819px 0 1px rgba(0,30,255,0.5), -3.870905614848819px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              45% {
                text-shadow: 2.231056963361899px 0 1px rgba(0,30,255,0.5), -2.231056963361899px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              50% {
                text-shadow: 0.08084290417898504px 0 1px rgba(0,30,255,0.5), -0.08084290417898504px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              55% {
                text-shadow: 2.3758461067427543px 0 1px rgba(0,30,255,0.5), -2.3758461067427543px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              60% {
                text-shadow: 2.202193051050636px 0 1px rgba(0,30,255,0.5), -2.202193051050636px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              65% {
                text-shadow: 2.8638780614874975px 0 1px rgba(0,30,255,0.5), -2.8638780614874975px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              70% {
                text-shadow: 0.48874025155497314px 0 1px rgba(0,30,255,0.5), -0.48874025155497314px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              75% {
                text-shadow: 1.8948491305757957px 0 1px rgba(0,30,255,0.5), -1.8948491305757957px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              80% {
                text-shadow: 0.0833037308038857px 0 1px rgba(0,30,255,0.5), -0.0833037308038857px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              85% {
                text-shadow: 0.09769827255241735px 0 1px rgba(0,30,255,0.5), -0.09769827255241735px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              90% {
                text-shadow: 3.443339761481782px 0 1px rgba(0,30,255,0.5), -3.443339761481782px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              95% {
                text-shadow: 2.1841838852799786px 0 1px rgba(0,30,255,0.5), -2.1841838852799786px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
              100% {
                text-shadow: 2.6208764473832513px 0 1px rgba(0,30,255,0.5), -2.6208764473832513px 0 1px rgba(255,0,80,0.3), 0 0 3px;
              }
            }
            .crt::after {
              content: " ";
              display: block;
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              background: rgba(18, 16, 16, 0.1);
              opacity: 0;
              z-index: 2;
              pointer-events: none;
              animation: flicker 0.15s infinite;
            }
            .crt::before {
              content: " ";
              display: block;
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
              z-index: 2;
              background-size: 100% 2px, 3px 100%;
              pointer-events: none;
            }
            .crt {
              animation: textShadow 1.6s infinite;
            }
            `}
          </style>
          <Heading
            reportNumber={reportNumber}
            submissionDate={submissionDate}
            statusLine={statusLine || null}
          />

          <Nav />

          {/* Intro */}
          <section id="transmission" aria-labelledby="transmission-heading" style={styles.sectionBlock}>
            <p id="transmission-heading" style={styles.sectionPrefix}>[COMM] TRANSMISSION // PRIORITY: ROUTINE</p>
            <a
              href={`https://tc.emperorshammer.org/record.php?pin=${config.cmdr.pin}&type=profile`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                style={{ width: '100%', maxWidth: '190px', float: 'right', marginLeft: '1rem' }}
                src="https://tempest-blown-with-the-wind.vercel.app/uniform.jpg"
                alt={`The uniform of ${config.cmdr.name}`}
              />
            </a>
            <EditableText value={introHtml} onChange={setIntroHtml} />
          </section>

          {/* Orders */}
          <Orders missions={orders}>
            <EditableText value={ordersNoteHtml} onChange={setOrdersNoteHtml} />
          </Orders>

          {/* Recognition — promotions + medals extracted from activityData */}
          <Recognition activityData={activityData} />

          {/* Activity */}
          <EditableActivity
            activityData={activityData}
            pilotActivity={pilotActivity}
            onPilotChange={handlePilotChange}
          />

          {/* Competitions */}
          <Competitions competitions={competitions} />

          {/* Citations */}
          <Citations citations={citations} citationsChange={citationsChange} />

          {/* Resources then closing signal */}
          <Footer />
          <Closing>
            <EditableText value={closingHtml} onChange={setClosingHtml} />
          </Closing>
        </div>
      </div>
    </div>
  );
}
