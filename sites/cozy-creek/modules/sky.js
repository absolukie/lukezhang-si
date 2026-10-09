// Sky dome shader: gradient + sun glow + procedural stars. Fog-free.
import * as THREE from 'three';
import { GLSL_NOISE } from './creek.js';

export function buildSky() {
  const uniforms = {
    uTop: { value: new THREE.Color(0x6fa8dc) },
    uHorizon: { value: new THREE.Color(0xd8e8f2) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.55, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(0xfff1d6) },
    uNight: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop, uHorizon, uSunColor; uniform vec3 uSunDir;
      uniform float uNight, uTime;
      ${GLSL_NOISE}
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.12, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(max(h, 0.0), 0.55));
        if (d.y < 0.0) col = mix(uHorizon, uHorizon*0.55, clamp(-d.y*4.0,0.0,1.0));
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunColor * (pow(sd, 900.0)*3.0 + pow(sd, 18.0)*0.28) * (1.0-uNight*0.85);
        // stars
        if (d.y > 0.02 && uNight > 0.01) {
          vec2 sp = d.xz / (d.y + 0.25) * 90.0;
          vec2 cell = floor(sp); vec2 f = fract(sp);
          float star = step(0.992, chash(cell)) * smoothstep(0.25, 0.05, length(f - 0.5));
          float tw = 0.6 + 0.4*sin(uTime*2.5 + chash(cell+7.0)*40.0);
          col += vec3(0.9, 0.94, 1.0) * star * tw * uNight;
        }
        // subtle drifting clouds
        float cl = fbm(d.xz/(abs(d.y)+0.35)*1.6 + vec2(uTime*0.004, 0.0));
        float cmask = smoothstep(0.52, 0.78, cl) * smoothstep(0.0, 0.25, d.y) * (1.0-uNight*0.9);
        col = mix(col, vec3(1.0,0.99,0.97), cmask*0.5);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 20), mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}
