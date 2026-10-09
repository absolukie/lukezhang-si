// Instanced river rocks: displaced icosahedrons scattered along the creek.
import * as THREE from 'three';
import { creekX, waterY, groundHeight, noise2 } from './creek.js';

export function buildRocks(count) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + (noise2(v.x * 1.3 + 9, v.y * 1.3 + v.z) - 0.5) * 0.55;
    v.multiplyScalar(n);
    v.y *= 0.72; // squashed river-stone profile
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.02 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const s = new THREE.Vector3(), col = new THREE.Color();
  const palette = [0xd8d2c2, 0xc9bfa8, 0xb0a894, 0x9a938a, 0xe2dccb];
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 40) {
    const z = -125 + Math.random() * 260;
    const side = Math.random() < 0.5 ? -1 : 1;
    const off = 2.2 + Math.pow(Math.random(), 1.6) * 26;
    const x = creekX(z) + side * off;
    const inCreek = Math.random() < 0.22;
    const px = inCreek ? creekX(z) + (Math.random() - 0.5) * 5 : x;
    if (!inCreek && Math.abs(px - (creekX(z) + 11)) < 5.5) continue; // camera corridor
    const y = inCreek ? waterY(z) - 0.25 + Math.random() * 0.5 : groundHeight(px, z) - 0.15;
    const sc = 0.35 + Math.pow(Math.random(), 2.2) * 2.1;
    e.set(Math.random() * 0.6, Math.random() * Math.PI * 2, Math.random() * 0.6);
    q.setFromEuler(e);
    s.set(sc * (0.8 + Math.random() * 0.5), sc * (0.6 + Math.random() * 0.4), sc * (0.8 + Math.random() * 0.5));
    m.compose(new THREE.Vector3(px, y, z), q, s);
    mesh.setMatrixAt(placed, m);
    col.setHex(palette[(Math.random() * palette.length) | 0]);
    col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
