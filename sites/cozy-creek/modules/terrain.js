// Valley terrain: heightfield with winding creek channel, vertex-colored.
import * as THREE from 'three';
import { groundHeight, creekX, noise2, sstep } from './creek.js';

export function buildTerrain() {
  const W = 260, D = 300, SX = 170, SZ = 200;
  const geo = new THREE.PlaneGeometry(W, D, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cGrass1 = new THREE.Color(0x3f7031), cGrass2 = new THREE.Color(0x6da24c);
  const cRock = new THREE.Color(0x8d877a), cSand = new THREE.Color(0xc9b384);
  const cMoss = new THREE.Color(0x557d33);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i) - 10; // shift valley slightly
    const h = groundHeight(x, z);
    pos.setY(i, h);
    pos.setZ(i, z);
    // color by zone
    const cx = creekX(z);
    const d = Math.abs(x - cx);
    const n = noise2(x * 0.06 + 3.1, z * 0.06);
    const n2 = noise2(x * 0.018 + 11.7, z * 0.018 + 5.2);
    tmp.copy(cGrass1).lerp(cGrass2, n * n * 1.4 > 1 ? 1 : n * n * 1.4);
    if (n2 > 0.62) tmp.lerp(new THREE.Color(0x8a9a4e), (n2 - 0.62) * 1.8); // dry patches
    if (n > 0.62) tmp.lerp(cMoss, 0.5);                    // moss patches
    const sandW = 1 - sstep(2.0, 3.6, d);
    tmp.lerp(cSand, sandW * 0.85);                         // sandy creek edge
    pos.setZ(i, z);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  // rock blend on steep slopes (second pass, needs normals)
  const nrm = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const steep = 1 - nrm.getY(i); // 0 flat .. ~1 vertical
    const rockW = sstep(0.18, 0.42, steep);
    if (rockW > 0) {
      const j = i * 3;
      colors[j] = colors[j] * (1 - rockW) + cRock.r * rockW;
      colors[j + 1] = colors[j + 1] * (1 - rockW) + cRock.g * rockW;
      colors[j + 2] = colors[j + 2] * (1 - rockW) + cRock.b * rockW;
    }
  }
  geo.attributes.color.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1.0, metalness: 0.0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
