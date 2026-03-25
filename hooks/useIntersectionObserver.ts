'use client';

import { useState, useEffect, useRef } from 'react';

interface ObserverOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Custom hook to lazily trigger visibility detection via IntersectionObserver.
 * Returns a ref to attach to the target element and a boolean for intersection status.
 * Immediately disconnects once the element is visible to prevent memory leaks.
 * 
 * @param options.rootMargin - Pre-trigger buffer (default: 400px below viewport)
 * @param options.threshold  - Visibility ratio to trigger (default: 0)
 */
export function useIntersectionObserver(
  options: ObserverOptions = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const { rootMargin = '0px 0px 400px 0px', threshold = 0 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return [ref, isIntersecting];
}
