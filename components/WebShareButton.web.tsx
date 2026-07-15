import { CSSProperties } from 'react';
import {
  canShareImageFile,
  isWebShareAvailable,
  shareImageFileNow,
} from '../utils/webShareImage';

type WebShareButtonProps = {
  file: File | null;
  label?: string;
  disabled?: boolean;
  onShared?: () => void;
  onCancelled?: () => void;
  onError?: (message: string) => void;
};

const buttonStyle: CSSProperties = {
  width: '100%',
  appearance: 'none',
  border: 'none',
  borderRadius: 12,
  padding: '16px 20px',
  backgroundColor: '#18181B',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 15,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

/**
 * Real HTML <button> — required on iOS Safari so navigator.share()
 * runs inside a trusted user gesture (RN TouchableOpacity often does not).
 */
export function WebShareButton({
  file,
  label = 'Share',
  disabled,
  onShared,
  onCancelled,
  onError,
}: WebShareButtonProps) {
  const enabled = !!file && !disabled && isWebShareAvailable();

  return (
    <button
      type="button"
      disabled={!enabled}
      style={{
        ...buttonStyle,
        opacity: enabled ? 1 : 0.5,
        cursor: enabled ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (!file) {
          onError?.('Image is not ready yet.');
          return;
        }
        if (!isWebShareAvailable()) {
          onError?.(
            'Share needs HTTPS. Open this app with https:// (Render URL), not http://.'
          );
          return;
        }
        // Do not await anything before share — keep the user gesture.
        if (typeof navigator.canShare === 'function' && !canShareImageFile(file)) {
          onError?.('This browser cannot share image files.');
          return;
        }

        shareImageFileNow(file)
          .then(() => onShared?.())
          .catch((err: unknown) => {
            if (err instanceof Error && err.message === 'SAVE_CANCELLED') {
              onCancelled?.();
              return;
            }
            const message =
              err instanceof Error ? err.message : 'Could not open the share menu.';
            onError?.(message);
          });
      }}
    >
      {label}
    </button>
  );
}
