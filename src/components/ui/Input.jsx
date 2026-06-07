// File: src/components/ui/Input.jsx
let inputIdCounter = 0;

export function Input({ label, id, error, hint, className = '', ...props }) {
  const inputId = id || `input-${++inputIdCounter}`;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'input',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
