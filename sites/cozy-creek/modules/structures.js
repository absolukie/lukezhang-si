// Stone arch bridge + wooden cabin with glowing windows.
import * as THREE from 'three';
import { creekX, waterY, groundHeight } from './creek.js';

export function buildBridgeAndCabin() {
  const group = new THREE.Group();
  const z = 20, cx = creekX(z);
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a958a, roughness: 0.95 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x7d786d, roughness: 0.95 });
  // arch: half-torus spanning the creek
  const arch = new THREE.Mesh(new THREE.TorusGeometry(5.2, 1.35, 10, 24, Math.PI), stone);
  arch.position.set(cx, waterY(z) - 0.6, z);
  arch.castShadow = arch.receiveShadow = true;
  group.add(arch);
  // spandrel walls + deck
  const deckY = waterY(z) + 4.6;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(15.5, 1.1, 4.6), stoneDark);
  deck.position.set(cx, deckY, z);
  deck.castShadow = deck.receiveShadow = true;
  group.add(deck);
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(15.5, 2.2, 0.7), stone);
    wall.position.set(cx, waterY(z) + 2.4, z + s * 2.6);
    wall.castShadow = wall.receiveShadow = true;
    group.add(wall);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.5, 0.9), stoneDark);
    rail.position.set(cx, deckY + 1.15, z + s * 1.95);
    rail.castShadow = true;
    group.add(rail);
  }
  // abutments into the banks
  for (const s of [-1, 1]) {
    const bx = cx + s * 8.6;
    const ab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7, 5.4), stoneDark);
    ab.position.set(bx, groundHeight(bx, z) + 2.2, z);
    ab.castShadow = ab.receiveShadow = true;
    group.add(ab);
  }
  // cabin on the bridge
  const wood = new THREE.MeshStandardMaterial({ color: 0x6e5138, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x4c3826, roughness: 0.9 });
  const cab = new THREE.Group();
  const hutW = 4.6, hutH = 2.7, hutD = 3.6;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(hutW, hutH, hutD), wood);
  walls.position.y = hutH / 2;
  walls.castShadow = walls.receiveShadow = true;
  cab.add(walls);
  const roofGeo = new THREE.CylinderGeometry(0.01, 3.4, 1.9, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(1, 1, 0.82);
  const roof = new THREE.Mesh(roofGeo, woodDark);
  roof.position.y = hutH + 0.95;
  roof.castShadow = true;
  cab.add(roof);
  // windows: emissive planes, glow at night
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x2b2118, emissive: 0xffb45e, emissiveIntensity: 0.0, roughness: 0.4
  });
  const win1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), winMat);
  win1.position.set(-0.9, 1.6, hutD / 2 + 0.02);
  const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), winMat);
  win2.position.set(0.9, 1.6, hutD / 2 + 0.02);
  const win3 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), winMat);
  win3.position.set(hutW / 2 + 0.02, 1.6, 0);
  win3.rotation.y = Math.PI / 2;
  cab.add(win1, win2, win3);
  // door
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), woodDark);
  door.position.set(0, 0.95, -hutD / 2 - 0.02);
  door.rotation.y = Math.PI;
  cab.add(door);
  cab.position.set(cx - 2.5, deckY + 0.55, z);
  group.add(cab);
  // lantern lights (intensity animated by night factor)
  const lamp1 = new THREE.PointLight(0xffa54e, 0, 26, 1.8);
  lamp1.position.set(cx - 2.5, deckY + 2.6, z + 1.2);
  const lamp2 = new THREE.PointLight(0xffa54e, 0, 22, 1.8);
  lamp2.position.set(cx + 3.4, deckY + 2.2, z - 1.6);
  group.add(lamp1, lamp2);
  return { group, winMat, lamps: [lamp1, lamp2] };
}
