import * as THREE from 'three';
import { backgroundSticker, stickers } from './sticker-data.js';
import { BODY_HEIGHT, BODY_RADIUS } from './dimensions.js';
import { createCap, CAP_TOP } from './cap.js';

export { BODY_HEIGHT, BODY_RADIUS } from './dimensions.js';
const SHOULDER_BASE = BODY_HEIGHT - 0.005;
const SHOULDER_SCALE = 0.8;
const NECK_DROP = (4.76 - SHOULDER_BASE) * (1 - SHOULDER_SCALE);
export const BOTTLE_HEIGHT = CAP_TOP - NECK_DROP;
const BODY_PROFILE = [
  [0,0.015],[0.66,0.015],[0.79,0.025],[0.855,0.055],[0.885,0.105],
  [0.899,0.17],[0.9,0.24],[0.9,3.75],[0.9,BODY_HEIGHT],
].map(([radius,y]) => [radius*BODY_RADIUS/0.9,y]);
const SHOULDER_PROFILE = [
  [0.9,3.945],[0.9,3.98],[0.897,4.01],[0.89,4.04],
  [0.86,4.14],[0.83,4.24],[0.80,4.34],[0.77,4.44],
  [0.74,4.54],[0.71,4.64],[0.707,4.665],[0.706,4.69],[0.706,4.76],
].map(([radius,y]) => [
  radius+(BODY_RADIUS-0.9)*THREE.MathUtils.clamp((4.69-y)/(4.69-SHOULDER_BASE),0,1),
  SHOULDER_BASE+(y-SHOULDER_BASE)*SHOULDER_SCALE,
]);

function bodyRadiusAt(y) {
  const profile = y > BODY_HEIGHT ? SHOULDER_PROFILE : BODY_PROFILE;
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i-1], [r1, y1] = profile[i];
    if (y <= y1 && y1 > y0) return THREE.MathUtils.lerp(r0,r1,THREE.MathUtils.clamp((y-y0)/(y1-y0),0,1));
  }
  return profile[profile.length-1][0];
}

function createSticker(sticker, texture) {
  const columns = 64, rows = 32;
  const vertices = [], uvs = [], indices = [];
  const rotation = THREE.MathUtils.degToRad(sticker.rotation);
  const cosine = Math.cos(rotation), sine = Math.sin(rotation);
  const [u0, v0, u1, v1] = sticker.uv;
  for (let row = 0; row <= rows; row++) {
    const v = row/rows;
    for (let column = 0; column <= columns; column++) {
      const u = column/columns;
      const x = (u-0.5)*sticker.width, y = (v-0.5)*sticker.height;
      const arc = (x*cosine-y*sine)*sticker.horizontalScale;
      const height = sticker.y+x*sine+y*cosine;
      const angle = THREE.MathUtils.degToRad(sticker.angle)+arc/BODY_RADIUS;
      const radius = bodyRadiusAt(height)+0.0015+sticker.layer*0.00015;
      vertices.push(Math.sin(angle)*radius,height,Math.cos(angle)*radius);
      uvs.push(THREE.MathUtils.lerp(u0,u1,u),THREE.MathUtils.lerp(v0,v1,v));
      if (row < rows && column < columns) {
        const a = row*(columns+1)+column, b = a+columns+1;
        indices.push(a,a+1,b+1,a,b+1,b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({
    map:texture ?? null, color:0xffffff,
    metalness:sticker.metallic ?? (sticker.glossy ? 0.16 : 0.02),
    roughness:sticker.glossy || sticker.metallic ? 0.43 : 0.67,
    clearcoat:sticker.glossy ? 0.2 : 0.04, clearcoatRoughness:0.45,
    transparent:true, alphaTest:0.035, depthWrite:false,
    polygonOffset:true, polygonOffsetFactor:-sticker.layer, polygonOffsetUnits:-sticker.layer,
  });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.name = `Sticker ${sticker.number}: ${sticker.name}`;
  mesh.userData.stickerId = sticker.id;
  mesh.userData.stickerNumber = sticker.number;
  mesh.renderOrder = 10+sticker.layer;
  return mesh;
}

function turned(points, material, segments = 128) {
  return new THREE.Mesh(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments), material);
}

function addTorus(parent, radius, tube, y, material) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 128), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  parent.add(ring);
  return ring;
}

export function createBottle(decalMaps = new Map()) {
  const bottle = new THREE.Group();
  bottle.name = 'Water bottle';
  const coat = new THREE.MeshStandardMaterial({ color: 0x131518, roughness: 0.82, metalness: 0.16 });
  const grainSize = 128;
  const grain = new Uint8Array(grainSize * grainSize);
  let seed = 127;
  for (let i = 0; i < grain.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    grain[i] = (seed >>> 24);
  }
  const bump = new THREE.DataTexture(grain, grainSize, grainSize, THREE.RedFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(12, 24);
  bump.needsUpdate = true;
  coat.bumpMap = bump;
  coat.bumpScale = 0.009;
  const rubber = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: 0.86, metalness: 0 });
  const body = turned(BODY_PROFILE,coat);
  body.name = 'Powder-coated body';
  const uv = body.geometry.attributes.uv;
  const positions = body.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setY(i, positions.getY(i) / BODY_HEIGHT);
  uv.needsUpdate = true;
  bottle.add(body);

  const backing = createSticker(backgroundSticker,decalMaps.get(backgroundSticker.id));
  backing.name = 'Sticker 10: continuous ITS background';
  backing.userData.backgroundOnly = true;
  bottle.add(backing);
  const decals = new THREE.Group();
  decals.name = 'Numbered sticker layers';
  for (const sticker of stickers) decals.add(createSticker(sticker,decalMaps.get(sticker.id)));
  bottle.add(decals);

  const shoulder = turned(SHOULDER_PROFILE,coat);
  shoulder.name = 'Straight tapered shoulder';
  bottle.add(shoulder);
  const top = createCap(coat);
  top.position.y = -NECK_DROP;
  bottle.add(top);
  addTorus(bottle, 0.80, 0.025, 0.042, rubber);

  bottle.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return bottle;
}
