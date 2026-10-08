import { describeError } from '../../lib/api-client';
import { Button } from './Button';

/** Inline error box (for dialogs and banners). */
export const ErrorMessage = ({
  error,
  onDismiss,
  className = '',
}: {
  error: unknown;
  onDismiss?: () => void;
  className?: string;
}) => {
  if (!error) return null;
  const { message, details } = describeError(error);
  return (
    <div
      role="alert"
      className={`rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
      {details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Block error state for a failed query, with a Retry action. */
export const ErrorPanel = ({
  error,
  onRetry,
  title = 'Something went wrong',
  isRetrying,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  isRetrying?: boolean;
}) => {
  const { message, details } = describeError(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
    >
      <h2 className="text-sm font-semibold text-red-800">{title}</h2>
      <p className="text-sm text-red-700">{message}</p>
      {details.map((d, i) => (
        <p key={i} className="text-xs text-red-700">
          {d}
        </p>
      ))}
      {onRetry && (
        <Button className="mt-2" size="sm" onClick={onRetry} isLoading={isRetrying}>
          Retry
        </Button>
      )}
    </div>
  );
};
