export const getVertexSource = (height: number) => `
precision mediump float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute vec4 orientation;
attribute float halfRootAngleSin;
attribute float halfRootAngleCos;
attribute float stretch;
uniform float time;
varying vec2 vUv;
varying float frc;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
}

vec4 slerp(vec4 v0, vec4 v1, float t) {
  normalize(v0);
  normalize(v1);
  float dot_ = dot(v0, v1);
  if (dot_ < 0.0) {
    v1 = -v1;
    dot_ = -dot_;
  }
  const float DOT_THRESHOLD = 0.9995;
  if (dot_ > DOT_THRESHOLD) {
    vec4 result = t * (v1 - v0) + v0;
    normalize(result);
    return result;
  }
  float theta_0 = acos(dot_);
  float theta = theta_0 * t;
  float sin_theta = sin(theta);
  float sin_theta_0 = sin(theta_0);
  float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
  float s1 = sin_theta / sin_theta_0;
  return (s0 * v0) + (s1 * v1);
}

void main() {
  frc = position.y / float(${height});
  float noise = 1.0 - snoise(vec2((time - offset.x / 50.0), (time - offset.z / 50.0)));
  vec4 direction = vec4(0.0, halfRootAngleSin, 0.0, halfRootAngleCos);
  direction = slerp(direction, orientation, frc);
  vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
  vPosition = rotateVectorByQuaternion(vPosition, direction);
  float halfAngle = noise * 0.15;
  vPosition = rotateVectorByQuaternion(
    vPosition,
    normalize(vec4(sin(halfAngle), 0.0, -sin(halfAngle), cos(halfAngle)))
  );
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
}
`

export const fragmentSource = `
precision mediump float;
varying vec2 vUv;
varying float frc;

void main() {
  float alphaShape = smoothstep(0.48, 0.0, abs(vUv.x - 0.5));
  float alphaTip = smoothstep(1.0, 0.15, vUv.y);
  float alpha = alphaShape * alphaTip;
  if (alpha < 0.12) {
    discard;
  }

  vec3 rootColor = vec3(0.03, 0.16, 0.02);
  vec3 midColor = vec3(0.10, 0.45, 0.06);
  vec3 tipColor = vec3(0.35, 0.72, 0.20);
  vec3 col = mix(rootColor, midColor, frc);
  col = mix(col, tipColor, smoothstep(0.55, 1.0, frc));
  gl_FragColor = vec4(col, alpha);
}
`
