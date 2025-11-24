export const calculateBrowserViewBounds = (containerRef) => {
  if (!containerRef?.current) return null;
  const rect = containerRef.current.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
};

