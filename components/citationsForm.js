import { useState } from 'react';
import T from 'prop-types';
import editorStyles from '../src/editorStyles';

const { inputStyle, buttonStyle, primaryButton, sectionFormStyle } = editorStyles;

export default function CitationsForm({ citations, citationsChange, onCitationsChange, onChangeChange }) {
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
        <input
          style={{ ...inputStyle, flex: 1, minWidth: '120px', fontSize: '12px' }}
          placeholder="e.g. TIE-TC 12"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
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
