import { useState, useEffect } from 'react';
import T from 'prop-types';
import editorStyles from '../src/editorStyles';

const inputStyle = {
  ...editorStyles.inputStyle,
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle = {
  ...editorStyles.buttonStyle,
  fontSize: '13px',
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

export default function ConfigEditor({ onChange }) {
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
    const next = { ...config, [key]: val };
    setConfig(next);
    onChange?.(next);
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
      setStatus('Saved!');
      setSaving(false);
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
                <Field
                  label="Title Format"
                  value={config.reportTitleFormat}
                  onChange={(v) => set('reportTitleFormat', v)}
                  hint="Use {{number}} for the report number"
                />
              </div>

              {/* CMDR intro line */}
              <div style={sectionStyle}>
                <div style={sectionHeadingStyle}>CMDR</div>
                <Field label="Intro Line" value={config.cmdr?.intro} onChange={(v) => set('cmdr', { ...config.cmdr, intro: v })} />
              </div>

              {/* Battlegroup Commander */}
              <PersonSection label="Battlegroup Commander" data={config.com ?? {}} onChange={(v) => set('com', v)} />

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

ConfigEditor.propTypes = {
  onChange: T.func,
};

ConfigEditor.defaultProps = {
  onChange: null,
};
