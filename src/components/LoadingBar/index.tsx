import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface ProgressBarProps {
  loading: boolean;
}

const ProgressBar = ({ loading }: ProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (loading) {
      cleanup();
      setProgress(0);
      setVisible(true);

      // Start incrementing progress
      let current = 0;
      intervalRef.current = setInterval(() => {
        current += (0.9 - current) * 0.1;
        if (current > 0.9) current = 0.9;
        setProgress(current);
      }, 200);
    } else if (visible) {
      cleanup();
      // Jump to 100% then fade out
      setProgress(1);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }

    return cleanup;
  }, [loading, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`fixed left-0 top-0 z-50 w-full transition-opacity duration-400 ease-out ${
        !visible ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="bg-indigo-400 transition-[width] duration-300"
        style={{
          height: '3px',
          width: `${progress * 100}%`,
        }}
      />
    </div>
  );
};

const MemoizedProgressBar = React.memo(ProgressBar);

const LoadingBar = (): React.ReactPortal | null => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleLoading = () => {
      setLoading(true);
    };
    const handleFinishedLoading = () => {
      setLoading(false);
    };
    router.events.on('routeChangeStart', handleLoading);
    router.events.on('routeChangeComplete', handleFinishedLoading);
    router.events.on('routeChangeError', handleFinishedLoading);

    return () => {
      router.events.off('routeChangeStart', handleLoading);
      router.events.off('routeChangeComplete', handleFinishedLoading);
      router.events.off('routeChangeError', handleFinishedLoading);
    };
  }, [router]);

  return mounted
    ? ReactDOM.createPortal(
        <MemoizedProgressBar loading={loading} />,
        document.body
      )
    : null;
};

export default LoadingBar;
