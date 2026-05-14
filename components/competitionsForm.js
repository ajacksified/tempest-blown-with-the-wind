import { useState } from 'react';
import T from 'prop-types';
import editorStyles from '../src/editorStyles';

const { inputStyle, buttonStyle, primaryButton, sectionFormStyle } = editorStyles;

export default function CompetitionsForm({ competitions, onChange }) {
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
