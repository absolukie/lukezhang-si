// Vegetation: instanced grass tufts + ferns (wind-swayed), bushes, pine trees.
import * as THREE from 'three';
import { creekX, groundHeight, noise2 } from './creek.js';

function bladeTexture(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function grassDraw(g) {
  g.strokeStyle = '#ffffff'; g.lineCap = 'round';
  for (let i = 0; i < 44; i++) {
    const x = 8 + Math.random() * 112, bend = (Math.random() - 0.5) * 40;
    g.lineWidth = 1.6 + Math.random() * 2.2;
    g.beginPath(); g.moveTo(x, 128);
    g.quadraticCurveTo(x + bend * 0.4, 70, x + bend, 26 + Math.random() * 30);
    g.stroke();
  }
}
function fernDraw(g) {
  g.strokeStyle = '#ffffff'; g.lineCap = 'round';
  for (let f = 0; f < 9; f++) {
    const cx = 14 + f * 12, lean = (f - 4) * 8;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, y = 124 - t * 100, x = cx + lean * t;
      const w = 13 * (1 - t * 0.85);
      g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y); g.stroke();
    }
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, 126); g.quadraticCurveTo(cx + lean * 0.5, 70, cx + lean, 26); g.stroke();
  }
}
function windify(mat, uTime, strength) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec4 ipos = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
        float ph = ipos.x*1.71 + ipos.z*2.33;
        float sw = sin(uTime*1.9+ph)*0.6 + sin(uTime*3.9+ph*1.31)*0.25;
        float bendAmt = clamp(position.y, 0.0, 1.5) * ${strength.toFixed(3)};
        transformed.x += sw * bendAmt;
        transformed.z += sw * bendAmt * 0.6;
      #endif`
    );
  };
}
function tuftGeometry() {
  const g1 = new THREE.PlaneGeometry(1.4, 1.1);
  g1.translate(0, 0.55, 0);
  const g2 = g1.clone(); g2.rotateY(Math.PI / 2);
  // merge manually
  const merged = new THREE.BufferGeometry();
  const a = g1.attributes, b = g2.attributes;
  const pos = new Float32Array(a.position.count * 3 + b.position.count * 3);
  const uv = new Float32Array(a.uv.count * 2 + b.uv.count * 2);
  const idx = [];
  pos.set(a.position.array, 0); pos.set(b.position.array, a.position.array.length);
  uv.set(a.uv.array, 0); uv.set(b.uv.array, a.uv.array.length);
  const ia = g1.index.array, ib = g2.index.array;
  for (const i of ia) idx.push(i);
  for (const i of ib) idx.push(i + a.position.count);
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length), 3));
  merged.setIndex(idx);
  merged.computeVertexNormals();
  return merged;
}
function scatterTufts(count, tex, tint1, tint2, uTime, sMin, sMax, nearCreek) {
  const geo = tuftGeometry();
  const mat = new THREE.MeshLambertMaterial({
    map: tex, alphaTest: 0.42, side: THREE.DoubleSide, transparent: false,
  });
  windify(mat, uTime, 0.16);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 30) {
    const z = -125 + Math.random() * 260;
    const side = Math.random() < 0.5 ? -1 : 1;
    const off = nearCreek ? 3.0 + Math.random() * 9 : 6 + Math.pow(Math.random(), 1.5) * 42;
    const x = creekX(z) + side * off;
    // camera corridor: keep it low instead of bare
    let s = sMin + Math.random() * (sMax - sMin);
    if (Math.abs(x - (creekX(z) + 11)) < 7) s *= 0.38;
    const y = groundHeight(x, z);
    if (y < -2) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    m.compose(new THREE.Vector3(x, y - 0.05, z), q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s));
    mesh.setMatrixAt(placed, m);
    col.setHex(tint1).lerp(new THREE.Color(tint2), Math.random());
    col.offsetHSL((Math.random() - 0.5) * 0.03, 0, (Math.random() - 0.5) * 0.08);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
export function buildGrass(count, uTime) {
  return scatterTufts(count, bladeTexture(grassDraw), 0x3f6b2e, 0x6f9e4e, uTime, 0.6, 1.2, false);
}
export function buildFerns(count, uTime) {
  return scatterTufts(count, bladeTexture(fernDraw), 0x356427, 0x548c40, uTime, 0.8, 1.3, true);
}
export function buildBushes(count) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + (noise2(v.x * 2 + 4, v.z * 2 + v.y) - 0.5) * 0.5;
    p.setXYZ(i, v.x * n, v.y * n * 0.75, v.z * n);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 30) {
    const z = -125 + Math.random() * 260;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = creekX(z) + side * (7 + Math.random() * 38);
    if (Math.abs(x - (creekX(z) + 11)) < 5.5) continue; // camera corridor
    const y = groundHeight(x, z);
    const s = 0.9 + Math.random() * 2.2;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    m.compose(new THREE.Vector3(x, y + s * 0.35, z), q, new THREE.Vector3(s, s * 0.8, s));
    mesh.setMatrixAt(placed, m);
    col.setHex(0x3a6633).offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.09);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.castShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
export function buildPines(count) {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.6, 7);
  trunkGeo.translate(0, 1.3, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const coneGeo = new THREE.ConeGeometry(1, 1, 8);
  const coneMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const layers = 3;
  const canopies = new THREE.InstancedMesh(coneGeo, coneMat, count * layers);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  let ti = 0, ci = 0, guard = 0;
  while (ti < count && guard++ < count * 40) {
    const z = -130 + Math.random() * 270;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = creekX(z) + side * (26 + Math.random() * 60);
    const y = groundHeight(x, z);
    const s = 1.6 + Math.random() * 2.6;
    q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
    m.compose(new THREE.Vector3(x, y - 0.2, z), q, new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(ti, m);
    for (let l = 0; l < layers; l++) {
      const ly = y - 0.2 + s * (2.2 + l * 1.55);
      const lr = s * (2.5 - l * 0.62);
      m.compose(new THREE.Vector3(x, ly, z), q, new THREE.Vector3(lr, s * 1.9, lr));
      canopies.setMatrixAt(ci, m);
      col.setHex(0x2c5230).offsetHSL((Math.random() - 0.5) * 0.03, 0, (Math.random() - 0.5) * 0.07 - l * 0.015);
      canopies.setColorAt(ci, col);
      ci++;
    }
    ti++;
  }
  trunks.castShadow = true;
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  group.add(trunks, canopies);
  return group;
}
