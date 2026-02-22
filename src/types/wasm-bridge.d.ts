declare module '/src-rust/pkg/wind_twin.js' {
  export default function init(input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module): Promise<void>

  export function update_turbines(
    currentRotations: Float32Array<ArrayBufferLike>,
    windSpeed: number,
    delta: number,
  ): Float32Array<ArrayBufferLike>
}
