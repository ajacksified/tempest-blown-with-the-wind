import { useRef, useEffect } from 'react';
import T from 'prop-types';

/**
 * A contenteditable div whose content is synced back to state via onInput.
 * `value` is treated as the initial HTML; further edits are managed by the DOM.
 */
export default function EditableText({ value, onChange, style, placeholder }) {
  const ref = useRef(null);

  // Only set innerHTML on mount or when value changes externally (e.g. on Load Data)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onChange(ref.current.innerHTML)}
      style={{
        outline: 'none',
        borderLeft: '2px solid #555',
        paddingLeft: '0.5em',
        minHeight: '1em',
        ...style,
      }}
      data-placeholder={placeholder}
    />
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
