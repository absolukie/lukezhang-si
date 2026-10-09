// Time-of-day lighting presets with smooth transitions.
import * as THREE from 'three';

const PRESETS = {
  morn: {
    sunColor: 0xffd9a6, sunI: 2.6, sunPos: [46, 26, -30],
    hemiSky: 0xbcd6f2, hemiGround: 0x5f7048, hemiI: 0.75,
    fog: 0xe6d6bc, fogD: 0.0075, exposure: 1.0,
    skyTop: 0x6fa8dc, skyHor: 0xf2ddba, night: 0,
    waterSky: 0xa8cbe8, lamp: 0, winGlow: 0.15, firefly: 0,
  },
  noon: {
    sunColor: 0xfff4e2, sunI: 3.1, sunPos: [12, 70, 8],
    hemiSky: 0xcfe4ff, hemiGround: 0x66795a, hemiI: 0.9,
    fog: 0xd4e6ef, fogD: 0.006, exposure: 1.06,
    skyTop: 0x3f8fe0, skyHor: 0xc4e2f2, night: 0,
    waterSky: 0x9fc8e8, lamp: 0, winGlow: 0.0, firefly: 0,
  },
  night: {
    sunColor: 0x9db8ff, sunI: 0.55, sunPos: [-30, 42, -20],
    hemiSky: 0x2a3a5f, hemiGround: 0x1a2418, hemiI: 0.5,
    fog: 0x0e1830, fogD: 0.011, exposure: 0.92,
    skyTop: 0x050912, skyHor: 0x22345a, night: 1,
    waterSky: 0x2a3f66, lamp: 55, winGlow: 2.6, firefly: 1,
  },
};

export function createLighting(scene, skyU, waterU, cabin) {
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(46, 26, -30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xbcd6f2, 0x5f7048, 0.75);
  scene.add(hemi);
  scene.fog = new THREE.FogExp2(0xe6d6bc, 0.0075);

  const cur = JSON.parse(JSON.stringify(PRESETS.morn, (k, v) => v));
  // work in linear-friendly color objects
  const cols = {};
  for (const k of ['sunColor', 'hemiSky', 'hemiGround', 'fog', 'skyTop', 'skyHor', 'waterSky'])
    cols[k] = new THREE.Color(PRESETS.morn[k]);
  const tgt = { cols: {}, nums: {} };
  let curNums = {};
  for (const k of ['sunI', 'hemiI', 'fogD', 'exposure', 'night', 'lamp', 'winGlow', 'firefly'])
    curNums[k] = PRESETS.morn[k];
  const curSunPos = new THREE.Vector3(...PRESETS.morn.sunPos);
  const tgtSunPos = new THREE.Vector3();

  function setPreset(name) {
    const p = PRESETS[name];
    for (const k in cols) tgt.cols[k] = new THREE.Color(p[k]);
    for (const k in curNums) tgt.nums[k] = p[k];
    tgtSunPos.set(...p.sunPos);
  }
  const tmpC = new THREE.Color();
  function update(dt, renderer) {
    const k = 1 - Math.exp(-dt * 1.6);
    for (const key in cols) cols[key].lerp(tgt.cols[key] || cols[key], k);
    for (const key in curNums) curNums[key] += ((tgt.nums[key] ?? curNums[key]) - curNums[key]) * k;
    curSunPos.lerp(tgtSunPos, k);
    sun.color.copy(cols.sunColor); sun.intensity = curNums.sunI; sun.position.copy(curSunPos);
    hemi.color.copy(cols.hemiSky); hemi.groundColor.copy(cols.hemiGround); hemi.intensity = curNums.hemiI;
    scene.fog.color.copy(cols.fog); scene.fog.density = curNums.fogD;
    renderer.toneMappingExposure = curNums.exposure;
    skyU.uTop.value.copy(cols.skyTop); skyU.uHorizon.value.copy(cols.skyHor);
    skyU.uSunDir.value.copy(curSunPos).normalize();
    skyU.uSunColor.value.copy(cols.sunColor); skyU.uNight.value = curNums.night;
    waterU.uSunDir.value.copy(curSunPos).normalize();
    waterU.uSunColor.value.copy(cols.sunColor);
    waterU.uSkyRef.value.copy(cols.waterSky);
    cabin.winMat.emissiveIntensity = curNums.winGlow;
    for (const l of cabin.lamps) l.intensity = curNums.lamp;
  }
  setPreset('morn');
  // snap instantly on first call
  for (const key in cols) cols[key].copy(tgt.cols[key]);
  for (const key in curNums) curNums[key] = tgt.nums[key];
  curSunPos.copy(tgtSunPos);
  return { setPreset, update, getNight: () => curNums.night };
}
