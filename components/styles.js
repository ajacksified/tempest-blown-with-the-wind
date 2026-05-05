const fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
const white = '#ffffff';
const black = '#000000';
const red = '#f55';
const green = '#5f5';
const orange = '#fa0';
const blue = '#004c83';

const body = {
  color: white,
  backgroundColor: black,
  margin: 0,
  padding: 0,
};

const article = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '1rem',
  lineHeight: '1.6',
  fontFamily,
  fontSize: '16px',
};

const header = {
  marginBottom: '1.5rem',
  borderBottom: '1px solid currentColor',
  paddingBottom: '1rem',
};

const nav = {
  marginBottom: '1.5rem',
  padding: '1rem',
  border: '1px solid currentColor',
};

const sectionBlock = {
  marginBottom: '3rem',
};

const sectionPrefix = {
  fontSize: '0.85rem',
  marginBottom: '0.25rem',
  margin: 0,
  color: orange,
};

const pilotCard = {
  margin: '1rem 0',
  padding: '1rem',
  border: '1px solid #333',
};

const promotionCard = {
  marginTop: '1rem',
};

const footer = {
  marginTop: '2rem',
};

const h1 = { margin: '0.25rem 0', lineHeight: 1.1 };
const h2 = { marginTop: '0.5rem', marginBottom: '0.5rem' };
const h3 = { marginTop: '0.5rem', marginBottom: '0.5rem' };
const h4 = { marginTop: 0, marginBottom: '0.25rem' };
const h5 = { marginTop: 0, marginBottom: '0.25rem' };
const h6 = { marginTop: 0, fontWeight: 'normal' };

const p = { margin: '0.5rem 0' };
const a = { color: '#0095ff' };
const dt = { display: 'inline', fontWeight: 'bold', marginRight: '0.5em', float: 'left' };
const dd = { margin: '0 0 0.5em 0' };

// Legacy — used by old reports and backward-compat code
const card = { padding: '1em 0.5em', borderBottom: 'solid 1px #666666', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' };
const highlighted = { backgroundColor: '#004c83', padding: '0.5em' };
const highlightedLink = { color: '#f49553' };
const rankBadge = { height: '27px', display: 'inline-block', paddingRight: '0.5em' };

const list = {
  listStyleType: '"- "',
};

const listItem = {
  color: white,
  marginBottom: '2px',
};

const listItemLink = {
  color: white,
  display: 'inline-block',
  fontSize: '0.85rem',
  padding: '0.15rem 0.35rem',
  backgroundColor: blue,
  borderRadius: 1,
  textDecoration: 'none',
};

const listItemLabel = {
  color: white,
  display: 'inline-block',
  fontSize: '0.85rem',
  padding: '0.15rem 0.35rem',
  backgroundColor: '#333',
  borderRadius: 1,
  textDecoration: 'none',
};

const styles = {
  body,
  article,
  header,
  nav,
  sectionBlock,
  sectionPrefix,
  pilotCard,
  promotionCard,
  footer,
  h1, h2, h3, h4, h5, h6,
  p, a, dt, dd,
  card, highlighted, highlightedLink, rankBadge,
  red, green, black, white,
  list, listItem, listItemLink, listItemLabel
};

export default styles;
