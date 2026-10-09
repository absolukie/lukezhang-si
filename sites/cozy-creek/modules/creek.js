// Shared creek math + JS noise. Single source of truth for terrain, water, rocks, camera.
export function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v; // 0..1
}
export function sstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
// Creek centerline: gentle S-curve down the valley (z axis = downstream).
export function creekX(z) {
  return 16 * Math.sin(z * 0.018) + 7 * Math.sin(z * 0.045 + 1.7);
}
// Cascade lips (z positions). Each drops the creek by STEP_H.
export const STEPS = [-62, -12, 42, 92];
export const STEP_H = 1.7;
export function stepDrop(z) {
  let d = 0;
  for (const s of STEPS) d += STEP_H * sstep(s - 7, s + 7, z);
  return d;
}
export function waterY(z) { return 0.55 - stepDrop(z); }
export function groundHeight(x, z) {
  const cx = creekX(z);
  const d = Math.abs(x - cx);
  const drop = stepDrop(z);
  let h = -0.45 - drop;                       // creek bed
  h += 13 * Math.pow(sstep(2.5, 34, d), 1.4); // banks
  h += 30 * Math.pow(sstep(30, 100, d), 1.6); // valley walls
  h += (noise2(x * 0.045, z * 0.045) * 2.4 + noise2(x * 0.13 + 7.3, z * 0.13) * 0.7 - 1.55)
       * sstep(2.5, 12, d);                   // detail, suppressed in channel
  return h;
}
// Shared GLSL noise chunk for shaders.
export const GLSL_NOISE = `
float chash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float cnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(chash(i), chash(i+vec2(1.,0.)), u.x),
             mix(chash(i+vec2(0.,1.)), chash(i+vec2(1.,1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*cnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;
