import { useEffect } from 'react'

// Utilidades del dispositivo para la sesión de gym: pantalla encendida y aviso sonoro.

/** Mantiene la pantalla encendida mientras el componente esté montado (Screen Wake Lock). */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    let cancelled = false
    const request = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      navigator.wakeLock.request('screen').then(
        (sentinel) => {
          if (cancelled) sentinel.release()
          else lock = sentinel
        },
        () => {},
      )
    }
    // iOS libera el wake lock al pasar a segundo plano; se pide de nuevo al volver.
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      lock?.release()
    }
  }, [])
}

let audio: AudioContext | undefined

/** iOS solo deja sonar audio creado tras un toque del usuario: llamar desde un onClick. */
export function unlockAudio() {
  // 'transient' baja un momento la música en vez de cortarla, y suena con el modo silencio.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'transient'
  audio ??= new AudioContext()
  if (audio.state === 'suspended') audio.resume()
}

/** Tres pitidos cortos al terminar el descanso. */
export function beep() {
  if (!audio) return
  const start = audio.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, start + i * 0.25)
    gain.gain.exponentialRampToValueAtTime(0.001, start + i * 0.25 + 0.18)
    osc.connect(gain).connect(audio.destination)
    osc.start(start + i * 0.25)
    osc.stop(start + i * 0.25 + 0.2)
  }
}
