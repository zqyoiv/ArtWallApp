type WebShareButtonProps = {
  file: { name: string; type: string } | null;
  label?: string;
  disabled?: boolean;
  onShared?: () => void;
  onCancelled?: () => void;
  onError?: (message: string) => void;
};

/** Native stub — web uses WebShareButton.web.tsx */
export function WebShareButton(_props: WebShareButtonProps) {
  return null;
}
