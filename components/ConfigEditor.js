import { useState, useEffect } from 'react';
import T from 'prop-types';

const inputStyle = {
  backgroundColor: '#0d0d1a',
  color: '#ffffff',
  border: '1px solid #555',
  padding: '0.3em 0.5em',
  fontFamily: 'Monospace',
  fontSize: '13px',
  borderRadius: '3px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  color: '#aaa',
  fontSize: '11px',
  display: 'block',
  marginBottom: '3px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const fieldStyle = {
  marginBottom: '0.6em',
};

const sectionStyle = {
  marginBottom: '1em',
};

const sectionHeadingStyle = {
  color: '#0095ff',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.5em',
  borderBottom: '1px solid #333',
  paddingBottom: '3px',
};

const buttonStyle = {
  padding: '0.4em 1em',
  cursor: 'pointer',
  fontFamily: 'Monospace',
  fontSize: '13px',
  borderRadius: '3px',
  border: 'none',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '0.5em',
};

function Field({ label, value, onChange, type = 'text', hint }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={inputStyle}
      />
      {hint && <span style={{ color: '#666', fontSize: '11px' }}>{hint}</span>}
    </div>
  );
}

Field.propTypes = {
  label: T.string.isRequired,
  value: T.oneOfType([T.string, T.number]),
  onChange: T.func.isRequired,
  type: T.string,
  hint: T.string,
};

Field.defaultProps = {
  value: '',
  type: 'text',
  hint: null,
};

function PersonSection({ label, data, onChange }) {
  function set(key, val) {
    onChange({ ...data, [key]: val });
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeadingStyle}>{label}</div>
      <div style={gridStyle}>
        <Field label="Name" value={data.name} onChange={(v) => set('name', v)} />
        <Field label="Title" value={data.title} onChange={(v) => set('title', v)} />
        <Field label="PIN" value={data.pin} onChange={(v) => set('pin', v)} type="number" />
        {data.intro !== undefined && (
          <Field label="Intro Line" value={data.intro} onChange={(v) => set('intro', v)} />
        )}
        {data.email !== undefined && (
          <Field label="Email" value={data.email} onChange={(v) => set('email', v)} />
        )}
      </div>
    </div>
  );
}

PersonSection.propTypes = {
  label: T.string.isRequired,
  data: T.shape({
    name: T.string,
    title: T.string,
    pin: T.number,
    intro: T.string,
    email: T.string,
  }).isRequired,
  onChange: T.func.isRequired,
};

function FlightsSection({ flights, onChange }) {
  function updateFlight(i, key, val) {
    const next = flights.map((f, fi) => (fi === i ? { ...f, [key]: val } : f));
    onChange(next);
  }

  function removeFlight(i) {
    onChange(flights.filter((_, fi) => fi !== i));
  }

  function addFlight() {
    onChange([...flights, { name: '', motto: '', ship: 31 }]);
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeadingStyle}>Flights</div>
      {flights.map((flight, i) => (
        <div key={`flight-${flight.name || i}`} style={{ marginBottom: '0.75em', paddingLeft: '0.5em', borderLeft: '2px solid #333' }}>
          <div style={{ ...gridStyle, marginBottom: '0.25em' }}>
            <Field label={`Flight ${i + 1} Name`} value={flight.name} onChange={(v) => updateFlight(i, 'name', v)} />
            <Field label="Ship ID" value={flight.ship} onChange={(v) => updateFlight(i, 'ship', v)} type="number" />
          </div>
          <Field label="Motto" value={flight.motto} onChange={(v) => updateFlight(i, 'motto', v)} />
          <button
            type="button"
            onClick={() => removeFlight(i)}
            style={{ ...buttonStyle, backgroundColor: '#550000', color: '#fff', fontSize: '11px', padding: '0.2em 0.6em' }}
          >
            Remove Flight
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addFlight}
        style={{ ...buttonStyle, backgroundColor: '#003366', color: '#fff', marginTop: '0.25em' }}
      >
        + Add Flight
      </button>
    </div>
  );
}

FlightsSection.propTypes = {
  flights: T.arrayOf(T.shape({ name: T.string, motto: T.string, ship: T.number })).isRequired,
  onChange: T.func.isRequired,
};

export default function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setStatus('Could not load config — is next dev running?'));
  }, []);

  function set(key, val) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus('Saved! Reloading…');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setSaving(false);
    }
  }

  return (
    <div data-editor-only="true" style={{ marginBottom: '0.5em' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...buttonStyle,
          backgroundColor: open ? '#333' : '#1a1a2e',
          color: '#aaa',
          border: '1px solid #444',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {open ? '▼' : '▶'}
        {' ⚙ Squadron Config'}
      </button>

      {open && (
        <div style={{
          backgroundColor: '#0a0a18',
          border: '1px solid #333',
          borderTop: 'none',
          padding: '1em',
          fontSize: '13px',
        }}
        >
          {!config && <p style={{ color: '#aaa' }}>Loading config…</p>}
          {config && (
            <>
              {/* Report title */}
              <div style={sectionStyle}>
                <div style={sectionHeadingStyle}>Report</div>
                <div style={gridStyle}>
                  <Field
                    label="Title Format"
                    value={config.reportTitleFormat}
                    onChange={(v) => set('reportTitleFormat', v)}
                    hint="Use {{number}} for the report number"
                  />
                  <Field label="Squadron" value={config.squadron} onChange={(v) => set('squadron', v)} />
                  <Field label="Ship" value={config.ship} onChange={(v) => set('ship', v)} />
                  <Field label="Squadron ID" value={config.squadronId} onChange={(v) => set('squadronId', v)} />
                </div>
              </div>

              {/* Images */}
              <div style={sectionStyle}>
                <div style={sectionHeadingStyle}>Images</div>
                <Field label="Banner URL" value={config.squadronBanner?.url} onChange={(v) => set('squadronBanner', { ...config.squadronBanner, url: v })} />
                <Field label="Patch URL" value={config.squadronPatch?.url} onChange={(v) => set('squadronPatch', { ...config.squadronPatch, url: v })} />
              </div>

              {/* People */}
              <PersonSection label="CMDR" data={config.cmdr} onChange={(v) => set('cmdr', v)} />
              <PersonSection label="Battlegroup Commander" data={config.com} onChange={(v) => set('com', v)} />

              {/* Flights */}
              <FlightsSection flights={config.flights} onChange={(v) => set('flights', v)} />

              {/* Save */}
              <div style={{ display: 'flex', gap: '1em', alignItems: 'center', marginTop: '0.5em' }}>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  style={{ ...buttonStyle, backgroundColor: '#00aa55', color: '#fff' }}
                >
                  {saving ? 'Saving…' : 'Save Config'}
                </button>
                {status && <span style={{ color: status.startsWith('Error') ? '#ff6666' : '#66cc88', fontSize: '12px' }}>{status}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
