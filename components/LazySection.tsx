'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

/**
 * Wrapper component that defers rendering its children until the element
 * is about to scroll into the viewport. Uses IntersectionObserver with a
 * configurable pre-trigger buffer (rootMargin).
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = '0px 0px 400px 0px',
  minHeight = '200px'
}: LazySectionProps) {
  const [ref, isVisible] = useIntersectionObserver({ rootMargin });

  return (
    <div ref={ref} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? children : (fallback || (
        <div className="w-full flex items-center justify-center" style={{ minHeight }}>
          <div className="w-8 h-8 border-2 border-[#0E4D55]/20 border-t-[#0E4D55] rounded-full animate-spin" />
        </div>
      ))}
    </div>
  );
}
