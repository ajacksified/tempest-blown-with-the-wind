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
import Link from '../../components/link';

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_REPORT_NUMBER = 0;

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
// Main editor page
// ---------------------------------------------------------------------------

export default function ReportEditorV2() {
  const reportContentRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState('Copy HTML');

  // Live config — updated optimistically as the sidebar ConfigEditor changes
  const [liveConfig, setLiveConfig] = useState(config);
  const handleConfigChange = useCallback((raw) => setLiveConfig(processConfig(raw)), []);

  // Squadron ID — drives the API fetch; defaults from config, editable in toolbar
  const [squadronId, setSquadronId] = useState(String(config.squadronId ?? '45'));

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
  // Squadron data — fetch on mount and whenever squadronId changes
  // -------------------------------------------------------------------------

  const applySquadronData = useCallback((apiResponse) => {
    setLiveConfig((prev) => processConfig(mergeSquadronData(apiResponse, prev)));
  }, []);

  useEffect(() => {
    if (!squadronId) return;
    fetch(`https://api.emperorshammer.org/squadron/${squadronId}`)
      .then((r) => r.json())
      .then(applySquadronData)
      .catch(() => {}); // non-fatal; config.json values remain
  }, [squadronId, applySquadronData]);

  // -------------------------------------------------------------------------
  // Load gonk + squadron data
  // -------------------------------------------------------------------------

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const squadronData = await fetch(
        `https://api.emperorshammer.org/squadron/${squadronId}`,
      ).then((r) => r.json());

      applySquadronData(squadronData);

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
    <div style={editorWrapStyle}>
      <ReportToolbar
        squadronId={squadronId} onSquadronIdChange={setSquadronId}
        reportNumber={reportNumber} onReportNumberChange={setReportNumber}
        startDate={startDate} onStartDateChange={setStartDate}
        endDate={endDate} onEndDateChange={setEndDate}
        submissionDate={submissionDate} onSubmissionDateChange={setSubmissionDate}
        statusLine={statusLine} onStatusLineChange={setStatusLine}
        loading={loading} loadError={loadError} onLoadData={loadData}
        copyLabel={copyLabel} onCopyHtml={copyHtml}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <ReportSidebar
          onConfigChange={handleConfigChange}
          orders={orders} onOrdersChange={setOrders}
          competitions={competitions} onCompetitionsChange={setCompetitions}
          citations={citations} citationsChange={citationsChange}
          onCitationsChange={setCitations} onCitationsChangeChange={setCitationsChange}
        />

        <ConfigContext.Provider value={liveConfig}>
          <div ref={reportContentRef} style={reportPaneStyle}>
            <Heading
              reportNumber={reportNumber}
              submissionDate={submissionDate}
              statusLine={statusLine || null}
            />

            <Nav />

            <section id="transmission" aria-labelledby="transmission-heading" style={styles.sectionBlock}>
              <p id="transmission-heading" style={styles.sectionPrefix}>[COMM] TRANSMISSION // PRIORITY: ROUTINE</p>
              <a
                href={`https://tc.emperorshammer.org/record.php?pin=${liveConfig.cmdr.pin}&type=profile`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  style={{ width: '100%', maxWidth: '190px', float: 'right', marginLeft: '1rem' }}
                  src="https://tempest-blown-with-the-wind.vercel.app/uniform.jpg"
                  alt={`The uniform of ${liveConfig.cmdr.name}`}
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
  );
}
