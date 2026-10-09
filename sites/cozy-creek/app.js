// Cozy Creek — real-time 3D forest creek. Fully procedural, zero external requests.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildTerrain } from './modules/terrain.js';
import { buildWater } from './modules/water.js';
import { buildRocks } from './modules/rocks.js';
import { buildGrass, buildFerns, buildBushes, buildPines } from './modules/plants.js';
import { buildBridgeAndCabin } from './modules/structures.js';
import { buildSky } from './modules/sky.js';
import { createLighting } from './modules/lighting.js';
import { buildRain, buildFireflies } from './modules/effects.js';
import { createAmbience } from './modules/audio.js';
import { createCameraRig } from './modules/camera.js';

const MOBILE = Math.min(innerWidth, innerHeight) < 700 || innerWidth < 768;
const container = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const uTime = { value: 0 };

// world
scene.add(buildTerrain());
const water = buildWater(); scene.add(water.mesh);
scene.add(buildRocks(MOBILE ? 150 : 260));
scene.add(buildGrass(MOBILE ? 1500 : 3200, uTime));
scene.add(buildFerns(MOBILE ? 320 : 700, uTime));
scene.add(buildBushes(MOBILE ? 28 : 46));
scene.add(buildPines(MOBILE ? 40 : 64));
const cabin = buildBridgeAndCabin(); scene.add(cabin.group);
const sky = buildSky(); scene.add(sky.mesh);
const rain = buildRain(MOBILE ? 700 : 1400); scene.add(rain.points);
const fireflies = buildFireflies(MOBILE ? 50 : 90); scene.add(fireflies.points);

const rig = createCameraRig(renderer);
window.__rig = rig; // QA debug hook
const lighting = createLighting(scene, sky.uniforms, water.uniforms, cabin);

// post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, rig.camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.65, 0.82);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
let bloomOn = true;

// audio
const ambience = createAmbience();

// UI
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
$$('#timeRow .pill').forEach(btn => btn.addEventListener('click', () => {
  $$('#timeRow .pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  lighting.setPreset(btn.dataset.t);
}));
$('#bloomBtn').addEventListener('click', (e) => {
  bloomOn = !bloomOn;
  e.currentTarget.classList.toggle('active', bloomOn);
});
$('#rainBtn').addEventListener('click', (e) => {
  rain.points.visible = !rain.points.visible;
  e.currentTarget.classList.toggle('active', rain.points.visible);
});
$('#musicBtn').addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('active', ambience.toggle());
});
$('#cinematicBtn').addEventListener('click', () => rig.resumeCinematic());

addEventListener('resize', () => {
  rig.resize();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// main loop
const clock = new THREE.Clock();
let frames = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  uTime.value = t;
  water.uniforms.uTime.value = t;
  sky.uniforms.uTime.value = t;
  fireflies.uniforms.uTime.value = t;
  lighting.update(dt, renderer);
  fireflies.uniforms.uNight.value = lighting.getNight();
  rain.update(dt, rig.camera.position.x, rig.camera.position.z);
  rig.update(dt);
  if (bloomOn) composer.render(); else renderer.render(scene, rig.camera);
  if (++frames === 4) document.getElementById('loader').classList.add('done');
}
animate();
