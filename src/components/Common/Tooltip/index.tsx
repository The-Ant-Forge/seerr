import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export type TooltipConfig = {
  followCursor?: boolean;
  placement?: 'auto-end' | 'top' | 'bottom' | 'left' | 'right';
  offset?: [number, number];
  interactive?: boolean;
  delayHide?: number;
};

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  tooltipConfig?: Partial<TooltipConfig>;
  className?: string;
};

const Tooltip = ({
  children,
  content,
  tooltipConfig,
  className,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const crossAxis = tooltipConfig?.offset?.[0] ?? 0;
  const mainAxis = tooltipConfig?.offset?.[1] ?? 6;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement:
      tooltipConfig?.placement === 'auto-end'
        ? 'bottom-end'
        : (tooltipConfig?.placement ?? 'bottom-end'),
    middleware: [
      offset({ mainAxis, crossAxis }),
      flip(),
      shift({ padding: 5 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    move: true,
    delay: tooltipConfig?.delayHide
      ? { open: 0, close: tooltipConfig.delayHide }
      : undefined,
  });
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    role,
  ]);

  const tooltipStyle = [
    'z-50 text-sm absolute font-normal bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow text-gray-100',
  ];

  if (className) {
    tooltipStyle.push(className);
  }

  return (
    <>
      {React.cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      {isOpen &&
        content &&
        ReactDOM.createPortal(
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={tooltipStyle.join(' ')}
            {...getFloatingProps()}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
