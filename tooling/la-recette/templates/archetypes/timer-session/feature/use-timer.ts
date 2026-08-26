// Archétype timer-session — le cœur : un minuteur de séance robuste.
//
// Clé de fiabilité : on mémorise l'HEURE DE FIN (`endAt`) plutôt que de décrémenter un
// compteur. Ainsi le temps reste JUSTE même si l'app passe en arrière-plan, si un tick est
// throttlé, ou si le JS se met en pause — on recalcule toujours depuis l'horloge réelle.
// Rappelle `onComplete(secondes écoulées)` à la fin (l'écran y enregistre la séance).
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

export function useTimer(onComplete: (elapsedSeconds: number) => void) {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<TimerStatus>('idle');

  const endAtRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Réf pour éviter une closure périmée sur `onComplete`.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (endAtRef.current == null) return;
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      clearTick();
      endAtRef.current = null;
      setStatus('done');
      onCompleteRef.current(durationRef.current);
    }
  }, [clearTick]);

  const start = useCallback(
    (seconds: number) => {
      clearTick();
      durationRef.current = seconds;
      setDurationSeconds(seconds);
      setRemaining(seconds);
      endAtRef.current = Date.now() + seconds * 1000;
      setStatus('running');
      intervalRef.current = setInterval(tick, 250);
    },
    [clearTick, tick],
  );

  const pause = useCallback(() => {
    if (status !== 'running') return;
    clearTick();
    setStatus('paused');
  }, [status, clearTick]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    endAtRef.current = Date.now() + remaining * 1000;
    setStatus('running');
    intervalRef.current = setInterval(tick, 250);
  }, [status, remaining, tick]);

  const reset = useCallback(() => {
    clearTick();
    endAtRef.current = null;
    durationRef.current = 0;
    setStatus('idle');
    setRemaining(0);
    setDurationSeconds(0);
  }, [clearTick]);

  // Recale à la reprise du premier plan (un interval en arrière-plan est throttlé par iOS).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && status === 'running') tick();
    });
    return () => sub.remove();
  }, [status, tick]);

  // Nettoyage au démontage.
  useEffect(() => clearTick, [clearTick]);

  return { status, remaining, durationSeconds, start, pause, resume, reset };
}
