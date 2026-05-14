import T from 'prop-types';
import OrdersForm from './ordersForm';
import CompetitionsForm from './competitionsForm';
import CitationsForm from './citationsForm';
import editorStyles from '../src/editorStyles';

const { sidebarSectionHead } = editorStyles;

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

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#111',
  color: '#eee',
  border: '1px solid #444',
  padding: '4px 6px',
  fontSize: '12px',
  marginTop: '4px',
};

export default function ReportSidebar({
  uniformUrl, onUniformUrlChange,
  accentColor, onAccentColorChange,
  orders, onOrdersChange,
  competitions, onCompetitionsChange,
  citations, citationsChange, onCitationsChange, onCitationsChangeChange,
}) {
  return (
    <div data-editor-only="true" style={sidebarStyle}>
      <span style={sidebarSectionHead}>Appearance</span>
      <label style={{ display: 'block', opacity: 0.7, fontSize: '11px', marginBottom: '2px' }}>
        Accent color
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <input
          type="color"
          value={accentColor}
          onChange={(e) => onAccentColorChange(e.target.value)}
          style={{ width: '36px', height: '24px', padding: '1px', border: '1px solid #444', background: 'none', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace' }}>{accentColor}</span>
      </div>
      <label style={{ display: 'block', opacity: 0.7, fontSize: '11px', marginBottom: '2px' }}>
        CMDR uniform image URL
      </label>
      <input
        type="url"
        value={uniformUrl}
        onChange={(e) => onUniformUrlChange(e.target.value)}
        placeholder="https://…"
        style={inputStyle}
      />

      <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

      <span style={sidebarSectionHead}>Orders</span>
      <OrdersForm orders={orders} onChange={onOrdersChange} />

      <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

      <span style={sidebarSectionHead}>Competitions</span>
      <CompetitionsForm competitions={competitions} onChange={onCompetitionsChange} />

      <hr style={{ borderColor: '#333', margin: '1rem 0' }} />

      <span style={sidebarSectionHead}>
        Citations
        <span style={{ fontWeight: 'normal', opacity: 0.7, marginLeft: '0.5em' }}>(Δ count)</span>
      </span>
      <CitationsForm
        citations={citations}
        citationsChange={citationsChange}
        onCitationsChange={onCitationsChange}
        onChangeChange={onCitationsChangeChange}
      />
    </div>
  );
}

ReportSidebar.propTypes = {
  uniformUrl: T.string.isRequired,
  onUniformUrlChange: T.func.isRequired,
  accentColor: T.string.isRequired,
  onAccentColorChange: T.func.isRequired,
  orders: T.arrayOf(T.object).isRequired,
  onOrdersChange: T.func.isRequired,
  competitions: T.arrayOf(T.object).isRequired,
  onCompetitionsChange: T.func.isRequired,
  citations: T.arrayOf(T.string).isRequired,
  citationsChange: T.string.isRequired,
  onCitationsChange: T.func.isRequired,
  onCitationsChangeChange: T.func.isRequired,
};
