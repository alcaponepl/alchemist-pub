import { useEffect, useState } from 'react'

type WasmBridge = {
  update_turbines: (
    currentRotations: Float32Array<ArrayBufferLike>,
    windSpeed: number,
    delta: number,
  ) => Float32Array<ArrayBufferLike>
}

let wasmInitPromise: Promise<WasmBridge | null> | null = null

const initWasmBridge = async (): Promise<WasmBridge | null> => {
  if (!wasmInitPromise) {
    wasmInitPromise = (async () => {
      try {
        const wasmEntry = '/src-rust/pkg/wind_twin.js'
        const mod = await import(/* @vite-ignore */ wasmEntry)
        if (typeof mod.default === 'function') {
          await mod.default()
        }
        return mod as WasmBridge
      } catch (error) {
        console.warn(
          'Wasm package not found or failed to initialize. Run: npm run wasm:build',
          error,
        )
        return null
      }
    })()
  }

  return wasmInitPromise
}

export const useWasm = () => {
  const [bridge, setBridge] = useState<WasmBridge | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    initWasmBridge().then((loadedBridge) => {
      if (!isMounted) {
        return
      }

      setBridge(loadedBridge)
      setIsReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { bridge, isReady }
}
