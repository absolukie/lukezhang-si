// Rain streaks + fireflies (night).
import * as THREE from 'three';

export function buildRain(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = Math.random() * 45;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = 8; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(180,200,220,0)');
  grad.addColorStop(0.5, 'rgba(180,200,220,0.7)');
  grad.addColorStop(1, 'rgba(180,200,220,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 8, 64);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.PointsMaterial({
    size: 1.6, map: tex, transparent: true, opacity: 0.55,
    depthWrite: false, color: 0xaec6d8, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.visible = false;
  pts.frustumCulled = false;
  return {
    points: pts,
    update(dt, cx, cz) {
      if (!pts.visible) return;
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 34;
        if (y < 0) {
          y = 45;
          p.setX(i, cx + (Math.random() - 0.5) * 90);
          p.setZ(i, cz + (Math.random() - 0.5) * 90);
        }
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
  };
}

export function buildFireflies(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 70;
    pos[i * 3 + 1] = 1 + Math.random() * 6;
    pos[i * 3 + 2] = -110 + Math.random() * 220;
    seed[i] = Math.random() * 100;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = { uTime: { value: 0 }, uNight: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed; varying float vA;
      uniform float uTime, uNight;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.7 + aSeed)*1.6;
        p.y += sin(uTime*1.1 + aSeed*1.7)*0.9;
        p.z += cos(uTime*0.5 + aSeed)*1.6;
        vA = uNight * (0.35 + 0.65*pow(0.5+0.5*sin(uTime*2.2+aSeed*3.0), 2.0));
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = 130.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vA;
        gl_FragColor = vec4(1.0, 0.85, 0.45, a);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { points: pts, uniforms };
}
