/* eslint react/no-unescaped-entities: 0 */
import { useState, useCallback, useRef, useEffect } from 'react';

import Heading from '../../components/heading';
import Nav from '../../components/nav';
import Recognition from '../../components/recognition';
import Competitions from '../../components/competitions';
import Citations from '../../components/citations';
import Orders from '../../components/orders';
import Closing from '../../components/closing';
import Footer from '../../components/footer';
import EditableText from '../../components/editableText';
import EditableActivity from '../../components/editableActivity';
import ReportToolbar from '../../components/reportToolbar';
import ReportSidebar from '../../components/reportSidebar';
import styles from '../../components/styles';
import config from '../../config';
import { ConfigContext, processConfig } from '../../src/configContext';
import formatActivitySummary from '../../src/formatActivitySummary';
import mergeSquadronData from '../../src/mergeSquadronData';
import fleet from '../../src/fleet.json';
import Link from '../../components/link';

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_TITLE = 'Tempestuous Transmission #0';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const _today = new Date();
const _yesterday = new Date(_today); _yesterday.setDate(_today.getDate() - 1);
const _eightDaysAgo = new Date(_today); _eightDaysAgo.setDate(_today.getDate() - 8);

const DEFAULT_START_DATE = isoDate(_eightDaysAgo);
const DEFAULT_END_DATE = isoDate(_yesterday);
const DEFAULT_SUBMISSION_DATE = isoDate(_today);

const DEFAULT_CITATIONS = [];
const DEFAULT_CITATIONS_CHANGE = '+0';
const DEFAULT_ORDERS = [
  { name: 'TIE-TC 1', id: 1, title: 'Capture of Zaarin' },
];
const DEFAULT_COMPETITIONS = [];
const DEFAULT_INTRO_HTML = '<p>Write your intro here.</p>';
const DEFAULT_CLOSING_HTML = '<p>Fly, report, compete, and keep the storm moving.</p>';
const DEFAULT_ORDERS_NOTE_HTML = "<p>Top priority are the TCiB battles; besides those, these are some of the missions we're close to earning citations on.</p>";

// ---------------------------------------------------------------------------
// Layout styles (editor chrome, not copied into report HTML)
// ---------------------------------------------------------------------------

const editorWrapStyle = {
  position: 'relative',
  left: '50%',
  marginLeft: '-50vw',
  width: '100vw',
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

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_KEY = 'squadronId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readSquadronCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)squadronId=(\d+)/);
  return match ? match[1] : null;
}

function writeSquadronCookie(id) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEY}=${id}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}


