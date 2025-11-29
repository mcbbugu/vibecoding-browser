import { useEffect, useRef, useState } from 'react';

export const useIframePreview = (url, shouldPreview) => {
  const [previewError, setPreviewError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastUrlRef = useRef(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const urlChanged = lastUrlRef.current !== url;
    
    if (urlChanged) {
      setPreviewError(false);
      setIsLoading(true);
      hasLoadedRef.current = false;
      lastUrlRef.current = url;
      
      if (shouldPreview && url) {
        timeoutRef.current = setTimeout(() => {
          if (!hasLoadedRef.current) {
            setIsLoading(false);
            setPreviewError(true);
          }
        }, 5000);
      } else {
        setIsLoading(false);
      }
    } else if (!shouldPreview) {
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url, shouldPreview]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hasLoadedRef.current = true;
    setIsLoading(false);
    setPreviewError(false);
  };

  const handleIframeError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setPreviewError(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!shouldPreview || !url || !containerRef.current || iframeRef.current) return;

    const iframe = document.createElement('iframe');
    iframeRef.current = iframe;
    iframe.src = url;
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none';
    iframe.style.transform = 'scale(0.5)';
    iframe.style.transformOrigin = 'top left';
    iframe.style.width = '200%';
    iframe.style.height = '200%';
    iframe.scrolling = 'no';
    iframe.style.overflow = 'hidden';
    iframe.sandbox = 'allow-same-origin allow-scripts';
    iframe.loading = 'lazy';

    iframe.addEventListener('load', handleIframeLoad);
    iframe.addEventListener('error', handleIframeError);

    containerRef.current.appendChild(iframe);

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
        iframeRef.current.removeEventListener('error', handleIframeError);
        if (iframeRef.current.parentNode) {
          iframeRef.current.parentNode.removeChild(iframeRef.current);
        }
        iframeRef.current = null;
      }
    };
  }, [shouldPreview, url]);

  return {
    containerRef,
    previewError,
    isLoading,
    canPreview: shouldPreview && !previewError
  };
};

