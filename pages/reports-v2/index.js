/* eslint react/no-unescaped-entities: 0, react/jsx-props-no-spreading: 0 */
import { useState, useCallback, useRef } from 'react';
import T from 'prop-types';

import Heading from '../../components/heading';
import ReportDates from '../../components/report-dates';
import Competitions from '../../components/competitions';
import Citations from '../../components/citations';
import Orders from '../../components/orders';
import Closing from '../../components/closing';
import Footer from '../../components/footer';
import Card from '../../components/card';
import EditableText from '../../components/EditableText';
import styles from '../../components/styles';
import config from '../../config';
import { rankImages, ranks } from '../../components/ranks';
import MedalCase from '../../components/medalCase';
import Link from '../../components/link';
import FlightInfo from '../../components/flightInfo';

// ---------------------------------------------------------------------------
// Default state seeded from report 38
// ---------------------------------------------------------------------------

const DEFAULT_REPORT_NUMBER = 39;
const DEFAULT_START_DATE = '2021-05-31';
const DEFAULT_END_DATE = '2021-06-13';
const DEFAULT_SUBMISSION_DATE = '2021-06-13';

const DEFAULT_CITATIONS = [
  'TIE-TC 12',
  'TIE-TC 76',
  'TIE-TC 168',
  'XWA-TC 8',
  'XWA-TC 22',
];

const DEFAULT_CITATIONS_CHANGE = '+0';

const DEFAULT_ORDERS = [
  { name: 'TIE-TC 1', id: 1, title: 'Capture of Zaarin' },
  { name: 'TIE-TC 10', id: 10, title: 'Battle for the Death Star' },
  { name: 'TIE-TC 16', id: 16, title: 'Dacian Downfall' },
  { name: 'TIE-TC 19', id: 19, title: 'The Tethys Honeymoon' },
  { name: 'TIE-TC 30', id: 30, title: 'Save the Emperors Archives' },
  { name: 'TIE-TC 153', id: 390, title: 'Koph Supremacy Project' },
];

const DEFAULT_COMPETITIONS = [
  {
    id: '3269',
    name: 'Tempest Raid Nights',
    ends: '2021-06-15',
    units: 'Tempest Squadron',
    notes: 'Every week on Monday and Tuesday, Tempest will assemble for both PvE/Co-Op and PvP matches on Star Wars Squadrons.',
    highlight: true,
  },
  {
    id: '3278',
    name: 'Tempest King of the Mountain',
    ends: '2021-06-12',
    units: 'Tempest Squadron',
    notes: 'LCM Wreckage is hosting a 1v1 tournament for Tempest pilots',
    highlight: true,
  },
  {
    id: '3266',
    name: 'Trivia Grand Tour: Season Six',
    ends: '2021-07-26',
    units: 'Entire TC',
    notes: '',
    highlight: false,
  },
  {
    id: '3258',
    name: 'TIE Corps in Battle Season Three',
    ends: '2021-06-30',
    units: 'Entire TC',
    notes: 'Complete the monthly battles to win as pilot, squadron, and ship.',
    highlight: false,
  },
];

const DEFAULT_INTRO_HTML = '<p>Write your intro here.</p>';
const DEFAULT_CLOSING_HTML = '<p>In service,<br />' + config.cmdr.title + '</p>';
const DEFAULT_ORDERS_NOTE_HTML = '<p>Top priority are the TCiB battles; besides those, these are some of the missions we\'re close to earning citations on.</p>';

// ---------------------------------------------------------------------------
// Toolbar styles (editor-only chrome, not copied)
// ---------------------------------------------------------------------------

const toolbarStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: '#1a1a2e',
  borderBottom: '2px solid #0095ff',
  padding: '0.75em 1em',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5em',
  alignItems: 'center',
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
  backgroundColor: '#111122',
  border: '1px dashed #555',
  borderRadius: '4px',
  padding: '0.75em 1em',
  marginBottom: '0.5em',
  fontSize: '14px',
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
  const { MEDALS_AWARDED: awardedMedals } = pilot.activity || {};

  function field(key, label) {
    return (
      <div style={{ marginBottom: '0.25em' }}>
        <dt style={styles.dt}>{label}</dt>
        <dd
          style={{ ...styles.dd, outline: 'none', borderLeft: '2px solid #555', paddingLeft: '0.4em' }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onChange(PIN, key, e.currentTarget.textContent)}
        >
          {activity[key] || ''}
        </dd>
      </div>
    );
  }

  return (
    <div>
      {RankImage && <RankImage />}
      <Link
        href={`https://tc.emperorshammer.org/record.php?pin=${PIN}&type=profile`}
        target="_blank"
        rel="noreferrer"
        style={{ position: 'relative', bottom: '7px' }}
      >
        <strong style={styles.h4}>
          {`${ranks[rank] ? ranks[rank].toUpperCase() : rank} ${name}`}
        </strong>
      </Link>

      <dl style={{ marginTop: '0', marginBottom: '1em' }}>
        {field('communication', 'Communication:')}
        {field('flightActivity', 'Flight Activity:')}
        {field('otherActivity', 'Other:')}
        {field('notes', 'Notes:')}
        {awardedMedals && <MedalCase medals={awardedMedals} />}
      </dl>
    </div>
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
    otherActivity: T.string,
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
      <Card>
        <p style={{ ...styles.p, color: '#aaa', fontStyle: 'italic' }}>
          Enter dates above and click "Load Data" to populate pilot activity.
        </p>
      </Card>
    );
  }

  const flightNumbers = activityData.map((a) => (((a.sqnSlot - 1) / 4) >> 0) + 1);

  return (
    <Card>
      {activityData.map((pilot, i) => {
        const flight = flightNumbers[i];
        const prevFlight = i > 0 ? flightNumbers[i - 1] : 0;
        return (
          <div key={pilot.PIN}>
            {flight !== prevFlight && prevFlight > 0 && <Card />}
            {flight !== prevFlight && <FlightInfo flight={flight} />}
            <EditablePilotActivity
              pilot={pilot}
              activity={pilotActivity[pilot.PIN] || {}}
              onChange={onPilotChange}
            />
          </div>
        );
      })}
    </Card>
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
    <div data-editor-only="true" style={sectionFormStyle}>
      <strong style={{ color: '#0095ff' }}>✏ Orders</strong>
      <ul style={{ margin: '0.5em 0', paddingLeft: '1.2em' }}>
        {orders.map((o, i) => (
          <li key={o.id} style={{ marginBottom: '0.25em' }}>
            {o.name} — {o.title}
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.4em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, width: '90px' }} placeholder="Name (e.g. TIE-TC 1)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input style={{ ...inputStyle, width: '60px' }} placeholder="ID" type="number" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <button type="button" onClick={add} style={primaryButton}>+ Add</button>
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
    <div data-editor-only="true" style={sectionFormStyle}>
      <strong style={{ color: '#0095ff' }}>✏ Competitions</strong>
      <ul style={{ margin: '0.5em 0', paddingLeft: '1.2em' }}>
        {competitions.map((c, i) => (
          <li key={c.id} style={{ marginBottom: '0.25em' }}>
            {c.highlight ? '★ ' : ''}{c.name} (until {c.ends}, {c.units})
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.4em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, width: '60px' }} placeholder="ID" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1, minWidth: '140px' }} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input style={{ ...inputStyle, width: '100px' }} placeholder="YYYY-MM-DD" value={draft.ends} onChange={(e) => setDraft({ ...draft, ends: e.target.value })} />
        <input style={{ ...inputStyle, width: '120px' }} placeholder="Units" value={draft.units} onChange={(e) => setDraft({ ...draft, units: e.target.value })} />
        <input style={{ ...inputStyle, flex: 2, minWidth: '160px' }} placeholder="Notes (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <label style={{ color: '#ccc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={draft.highlight} onChange={(e) => setDraft({ ...draft, highlight: e.target.checked })} />
          Highlight
        </label>
        <button type="button" onClick={add} style={primaryButton}>+ Add</button>
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
    <div data-editor-only="true" style={sectionFormStyle}>
      <strong style={{ color: '#0095ff' }}>✏ Citations</strong>
      <ul style={{ margin: '0.5em 0', paddingLeft: '1.2em' }}>
        {citations.map((c, i) => (
          <li key={c} style={{ marginBottom: '0.25em' }}>
            {c}
            {' '}
            <button type="button" onClick={() => remove(i)} style={{ ...buttonStyle, padding: '0 0.4em', backgroundColor: '#550000', color: '#fff', fontSize: '11px' }}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="e.g. TIE-TC 12" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button type="button" onClick={add} style={primaryButton}>+ Add</button>
        <span style={{ color: '#aaa', fontSize: '13px', marginLeft: '1em' }}>Change:</span>
        <input
          style={{ ...inputStyle, width: '60px' }}
          placeholder="+0"
          value={citationsChange}
          onChange={(e) => onChangeChange(e.target.value)}
        />
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
            next[PIN] = { communication: '', flightActivity: '', otherActivity: '', notes: '' };
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
    navigator.clipboard.writeText(node.innerHTML).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy HTML'), 2000);
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Toolbar — excluded from copy */}
      <div data-editor-only="true" style={toolbarStyle}>
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

      {/* Report content — this is what gets copied */}
      <div ref={reportContentRef}>
        <Heading reportNumber={reportNumber} />

        <ReportDates
          startDate={startDate}
          endDate={endDate}
          submissionDate={submissionDate}
        />

        {/* Intro */}
        <Card>
          <h5 style={{ ...styles.h5, marginBottom: '1em' }}>{config.cmdr.intro}</h5>
          <a
            href={`https://tc.emperorshammer.org/record.php?pin=${config.cmdr.pin}&type=profile`}
            target="_blank"
            rel="noreferrer"
          >
            <img
              style={{ width: '100%', maxWidth: '190px', float: 'right' }}
              src="https://tempest-blown-with-the-wind.vercel.app/uniform.jpg"
              alt={`The uniform of ${config.cmdr.name}`}
            />
          </a>
          <EditableText value={introHtml} onChange={setIntroHtml} />
        </Card>

        {/* Orders */}
        <OrdersForm orders={orders} onChange={setOrders} />
        <Orders missions={orders}>
          <EditableText value={ordersNoteHtml} onChange={setOrdersNoteHtml} />
        </Orders>

        {/* Activity */}
        <EditableActivity
          activityData={activityData}
          pilotActivity={pilotActivity}
          onPilotChange={handlePilotChange}
        />

        {/* Competitions */}
        <CompetitionsForm competitions={competitions} onChange={setCompetitions} />
        <Competitions competitions={competitions} />

        {/* Citations */}
        <CitationsForm
          citations={citations}
          citationsChange={citationsChange}
          onCitationsChange={setCitations}
          onChangeChange={setCitationsChange}
        />
        <Citations citations={citations} citationsChange={citationsChange} />

        {/* Closing */}
        <Closing>
          <EditableText value={closingHtml} onChange={setClosingHtml} />
        </Closing>

        <Footer />
      </div>
    </>
  );
}