export default function ReportEditorV2() {
  const reportContentRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState('Copy HTML');

  // Live config — populated from squadron API on load
  const [liveConfig, setLiveConfig] = useState({
    ...config,
    uniformUrl: 'https://tempest-blown-with-the-wind.vercel.app/uniform.jpg',
  });

  // Squadron ID — saved/restored via cookie; defaults to config fallback
  const [squadronId, setSquadronId] = useState(String(config.squadronId ?? '45'));

  function handleSquadronIdChange(id) {
    setSquadronId(id);
    writeSquadronCookie(id);
  }

  // Report content
  const [title, setTitle] = useState(DEFAULT_TITLE);
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

  // Uniform image URL (filled in manually by the CMDR until the API provides it)
  // Stored in liveConfig.uniformUrl — no separate state needed

  // Pilot data
  const [activityData, setActivityData] = useState([]);
  const [pilotActivity, setPilotActivity] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // -------------------------------------------------------------------------
  // Squadron data — fetch on mount and whenever squadronId changes
  // -------------------------------------------------------------------------

  const applySquadronData = useCallback((apiResponse, fleetEntry) => {
    setLiveConfig((prev) => processConfig(mergeSquadronData(apiResponse, prev, fleetEntry)));
  }, []);

  useEffect(() => {
    if (!squadronId) return;
    const fleetEntry = fleet.squadrons.find((s) => String(s.id) === String(squadronId));
    fetch(`https://api.emperorshammer.org/squadron/${squadronId}`)
      .then((r) => r.json())
      .then((data) => applySquadronData(data, fleetEntry))
      .catch(() => {
        // API failed but we can still apply the fleet color immediately
        if (fleetEntry) {
          setLiveConfig((prev) => processConfig({
            ...prev,
            colorHelmetBase: fleetEntry.uniformData.colorHelmetBase,
          }));
        }
      });
  }, [squadronId, applySquadronData]);

  // On mount: restore saved squadron from cookie, then trigger initial data load
  useEffect(() => {
    const saved = readSquadronCookie();
    const initId = saved ?? String(config.squadronId ?? '45');
    if (saved && saved !== squadronId) {
      setSquadronId(saved);
    }
    loadData(initId); // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Load gonk + squadron data
  // -------------------------------------------------------------------------

  async function loadData(sqnId = squadronId) {
    setLoading(true);
    setLoadError(null);
    try {
      const squadronData = await fetch(
        `https://api.emperorshammer.org/squadron/${sqnId}`,
      ).then((r) => r.json());

      const fleetEntry = fleet.squadrons.find((s) => String(s.id) === String(sqnId));
      applySquadronData(squadronData, fleetEntry);

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

      // Prefill flightActivity from gonk data, preserving any already-typed values
      setPilotActivity((prev) => {
        const next = { ...prev };
        merged.forEach((pilot) => {
          if (!next[pilot.PIN]) {
            next[pilot.PIN] = {
              communication: '',
              flightActivity: formatActivitySummary(pilot.activity),
              notes: '',
            };
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
    <>
      <style>
        {`
[contenteditable="true"] {
  border: dashed 1px rgba(255,255,255,.15);
}
        `}
      </style>
      <div style={editorWrapStyle}>
        <ReportToolbar
          squadronId={squadronId} onSquadronIdChange={handleSquadronIdChange}
          startDate={startDate} onStartDateChange={setStartDate}
          endDate={endDate} onEndDateChange={setEndDate}
          submissionDate={submissionDate} onSubmissionDateChange={setSubmissionDate}
          statusLine={statusLine} onStatusLineChange={setStatusLine}
          loading={loading} loadError={loadError} onLoadData={loadData}
          copyLabel={copyLabel} onCopyHtml={copyHtml}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <ReportSidebar
            uniformUrl={liveConfig.uniformUrl}
            onUniformUrlChange={(u) => setLiveConfig((prev) => ({ ...prev, uniformUrl: u }))}
            accentColor={liveConfig.colorHelmetBase ?? '#2a499c'}
            onAccentColorChange={(c) => setLiveConfig((prev) => ({ ...prev, colorHelmetBase: c }))}
            orders={orders} onOrdersChange={setOrders}
            competitions={competitions} onCompetitionsChange={setCompetitions}
            citations={citations} citationsChange={citationsChange}
            onCitationsChange={setCitations} onCitationsChangeChange={setCitationsChange}
          />

          <ConfigContext.Provider value={liveConfig}>
            <div ref={reportContentRef} style={reportPaneStyle}>
              <Heading
                title={title}
                onTitleChange={setTitle}
                submissionDate={submissionDate || null}
                statusLine={statusLine || null}
              />

              <Nav />

              <section id="transmission" aria-labelledby="transmission-heading" style={styles.sectionBlock}>
                <p id="transmission-heading" style={styles.sectionPrefix}>[COMM] TRANSMISSION // PRIORITY: ROUTINE</p>
                <a
                  href={`https://tc.emperorshammer.org/record.php?pin=${liveConfig.cmdr?.pin}&type=profile`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    style={{ width: '100%', maxWidth: '190px', float: 'right', marginLeft: '1rem' }}
                    src={liveConfig.uniformUrl}
                    alt={`The uniform of ${liveConfig.cmdr?.name}`}
                  />
                </a>
                <EditableText value={introHtml} onChange={setIntroHtml} />
              </section>

              <Orders missions={orders}>
                <EditableText value={ordersNoteHtml} onChange={setOrdersNoteHtml} />
              </Orders>

              <Recognition activityData={activityData} />

              <EditableActivity
                activityData={activityData}
                pilotActivity={pilotActivity}
                onPilotChange={handlePilotChange}
              />

              <Competitions competitions={competitions} />

              <Citations citations={citations} citationsChange={citationsChange} />

              <Footer />
              <Closing>
                <EditableText value={closingHtml} onChange={setClosingHtml} />
              </Closing>
            </div>
          </ConfigContext.Provider>
        </div>
      </div>
    </>
  );
}
