import Tooltip from '@app/components/Common/Tooltip';
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useRef, useState } from 'react';
import type { Config } from 'react-popper-tooltip';
import { useToasts } from 'react-toast-notifications';

type CopyButtonProps = {
  textToCopy: string;
  disabled?: boolean;
  toastMessage?: string;

  tooltipContent?: React.ReactNode;
  tooltipConfig?: Partial<Config>;
};

const CopyButton = ({
  textToCopy,
  disabled,
  toastMessage,
  tooltipContent,
  tooltipConfig,
}: CopyButtonProps) => {
  const { addToast } = useToasts();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      if (toastMessage) {
        addToast(toastMessage, {
          appearance: 'info',
          autoDismiss: true,
        });
      }
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsCopied(false), 1000);
    });
  }, [textToCopy, toastMessage, addToast]);

  return (
    <Tooltip content={tooltipContent} tooltipConfig={tooltipConfig}>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (!isCopied) handleCopy();
        }}
        className="input-action"
        type="button"
        disabled={disabled}
      >
        <ClipboardDocumentIcon />
      </button>
    </Tooltip>
  );
};

export default CopyButton;
