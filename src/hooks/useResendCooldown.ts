import { useCallback, useEffect, useState } from 'react';

export function useResendCooldown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const start = useCallback((secs: number) => setSeconds(Math.max(0, secs)), []);

  return { seconds, canResend: seconds === 0, start };
}
