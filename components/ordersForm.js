import { useState } from 'react';
import T from 'prop-types';
import editorStyles from '../src/editorStyles';

const { inputStyle, buttonStyle, primaryButton, sectionFormStyle } = editorStyles;

export default function OrdersForm({ orders, onChange }) {
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
