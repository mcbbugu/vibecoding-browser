import { useEffect, useRef, useState } from 'react';

export const useIframePreview = (url, shouldPreview, refreshKey = 0) => {
  const [previewError, setPreviewError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastUrlRef = useRef(null);
  const lastRefreshKeyRef = useRef(refreshKey);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const urlChanged = lastUrlRef.current !== url;
    const refreshKeyChanged = lastRefreshKeyRef.current !== refreshKey;
    
    if (urlChanged || refreshKeyChanged) {
      setPreviewError(false);
      setIsLoading(true);
      hasLoadedRef.current = false;
      lastUrlRef.current = url;
      lastRefreshKeyRef.current = refreshKey;
      
      if (iframeRef.current && refreshKeyChanged && !urlChanged) {
        iframeRef.current.src = url;
      }
      
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
  }, [url, shouldPreview, refreshKey]);

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
    if (!shouldPreview || !url || !containerRef.current) {
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current);
        iframeRef.current.removeEventListener('load', handleIframeLoad);
        iframeRef.current.removeEventListener('error', handleIframeError);
        iframeRef.current = null;
      }
      return;
    }
    
    if (iframeRef.current) {
      if (!iframeRef.current.parentNode) {
        containerRef.current.appendChild(iframeRef.current);
      }
      return;
    }

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
  }, [shouldPreview, url]);
  
  useEffect(() => {
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
  }, []);

  return {
    containerRef,
    previewError,
    isLoading,
    canPreview: shouldPreview && !previewError
  };
};

