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
  float phase = time + (offset.x * 0.03) + (offset.z * 0.035);
  float noise = 0.5 + 0.5 * sin(phase) + 0.12 * sin(phase * 1.7 + offset.x * 0.02);
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
