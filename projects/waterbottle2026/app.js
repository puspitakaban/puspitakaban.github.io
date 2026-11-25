import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createBottle, BOTTLE_HEIGHT } from './bottle.js';
import { backgroundSticker, stickers } from './sticker-data.js';

const viewer = document.querySelector('#bottle-viewer');
const canvas = document.querySelector('#bottle-canvas');
const status = document.querySelector('#viewer-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function fallback(message) {
  viewer.classList.remove('ready');
  viewer.classList.add('fallback');
  viewer.dataset.state = 'fallback';
  canvas.tabIndex = -1;
  status.textContent = message;
}

async function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    fallback('Interactive 3D is unavailable in this browser. Try another browser to view the bottle.');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const center = new THREE.Vector3(-0.10, BOTTLE_HEIGHT / 2, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.75;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;
  controls.autoRotate = !reducedMotion.matches;
  controls.autoRotateSpeed = 0.42;
  controls.enableKeys = false;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  let hasInteracted = false;
  controls.addEventListener('start', () => {
    hasInteracted = true;
    controls.autoRotate = false;
    viewer.dataset.interacted = 'true';
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentMap = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = 0.65;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe8efff, 0x8b8c93, 2.1));
  const key = new THREE.DirectionalLight(0xfffaf5, 4);
  key.position.set(-3.5, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8eeff, 2.7);
  fill.position.set(5, 5, -2);
  scene.add(fill);
  const front = new THREE.DirectionalLight(0xffffff, 1.4);
  front.position.set(1, 4, 8);
  scene.add(front);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const gradient = shadowContext.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(14, 18, 28, 0.23)');
  gradient.addColorStop(0.4, 'rgba(14, 18, 28, 0.13)');
  gradient.addColorStop(1, 'rgba(14, 18, 28, 0)');
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 128, 128);
  const shadowMap = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.4), new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  const loader = new THREE.TextureLoader();
  let decalTextures;
  try {
    decalTextures = await Promise.all([backgroundSticker,...stickers].map(async (sticker) =>
      [sticker.id,await loader.loadAsync(new URL(sticker.texture,import.meta.url).href)]));
  } catch {
    renderer.dispose();
    fallback('The bottle could not be loaded. Reload the page to try again.');
    return;
  }
  const decalMaps = new Map(decalTextures);
  for (const texture of decalMaps.values()) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8,renderer.capabilities.getMaxAnisotropy());
  }
  const bottle = createBottle(decalMaps);
  bottle.rotation.y = THREE.MathUtils.degToRad(-71);
  scene.add(bottle);

  // An intentionally dormant interaction hook. No markers or sticker panels
  // appear in this first version. Future links use the same surface coordinates.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart;
  canvas.addEventListener('pointerdown', (event) => { pointerStart = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener('pointerup', (event) => {
    if (!pointerStart || Math.hypot(event.clientX-pointerStart.x, event.clientY-pointerStart.y) > 6) return;
    pointerStart = null;
    if (!stickers.some((sticker) => sticker.enabled)) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(bottle,true).find((intersection) =>
      stickers.some((entry) => entry.enabled && entry.id === intersection.object.userData.stickerId));
    if (!hit) return;
    const sticker = stickers.find((entry) => entry.id === hit.object.userData.stickerId);
    if (sticker) canvas.dispatchEvent(new CustomEvent('stickerselect', { detail: sticker, bubbles: true }));
  });

  let fitDistance;
  function fit(reset = false) {
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;
    const oldFit = fitDistance;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const verticalDistance = (BOTTLE_HEIGHT * 1.18) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const horizontalDistance = 2.9 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    fitDistance = Math.max(verticalDistance, horizontalDistance);
    if (reset || !oldFit) camera.position.copy(center).add(new THREE.Vector3(0, fitDistance * 0.055, fitDistance));
    else camera.position.sub(center).multiplyScalar(fitDistance / oldFit).add(center);
    controls.minDistance = fitDistance * 0.48;
    controls.maxDistance = fitDistance * 1.8;
    renderer.setSize(width, height, false);
    controls.update();
  }
  fit(true);
  const resize = new ResizeObserver(() => fit());
  resize.observe(viewer);

  canvas.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'Home', ' '];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    hasInteracted = true;
    controls.autoRotate = false;
    if (event.key === 'Home') {
      bottle.rotation.y = THREE.MathUtils.degToRad(-71);
      fit(true);
    } else if (event.key === ' ') {
      controls.autoRotate = viewer.dataset.paused === 'true';
      viewer.dataset.paused = String(!controls.autoRotate);
    } else {
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === 'ArrowLeft') spherical.theta -= 0.14;
      if (event.key === 'ArrowRight') spherical.theta += 0.14;
      if (event.key === 'ArrowUp') spherical.phi -= 0.1;
      if (event.key === 'ArrowDown') spherical.phi += 0.1;
      if (event.key === '+' || event.key === '=') spherical.radius *= 0.9;
      if (event.key === '-' || event.key === '_') spherical.radius *= 1.1;
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
      camera.position.setFromSpherical(spherical).add(controls.target);
    }
    controls.update();
  });
  reducedMotion.addEventListener('change', () => { controls.autoRotate = !reducedMotion.matches && !hasInteracted; });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    fallback('The 3D view was interrupted. Reload the page to view the bottle again.');
  });
  canvas.addEventListener('webglcontextrestored', () => location.reload());

  let previous = 0;
  const render = (time) => {
    if (document.hidden) { previous = time; return; }
    const delta = Math.min((time-previous)/1000 || 1/60, 0.05);
    previous = time;
    controls.update(delta);
    renderer.render(scene, camera);
  };
  await renderer.compileAsync(scene, camera);
  renderer.render(scene, camera);
  viewer.classList.add('ready');
  viewer.dataset.state = 'ready';
  viewer.dataset.paused = String(!controls.autoRotate);
  status.textContent = 'The interactive bottle is ready.';
  renderer.setAnimationLoop(render);
  window.addEventListener('pagehide', () => {
    renderer.setAnimationLoop(null);
    resize.disconnect();
    controls.dispose();
    environmentMap.dispose();
    for (const texture of decalMaps.values()) texture.dispose();
    shadowMap.dispose();
    scene.traverse((item) => {
      if (item.isMesh) {
        item.geometry.dispose();
        for (const material of Array.isArray(item.material) ? item.material : [item.material]) material.dispose();
      }
    });
    renderer.dispose();
  }, { once: true });
}

start().catch((error) => {
  console.error('The bottle viewer could not start.', error);
  fallback('The bottle could not start. Reload the page or try another browser.');
});
