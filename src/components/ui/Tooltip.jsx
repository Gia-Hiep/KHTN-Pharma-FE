// File: src/components/ui/Tooltip.jsx
import { useState, useRef, useId } from 'react';

/**
 * Lightweight CSS tooltip. Wraps a trigger element.
 *
 * Props:
 *   content: string — tooltip text
 *   position: 'top' | 'bottom' | 'left' | 'right'
 *   children: ReactNode — trigger element
 */
export function Tooltip({ content, position = 'top', children }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const timeoutRef = useRef(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={visible ? id : undefined}>
        {children}
      </span>

      {visible && (
        <span
          id={id}
          role="tooltip"
          className="absolute z-50 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg pointer-events-none"
          style={{
            ...positionStyles[position],
            animation: 'fadeIn var(--duration-fast) var(--ease-out)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
