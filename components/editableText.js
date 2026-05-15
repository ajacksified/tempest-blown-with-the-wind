import { useRef, useEffect, useState, useCallback } from 'react';
import T from 'prop-types';

// ── Styles ────────────────────────────────────────────────────────────────────

const toolbarWrapStyle = {
  position: 'relative',
};

const toolbarStyle = {
  display: 'flex',
  gap: '2px',
  padding: '3px 5px',
  background: '#111827',
  border: '1px solid #2a2a3a',
  borderRadius: '3px 3px 0 0',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const btnBase = {
  background: 'none',
  border: '1px solid #333',
  color: '#aaa',
  padding: '1px 6px',
  fontSize: '11px',
  cursor: 'pointer',
  borderRadius: '2px',
  lineHeight: '1.6',
  userSelect: 'none',
};

const sepStyle = {
  width: '1px',
  height: '14px',
  background: '#333',
  margin: '0 2px',
  alignSelf: 'center',
};

const linkInputStyle = {
  background: '#0d0d1a',
  border: '1px solid #444',
  color: '#eee',
  fontSize: '11px',
  padding: '1px 5px',
  outline: 'none',
  width: '180px',
  borderRadius: '2px',
};

// ── Toolbar button ─────────────────────────────────────────────────────────────

function Btn({ label, title, bold, italic, onMouseDown }) {
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      title={title}
      style={{
        ...btnBase,
        ...(bold   ? { fontWeight: 'bold' }  : {}),
        ...(italic ? { fontStyle: 'italic' } : {}),
        ...(over   ? { background: '#1e2a3a', color: '#fff' } : {}),
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
    >
      {label}
    </button>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onCmd, onLinkCommit, linkMode, setLinkMode, linkRef }) {
  // Prevent toolbar interactions from stealing focus / clearing selection
  const block = (e) => e.preventDefault();

  const cmd = (fn) => (e) => { e.preventDefault(); fn(); };

  return (
    <div data-editor-only="true" style={toolbarStyle} onMouseDown={block}>
      <Btn label="B"  title="Bold"       bold   onMouseDown={cmd(() => onCmd('bold'))} />
      <Btn label="I"  title="Italic"     italic onMouseDown={cmd(() => onCmd('italic'))} />

      <div style={sepStyle} />

      <Btn label="H2" title="Heading 2"  onMouseDown={cmd(() => onCmd('formatBlock', 'h2'))} />
      <Btn label="H3" title="Heading 3"  onMouseDown={cmd(() => onCmd('formatBlock', 'h3'))} />
      <Btn label="¶"  title="Paragraph"  onMouseDown={cmd(() => onCmd('formatBlock', 'p'))} />

      <div style={sepStyle} />

      <Btn label="—"  title="Horizontal rule" onMouseDown={cmd(() => onCmd('insertHR'))} />

      <div style={sepStyle} />

      {linkMode ? (
        <>
          <input
            ref={linkRef}
            type="url"
            placeholder="https://…"
            style={linkInputStyle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onLinkCommit(linkRef.current.value); }
              if (e.key === 'Escape') { e.preventDefault(); setLinkMode(false); }
            }}
          />
          <Btn label="✓" title="Apply link"  onMouseDown={cmd(() => onLinkCommit(linkRef.current?.value))} />
          <Btn label="✕" title="Cancel"      onMouseDown={cmd(() => setLinkMode(false))} />
        </>
      ) : (
        <Btn label="🔗" title="Insert / edit link" onMouseDown={cmd(() => setLinkMode(true))} />
      )}
    </div>
  );
}

// ── EditableText ───────────────────────────────────────────────────────────────

/**
 * A contenteditable div with a lightweight rich-text toolbar.
 * The toolbar appears on focus and is stripped when copying report HTML.
 */
export default function EditableText({ value, onChange, style, placeholder }) {
  const editRef   = useRef(null);
  const linkRef   = useRef(null);
  const savedRange = useRef(null);
  const [focused,  setFocused]  = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  // Sync external value changes (e.g. Load Data) without clobbering cursor
  useEffect(() => {
    if (editRef.current && editRef.current.innerHTML !== value) {
      editRef.current.innerHTML = value;
    }
  }, [value]);

  // Focus the URL input as soon as link mode opens
  useEffect(() => {
    if (linkMode) {
      // Pre-fill with existing href if cursor is inside a link
      const sel = window.getSelection();
      if (sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
      const anchor = sel.anchorNode?.parentElement?.closest('a');
      setTimeout(() => {
        if (linkRef.current) {
          linkRef.current.value = anchor?.href ?? '';
          linkRef.current.focus();
        }
      }, 0);
    }
  }, [linkMode]);

  const execCmd = useCallback((cmdName, arg) => {
    editRef.current?.focus();
    if (cmdName === 'formatBlock') {
      document.execCommand('formatBlock', false, arg);
    } else if (cmdName === 'insertHR') {
      document.execCommand('insertHorizontalRule');
    } else {
      document.execCommand(cmdName);
    }
    onChange(editRef.current.innerHTML);
  }, [onChange]);

  const handleLinkCommit = useCallback((url) => {
    setLinkMode(false);
    editRef.current?.focus();
    // Restore saved selection before applying
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
      savedRange.current = null;
    }
    if (url && url.trim()) {
      document.execCommand('createLink', false, url.trim());
    } else {
      document.execCommand('unlink');
    }
    onChange(editRef.current.innerHTML);
  }, [onChange]);

  const handleSetLinkMode = useCallback((val) => {
    // Save selection before switching to link input
    if (val) {
      const sel = window.getSelection();
      if (sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkMode(val);
  }, []);

  return (
    <div style={toolbarWrapStyle}>
      {focused && (
        <Toolbar
          onCmd={execCmd}
          onLinkCommit={handleLinkCommit}
          linkMode={linkMode}
          setLinkMode={handleSetLinkMode}
          linkRef={linkRef}
        />
      )}
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Don't hide toolbar when focus moves to the link input (child of wrapper)
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
            setFocused(false);
            setLinkMode(false);
          }
        }}
        onInput={() => onChange(editRef.current.innerHTML)}
        style={{
          outline: 'none',
          paddingLeft: '0.5em',
          minHeight: '1em',
          border: focused ? '1px solid #2a2a3a' : '1px solid transparent',
          borderTop: focused ? '0' : '1px solid transparent',
          ...style,
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

EditableText.propTypes = {
  value: T.string,
  onChange: T.func.isRequired,
  style: T.object,
  placeholder: T.string,
};

EditableText.defaultProps = {
  value: '',
  style: {},
  placeholder: '',
};
