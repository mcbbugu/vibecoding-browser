import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Tooltip = ({ children, message, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    if (position === 'top') {
      top = triggerRect.top - tooltipRect.height - 8;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    } else if (position === 'bottom') {
      top = triggerRect.bottom + 8;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    } else if (position === 'left') {
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.left - tooltipRect.width - 8;
    } else if (position === 'right') {
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.right + 8;
    }

    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      setTimeout(updatePosition, 0);
      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [isVisible, message, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[100002] px-2 py-1 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-800 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {message}
          {position === 'top' && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
          )}
          {position === 'bottom' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-b-zinc-900 dark:border-b-zinc-800" />
          )}
          {position === 'left' && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-4 border-transparent border-l-zinc-900 dark:border-l-zinc-800" />
          )}
          {position === 'right' && (
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-800" />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

