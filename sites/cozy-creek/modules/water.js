// Creek water: ribbon mesh + custom shader (flow, fresnel sky reflection,
// sun glints, foam at cascade lips and banks). Fog-aware.
import * as THREE from 'three';
import { creekX, waterY, STEPS, GLSL_NOISE } from './creek.js';

export function buildWater() {
  const HALF_W = 3.4, Z0 = -130, Z1 = 140, NZ = 160, NX = 10;
  const verts = [], uvs = [], idx = [];
  for (let j = 0; j <= NZ; j++) {
    const z = Z0 + (Z1 - Z0) * (j / NZ);
    const cx = creekX(z), y = waterY(z);
    for (let i = 0; i <= NX; i++) {
      const u = i / NX;
      verts.push(cx + (u - 0.5) * 2 * HALF_W, y, z);
      uvs.push(u, z);
    }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
      uSunColor: { value: new THREE.Color(0xfff2d8) },
      uDeep: { value: new THREE.Color(0x17453a) },
      uShallow: { value: new THREE.Color(0x69b394) },
      uSkyRef: { value: new THREE.Color(0x9fc8e8) },
      uSteps: { value: STEPS },
    }
  ]);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: `
      #include <fog_pars_vertex>
      varying vec3 vWorld; varying vec2 vUv;
      uniform float uTime;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.y += sin(uTime*2.0 + uv.y*0.35)*0.03 + sin(uTime*3.7 + uv.y*1.3)*0.015;
        vec4 wp = modelMatrix * vec4(p,1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      varying vec3 vWorld; varying vec2 vUv;
      uniform float uTime; uniform vec3 uSunDir, uSunColor, uDeep, uShallow, uSkyRef;
      uniform float uSteps[4];
      ${GLSL_NOISE}
      void main(){
        vec2 flowUv = vec2(vUv.x*3.0, vUv.y*0.55 - uTime*0.9);
        // animated ripple normal
        float e = 0.35;
        vec2 p = flowUv*3.0;
        float h0 = fbm(p + vec2(uTime*0.25, -uTime*0.55));
        float hx = fbm(p + vec2(e,0.0) + vec2(uTime*0.25, -uTime*0.55));
        float hy = fbm(p + vec2(0.0,e) + vec2(uTime*0.25, -uTime*0.55));
        vec3 N = normalize(vec3((h0-hx)*2.4, 1.0, (h0-hy)*2.4));
        vec3 V = normalize(cameraPosition - vWorld);
        // fresnel reflection of sky
        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        vec3 skyRef = mix(uSkyRef*0.55, uSkyRef*1.25, pow(R.y, 0.6));
        float fres = 0.04 + 0.96*pow(1.0 - max(dot(N,V),0.0), 3.0);
        // body color: shallow at banks, deep mid-creek
        float edge = smoothstep(0.5, 0.12, abs(vUv.x-0.5));
        vec3 body = mix(uDeep, uShallow, edge*0.85);
        body *= 0.85 + 0.3*h0;
        vec3 col = mix(body, skyRef, clamp(fres*0.9,0.0,1.0));
        // sun glints
        float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 220.0);
        float glint = pow(cnoise(flowUv*22.0 + uTime*1.5), 18.0);
        col += uSunColor * (spec*1.2 + glint*1.1);
        // foam: cascade lips + banks
        float foamBand = 0.0;
        for(int k=0;k<4;k++){
          float dz = abs(vUv.y - uSteps[k]);
          foamBand += smoothstep(5.0, 1.0, dz);
        }
        float foamN = fbm(vec2(vUv.x*14.0, vUv.y*1.4 - uTime*2.6));
        float foam = clamp(foamBand,0.0,1.0) * smoothstep(0.42, 0.8, foamN + foamBand*0.22);
        foam += smoothstep(0.03, 0.0, abs(vUv.x-0.5)-0.47) * smoothstep(0.45,0.85,fbm(flowUv*5.0+uTime*0.4));
        col = mix(col, vec3(0.96,0.97,0.95), clamp(foam,0.0,1.0)*0.75);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}
