import { Check } from 'lucide-react';

/**
 * Horizontal timeline (stepper) for order/workflow status.
 *
 * Props:
 *   steps: [{ key, label, timestamp?, description? }]
 *   currentKey: string — key of the current active step
 *   className: string
 */
export function Timeline({ steps = [], currentKey, className = '' }) {
  const currentIdx = steps.findIndex(s => s.key === currentKey);

  return (
    <div className={className}>
      {/* Horizontal stepper */}
      <div className="flex items-start" role="list" aria-label="Tiến trình">
        {steps.map((step, index) => {
          const isCompleted = index < currentIdx;
          const isCurrent = index === currentIdx;
          const isPending = index > currentIdx;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.key}
              className="flex flex-1 flex-col items-center relative"
              role="listitem"
            >
              {/* Connector line (before node) */}
              {index > 0 && (
                <div
                  className="absolute top-4 right-1/2 w-full h-0.5 -z-0"
                  style={{
                    background: isCompleted || isCurrent
                      ? 'var(--color-primary-500)'
                      : 'var(--color-border)',
                    transition: 'background var(--duration-normal) var(--ease-out)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Node */}
              <div className="relative z-10">
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border-2',
                    isCompleted ? 'bg-blue-500 border-blue-500 text-white' : '',
                    isCurrent ? 'text-white border-blue-500 status-pulse' : '',
                    isPending ? 'bg-white border-slate-300 text-slate-400' : '',
                  ].join(' ')}
                  style={isCurrent ? { background: 'var(--color-primary-500)' } : undefined}
                  aria-label={isCompleted ? 'Hoàn thành' : isCurrent ? 'Đang xử lý' : 'Chờ xử lý'}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="mt-2 text-center px-1">
                <div
                  className={[
                    'text-xs font-semibold leading-tight',
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400',
                  ].join(' ')}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="mt-0.5 text-[10px] text-slate-400">{step.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
