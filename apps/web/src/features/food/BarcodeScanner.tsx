import { useEffect, useRef, useState } from 'react'
import { Block } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

// El lector (WebAssembly) va empaquetado con la app en vez de bajarse de un CDN: así lo precachea
// el service worker y funciona sin conexión con los alimentos ya guardados.
prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } })

const SCAN_EVERY_MS = 200

// Cámara trasera que lee códigos EAN/UPC (los de los productos del súper) y avisa con el primero.
export function BarcodeScanner({ onDetect }: { onDetect: (code: string) => void }) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect
  const [error, setError] = useState(false)

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | undefined
    const stop = () => stream?.getTracks().forEach((track) => track.stop())
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })!

    async function scan() {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      const video = videoRef.current
      if (stopped || !video) return stop()
      video.srcObject = stream
      await video.play()
      while (!stopped) {
        if (video.videoWidth) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0)
          const [result] = await readBarcodes(context.getImageData(0, 0, canvas.width, canvas.height), {
            formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'],
            maxNumberOfSymbols: 1,
          })
          if (result && !stopped) {
            stop()
            return onDetectRef.current(result.text)
          }
        }
        await new Promise((resolve) => setTimeout(resolve, SCAN_EVERY_MS))
      }
    }

    scan().catch(() => !stopped && setError(true))
    return () => {
      stopped = true
      stop()
    }
  }, [])

  if (error) return <Block className="text-center text-[15px] text-label-2">{t('food.cameraError')}</Block>

  return (
    <Block>
      <div className="relative overflow-hidden rounded-2xl bg-surface">
        <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover" />
        <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-danger/80" />
      </div>
      <p className="mt-3 text-center text-[15px] text-label-2">{t('food.scanHint')}</p>
    </Block>
  )
}
