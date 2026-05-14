import T from 'prop-types';
import fleet from '../src/fleet.json';
import editorStyles from '../src/editorStyles';

const { inputStyle, primaryButton, successButton, labelStyle } = editorStyles;

const toolbarStyle = {
  backgroundColor: '#1a1a2e',
  borderBottom: '2px solid #0095ff',
  padding: '0.75em 1em',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5em',
  alignItems: 'center',
};

export default function ReportToolbar({
  squadronId, onSquadronIdChange,
  reportNumber, onReportNumberChange,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  submissionDate, onSubmissionDateChange,
  statusLine, onStatusLineChange,
  loading, loadError, onLoadData,
  copyLabel, onCopyHtml,
}) {
  return (
    <div data-editor-only="true" style={{ position: 'sticky', top: 0, zIndex: 100, ...toolbarStyle }}>
      <span style={{ color: '#0095ff', fontWeight: 'bold', marginRight: '0.5em' }}>
        ✏ Report Editor
      </span>

      <label style={labelStyle}>
        Sqn
        <select
          value={squadronId}
          onChange={(e) => onSquadronIdChange(e.target.value)}
          style={{ ...inputStyle, marginLeft: '4px' }}
        >
          {fleet.squadrons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        #
        <input
          type="number"
          value={reportNumber}
          onChange={(e) => onReportNumberChange(Number(e.target.value))}
          style={{ ...inputStyle, width: '60px', marginLeft: '4px' }}
        />
      </label>

      <label style={labelStyle}>
        Start
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
      </label>

      <label style={labelStyle}>
        End
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
      </label>

      <label style={labelStyle}>
        Submitted
        <input type="date" value={submissionDate} onChange={(e) => onSubmissionDateChange(e.target.value)} style={{ ...inputStyle, marginLeft: '4px' }} />
      </label>

      <label style={labelStyle}>
        Status
        <input
          type="text"
          value={statusLine}
          onChange={(e) => onStatusLineChange(e.target.value)}
          placeholder="optional status note"
          style={{ ...inputStyle, width: '200px', marginLeft: '4px' }}
        />
      </label>

      <button type="button" onClick={onLoadData} disabled={loading} style={primaryButton}>
        {loading ? 'Loading…' : 'Load Data'}
      </button>

      {loadError && (
        <span style={{ color: '#ff6666', fontSize: '13px' }}>{loadError}</span>
      )}

      <button type="button" onClick={onCopyHtml} style={{ ...successButton, marginLeft: 'auto' }}>
        {copyLabel}
      </button>
    </div>
  );
}

ReportToolbar.propTypes = {
  squadronId: T.oneOfType([T.string, T.number]).isRequired,
  onSquadronIdChange: T.func.isRequired,
  reportNumber: T.number.isRequired,
  onReportNumberChange: T.func.isRequired,
  startDate: T.string.isRequired,
  onStartDateChange: T.func.isRequired,
  endDate: T.string.isRequired,
  onEndDateChange: T.func.isRequired,
  submissionDate: T.string.isRequired,
  onSubmissionDateChange: T.func.isRequired,
  statusLine: T.string.isRequired,
  onStatusLineChange: T.func.isRequired,
  loading: T.bool.isRequired,
  loadError: T.string,
  onLoadData: T.func.isRequired,
  copyLabel: T.string.isRequired,
  onCopyHtml: T.func.isRequired,
};

ReportToolbar.defaultProps = {
  loadError: null,
};
