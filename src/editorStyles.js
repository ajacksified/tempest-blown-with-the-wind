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
  marginBottom: '1.25rem',
};

const sidebarSectionHead = {
  display: 'block',
  color: '#0095ff',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const labelStyle = {
  color: '#aaa',
  fontSize: '12px',
  display: 'block',
  marginBottom: '2px',
};

const editorStyles = {
  inputStyle,
  buttonStyle,
  primaryButton,
  successButton,
  sectionFormStyle,
  sidebarSectionHead,
  labelStyle,
};

export default editorStyles;
