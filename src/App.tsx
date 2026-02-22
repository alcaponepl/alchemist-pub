import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { Suspense, useState } from 'react'
import { DigitalTwinScene } from './components/DigitalTwinScene'

const createWebGpuRenderer = async (props: Record<string, unknown>) => {
  const { WebGPURenderer } = await import('three/webgpu')
  const renderer = new WebGPURenderer({
    ...(props as object),
    antialias: true,
    alpha: false,
  })
  await renderer.init()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  return renderer
}

const App = () => {
  const [renderer, setRenderer] = useState<'webgl' | 'webgpu'>('webgl')

  const { windSpeed, turbineCount } = useControls('Wind Farm', {
    windSpeed: { value: 7, min: 0, max: 25, step: 0.1, label: 'Wind Speed' },
    turbineCount: { value: 10, min: 1, max: 50, step: 1, label: 'Turbines' },
  })

  useControls('Renderer', {
    switch: {
      label: renderer === 'webgl' ? 'Switch to WebGPU' : 'Switch to WebGL',
      value: false,
      onChange: (v: boolean) => {
        if (v) {
          setRenderer((prev) => (prev === 'webgl' ? 'webgpu' : 'webgl'))
        }
      },
      transient: true,
    },
  })

  const webGlProps = {
    gl: {
      antialias: true,
      alpha: false,
      powerPreference: 'low-power' as const,
    },
  }

  const webGpuProps = {
    gl: createWebGpuRenderer,
  }

  return (
    <>
      <Leva collapsed={false} />
      <Canvas
        key={renderer}
        dpr={renderer === 'webgl' ? 1 : [1, 2]}
        camera={{ position: [40, 30, 50], fov: 45, near: 0.1, far: 500 }}
        {...(renderer === 'webgl' ? webGlProps : webGpuProps)}
      >
        <Suspense fallback={null}>
          <DigitalTwinScene windSpeed={windSpeed} turbineCount={turbineCount} />
        </Suspense>
      </Canvas>
      <div className="renderer-badge">{renderer.toUpperCase()}</div>
    </>
  )
}

export default App
