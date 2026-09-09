import React, { useEffect } from 'react';

export function MetaPixel() {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'PageView');
    }
  }, []);

  return null;
}
export default MetaPixel;
