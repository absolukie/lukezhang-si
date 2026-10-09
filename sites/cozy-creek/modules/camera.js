// Cinematic dolly along the creek + orbit handoff on user drag.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { creekX, waterY } from './creek.js';

export function createCameraRig(renderer) {
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1200);
  // corridor: rides the east bank, gentle weave; always looks at the creek ahead
  const pts = [];
  for (let z = -108; z <= 118; z += 14) {
    const cx = creekX(z);
    pts.push(new THREE.Vector3(
      cx + 11 + Math.sin(z * 0.04) * 3,
      waterY(z) + 5.5 + Math.sin(z * 0.03) * 1.2,
      z - 14
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 4; controls.maxDistance = 90;
  controls.target.set(creekX(0), waterY(0) + 2, 0);
  controls.enabled = false;

  let t = 0, cinematic = true;
  const SPEED = 0.0085;
  const lookAhead = new THREE.Vector3(), camPos = new THREE.Vector3();

  // user takes over on first drag
  renderer.domElement.addEventListener('pointerdown', () => {
    if (cinematic) {
      cinematic = false;
      const p = curve.getPointAt(t);
      controls.target.set(p.x, p.y - 3, p.z + 18);
      camera.position.copy(p);
      controls.enabled = true;
      controls.update();
      document.body.classList.add('user-cam');
    }
  });
  function resumeCinematic() {
    // re-seed t from nearest curve point to current target
    let best = 0, bd = 1e9;
    for (let i = 0; i <= 200; i++) {
      const tt = i / 200, p = curve.getPointAt(tt);
      const d = p.distanceToSquared(controls.target);
      if (d < bd) { bd = d; best = tt; }
    }
    t = best; cinematic = true; controls.enabled = false;
    document.body.classList.remove('user-cam');
  }
  function update(dt) {
    if (cinematic) {
      t = (t + dt * SPEED) % 1;
      curve.getPointAt(t, camPos);
      // look at the creek itself, ahead of the camera
      const ahead = camPos.z + 38;
      lookAhead.set(creekX(ahead), waterY(ahead) + 2.2, ahead);
      camera.position.lerp(camPos, 1 - Math.exp(-dt * 2.2));
      const cur = new THREE.Vector3();
      camera.getWorldDirection(cur);
      const want = lookAhead.clone().sub(camera.position).normalize();
      cur.lerp(want, 1 - Math.exp(-dt * 2.6)).normalize();
      camera.lookAt(camera.position.clone().add(cur));
    } else {
      controls.update();
    }
  }
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  // debug hook for QA screenshots
  const api = { camera, update, resize, resumeCinematic, isCinematic: () => cinematic };
  api.setT = (v) => { t = v; };
  // seed camera on the path
  curve.getPointAt(0, camPos);
  camera.position.copy(camPos);
  return api;
}
