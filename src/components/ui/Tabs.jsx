import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Accessible tabs with animated underline indicator.
 *
 * Props:
 *   tabs: [{ key, label, icon? }]
 *   activeKey: string
 *   onChange: (key) => void
 *   className: string
 */
export function Tabs({ tabs = [], activeKey, onChange, className = '' }) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef(null);

  const updateIndicator = useCallback(() => {
    if (!tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector('[data-active="true"]');
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [activeKey, updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleKeyDown = (e) => {
    const keys = tabs.map(t => t.key);
    const idx = keys.indexOf(activeKey);
    let nextIdx = idx;

    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % keys.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + keys.length) % keys.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = keys.length - 1;
    else return;

    e.preventDefault();
    onChange?.(keys[nextIdx]);

    // Focus the new active tab
    const nextTab = tabsRef.current?.querySelector(`[data-tab-key="${keys[nextIdx]}"]`);
    nextTab?.focus();
  };

  return (
    <div
      ref={tabsRef}
      role="tablist"
      className={`relative flex items-center gap-1 border-b border-slate-200 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            data-active={isActive}
            data-tab-key={tab.key}
            onClick={() => onChange?.(tab.key)}
            className={[
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
            style={{ transition: 'color var(--duration-fast) var(--ease-out)' }}
          >
            {tab.icon && <span className="shrink-0" aria-hidden="true">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}

      {/* Animated underline */}
      <div
        className="absolute bottom-0 h-0.5 rounded-full"
        style={{
          left: indicatorStyle.left || 0,
          width: indicatorStyle.width || 0,
          background: 'var(--color-primary-500)',
          transition: 'left var(--duration-normal) var(--ease-out), width var(--duration-normal) var(--ease-out)',
        }}
      />
    </div>
  );
}
