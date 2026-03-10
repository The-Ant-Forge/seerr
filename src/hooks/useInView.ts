import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  triggerOnce?: boolean;
  threshold?: number;
  rootMargin?: string;
}

interface UseInViewReturn {
  ref: (node: Element | null) => void;
  inView: boolean;
}

export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
  const { triggerOnce = false, threshold = 0, rootMargin } = options;
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);
  const frozenRef = useRef(false);

  const ref = useCallback(
    (node: Element | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = node;

      if (!node || frozenRef.current) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const isIntersecting = entry.isIntersecting;
          setInView(isIntersecting);

          if (isIntersecting && triggerOnce) {
            frozenRef.current = true;
            observerRef.current?.disconnect();
            observerRef.current = null;
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [triggerOnce, threshold, rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, inView };
}
