import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import LoadingScreen from '../components/LoadingScreen';
import { useAppFonts } from '../constants/fonts';
import { useLoreStore } from '../store/useLoreStore';

const MIN_MS = 1800;
const FONT_MAX_MS = 5000;
const HARD_MAX_MS = 8000;

function waitForHydration(onReady) {
  if (useLoreStore.persist.hasHydrated()) {
    onReady();
    return () => {};
  }

  const unsub = useLoreStore.persist.onFinishHydration(onReady);
  const poll = setInterval(() => {
    if (useLoreStore.persist.hasHydrated()) {
      onReady();
      clearInterval(poll);
    }
  }, 150);

  return () => {
    unsub();
    clearInterval(poll);
  };
}

export default function SplashRoute() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [hydrated, setHydrated] = useState(
    () => useLoreStore.persist.hasHydrated()
  );
  const [minElapsed, setMinElapsed] = useState(false);
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [forceProceed, setForceProceed] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigated = useRef(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), FONT_MAX_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setForceProceed(true), HARD_MAX_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => waitForHydration(() => setHydrated(true)), []);

  const fontsReady = fontsLoaded || fontTimedOut || forceProceed;
  const dataReady = hydrated || forceProceed;
  const ready = minElapsed && fontsReady && dataReady;

  useEffect(() => {
    const tick = setInterval(() => {
      const steps = [minElapsed, fontsReady, dataReady].filter(Boolean).length;
      const elapsed = Date.now() - startTime.current;
      const timeBoost = Math.min(0.2, (elapsed / HARD_MAX_MS) * 0.2);
      const next = ready
        ? 1
        : Math.min(0.92, (steps / 3) * 0.72 + timeBoost);
      setProgress(next);
    }, 80);

    return () => clearInterval(tick);
  }, [minElapsed, fontsReady, dataReady, ready]);

  useEffect(() => {
    if (!ready || navigated.current) return;

    setProgress(1);
    navigated.current = true;

    const t = setTimeout(() => {
      router.replace('/(tabs)');
    }, 120);

    return () => clearTimeout(t);
  }, [ready, router]);

  return <LoadingScreen fontsReady={fontsLoaded} progress={progress} />;
}
