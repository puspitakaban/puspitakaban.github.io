import * as THREE from 'three';
import { createMoldedHandleGeometry } from './handle.js';

// Proportions follow the supplied top, side, and hinge reference photographs.
const DRINKING_CAP_BASE = 5.345;
const DRINKING_CAP_SCALE = 0.9025;
const BRIDGE_SEAT_HEIGHT = 5.465;
const HANDLE_SCALE = 0.90;
const LOWER_LID_RADIUS = 0.746;
const HINGE_OFFSET = 0.710;
const HINGE_HEIGHT = BRIDGE_SEAT_HEIGHT-0.035*THREE.MathUtils.smoothstep(HINGE_OFFSET,0.20,0.72)-0.065*HANDLE_SCALE-0.0015;
export const CAP_TOP = BRIDGE_SEAT_HEIGHT+(5.77-DRINKING_CAP_BASE)*DRINKING_CAP_SCALE;
const HANDLE_ANGLE = THREE.MathUtils.degToRad(295);
const DRINKING_CAP_OFFSET = 0.19;

function turned(name, profile, material, segments = 160) {
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(
    profile.map(([radius, height]) => new THREE.Vector2(radius, height)), segments,
  ), material);
  mesh.name = name;
  return mesh;
}

function ring(parent, name, radius, tube, y, material) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 160), material);
  mesh.name = name;
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  parent.add(mesh);
}

function makeDrinkingCap(material) {
  const profile = [
    [0,5.345],[0.385,5.345],[0.426,5.35],[0.444,5.363],
    [0.448,5.38],[0.447,5.397],[0.435,5.412],[0.429,5.419],
  ];
  for (let row = 0; row <= 80; row++) {
    const t = row / 80;
    profile.push([THREE.MathUtils.lerp(0.428,0.422,t), THREE.MathUtils.lerp(5.422,5.725,t)]);
  }
  // A broad shoulder rolls into a shallow circular inset, rather than a bead.
  profile.push(
    [0.421,5.739],[0.417,5.752],[0.410,5.763],[0.399,5.77],
    [0.372,5.77],[0.345,5.77],[0.320,5.77],[0.310,5.767],
    [0.303,5.762],[0.299,5.754],[0.298,5.749],[0.292,5.746],[0,5.746],
  );
  const mesh = turned('Drinking cap with recessed grip channels',profile,material,384);
  const positions = mesh.geometry.attributes.position;
  const pitch = Math.PI * 2 / 12;
  const halfWidth = 0.054;
  const bottom = 5.428;
  const endRadius = 0.050;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const radius = Math.hypot(x,z);
    if (y <= bottom || y >= 5.767 || radius < 0.34) continue;
    const angle = Math.atan2(x,z);
    const offset = THREE.MathUtils.euclideanModulo(angle+pitch/2,pitch)-pitch/2;
    const endDistance = Math.max(0,bottom+endRadius-y);
    const width = halfWidth*Math.sqrt(Math.max(0,1-(endDistance/endRadius)**2));
    const distance = Math.abs(offset)*radius;
    if (!width || distance >= width) continue;
    const edge = 1-THREE.MathUtils.smoothstep(distance,width*0.57,width);
    const lowerBlend = THREE.MathUtils.smoothstep(y,bottom,bottom+0.035);
    const upperBlend = 1-THREE.MathUtils.smoothstep(y,5.731,5.767);
    const scale = (radius-0.028*edge*lowerBlend*upperBlend)/radius;
    positions.setXYZ(i,x*scale,y,z*scale);
  }
  positions.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.userData.gripChannels = 12;
  return mesh;
}

function makeBridge(material) {
  // A single solid includes the round drinking-cap seat, tapered bridge, and
  // rounded hinge ends. Only the rotating handle and its pin are separate.
  const outline = new THREE.Shape();
  outline.moveTo(-0.447,-DRINKING_CAP_OFFSET);
  outline.bezierCurveTo(-0.447,-0.437,-0.247,-0.637,0,-0.637);
  outline.bezierCurveTo(0.247,-0.637,0.447,-0.437,0.447,-DRINKING_CAP_OFFSET);
  outline.bezierCurveTo(0.450,0.010,0.432,0.158,0.388,0.286);
  outline.lineTo(0.292,0.709);
  outline.quadraticCurveTo(0.285,0.756,0.237,0.756);
  // The barrel spans the open rear of this U-shaped hinge pocket.
  outline.lineTo(0.203,0.756);
  outline.quadraticCurveTo(0.179,0.756,0.179,0.728);
  outline.lineTo(0.179,0.427);
  outline.quadraticCurveTo(0.179,0.398,0.154,0.398);
  outline.lineTo(-0.154,0.398);
  outline.quadraticCurveTo(-0.179,0.398,-0.179,0.427);
  outline.lineTo(-0.179,0.728);
  outline.quadraticCurveTo(-0.179,0.756,-0.203,0.756);
  outline.lineTo(-0.237,0.756);
  outline.quadraticCurveTo(-0.285,0.756,-0.292,0.709);
  outline.lineTo(-0.388,0.286);
  outline.bezierCurveTo(-0.432,0.158,-0.450,0.010,-0.447,-DRINKING_CAP_OFFSET);
  outline.closePath();
  const recess = new THREE.Path();
  recess.moveTo(-0.154,0.398);
  recess.lineTo(0.154,0.398);
  recess.quadraticCurveTo(0.179,0.398,0.179,0.427);
  recess.lineTo(0.179,0.662);
  recess.quadraticCurveTo(0.179,0.691,0.150,0.691);
  recess.lineTo(-0.150,0.691);
  recess.quadraticCurveTo(-0.179,0.691,-0.179,0.662);
  recess.lineTo(-0.179,0.427);
  recess.quadraticCurveTo(-0.179,0.398,-0.154,0.398);
  recess.closePath();

  const shape = new THREE.Shape(outline.getSpacedPoints(320));
  const shell = new THREE.ExtrudeGeometry(shape,{
    depth:0.17, bevelEnabled:true, bevelSize:0.009,
    bevelThickness:0.006, bevelSegments:3, steps:1,
  });
  shell.rotateX(Math.PI/2);
  const source = shell.attributes.position;
  const vertices = [], indices = [], uv = [], welded = new Map();

  function topAt(z) {
    const deck = BRIDGE_SEAT_HEIGHT-0.035*THREE.MathUtils.smoothstep(z,0.20,0.72);
    const flat = THREE.MathUtils.lerp(deck,BRIDGE_SEAT_HEIGHT-0.035,
      THREE.MathUtils.smoothstep(z,0.50,0.60));
    // The flat bridge rolls gently upward only at the hinge's rounded ends.
    return flat+0.006*THREE.MathUtils.smoothstep(z,0.675,0.750);
  }

  function bottomAt(x,z) {
    // Rest directly on the lid's existing surface, with no gap or foot sunk
    // into its wall. The exposed hinge end has a rounded lower outline.
    const radius = Math.hypot(x,z);
    const surface = [[0,5.355],[0.56,5.355],[0.70,5.34],[0.720,5.325],
      [0.735,5.305],[0.744,5.28],[0.746,5.22]];
    if (radius <= 0.738) {
      for (let i=1;i<surface.length;i++) {
        if (radius <= surface[i][0]) {
          const [r0,y0]=surface[i-1], [r1,y1]=surface[i];
          return THREE.MathUtils.lerp(y0,y1,(radius-r0)/(r1-r0))+0.004;
        }
      }
    }
    const arch = Math.sqrt(Math.max(0,1-((z-HINGE_OFFSET)/0.117)**2));
    const hingeBottom = HINGE_HEIGHT-0.070*arch;
    const edge = THREE.MathUtils.smoothstep(radius,0.738,0.775);
    return THREE.MathUtils.lerp(5.301,hingeBottom,edge);
  }

  function vertex(point) {
    const [x,y,z] = point;
    const weight = THREE.MathUtils.clamp((y+0.17)/0.17,0,1);
    const bevel = y-THREE.MathUtils.clamp(y,-0.17,0);
    const mapped = [x,THREE.MathUtils.lerp(bottomAt(x,z),topAt(z),weight)+bevel,z];
    const key = mapped.map(value=>Math.round(value*1000000)).join(',');
    if (welded.has(key)) return welded.get(key);
    const index = vertices.length/3;
    welded.set(key,index);
    vertices.push(...mapped);
    uv.push(x+0.5,(z+0.637)/1.4);
    return index;
  }

  function subdivide(a,b,c,depth=0) {
    const ab = a.reduce((sum,value,i)=>sum+(value-b[i])**2,0);
    const bc = b.reduce((sum,value,i)=>sum+(value-c[i])**2,0);
    const ca = c.reduce((sum,value,i)=>sum+(value-a[i])**2,0);
    const longest = Math.max(ab,bc,ca);
    if (longest <= 0.035**2 || depth >= 16) {
      const tri = [vertex(a),vertex(b),vertex(c)];
      if (new Set(tri).size === 3) indices.push(...tri);
      return;
    }
    const mid = (u,v)=>u.map((value,i)=>(value+v[i])/2);
    if (longest === ab) {
      const m=mid(a,b);subdivide(a,m,c,depth+1);subdivide(m,b,c,depth+1);
    } else if (longest === bc) {
      const m=mid(b,c);subdivide(a,b,m,depth+1);subdivide(a,m,c,depth+1);
    } else {
      const m=mid(c,a);subdivide(a,b,m,depth+1);subdivide(m,b,c,depth+1);
    }
  }
  for (let i=0;i<source.count;i+=3) {
    const point=index=>[source.getX(index),source.getY(index),source.getZ(index)];
    subdivide(point(i),point(i+1),point(i+2));
  }
  shell.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const bridge = new THREE.Mesh(geometry,material);
  bridge.name = 'One-piece bridge, drinking-cap seat, and hinge mounts';
  bridge.userData.onePiece = true;
  const assembly = new THREE.Group();
  assembly.name = 'Bridge with recessed hinge pocket';
  assembly.add(bridge);
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(recess.getPoints(24))),
    new THREE.MeshStandardMaterial({color:0x07090c,roughness:0.85}));
  floor.name = 'Shadowed floor of hinge pocket';
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0,5.356,1.089);
  assembly.add(floor);
  return assembly;
}

function makeCarryLoop(material, metal) {
  const pivot = new THREE.Group();
  pivot.name = 'Handle and hinge aligned with drinking cap';
  pivot.rotation.y = HANDLE_ANGLE;
  pivot.add(makeBridge(material));
  const moving = new THREE.Group();
  moving.name = 'Hinged carry loop';
  moving.position.set(0,HINGE_HEIGHT,HINGE_OFFSET);
  moving.scale.setScalar(HANDLE_SCALE);
  const loop = new THREE.Mesh(createMoldedHandleGeometry(),material);
  loop.name = 'Wide rounded carry loop matching the lower lid';
  loop.userData.onePiece = true;
  loop.userData.integratedForkArms = 2;
  loop.geometry.computeBoundingBox();
  const loopBounds = loop.geometry.boundingBox;
  loop.geometry.scale(2*LOWER_LID_RADIUS/(HANDLE_SCALE*(loopBounds.max.x-loopBounds.min.x)),1,1);
  loop.rotation.x = -0.42;
  moving.add(loop);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.196,48),material);
  barrel.name = 'Central hinge barrel';
  barrel.rotation.z = Math.PI/2;
  moving.add(barrel);
  pivot.add(moving);
  for (const side of [-1,1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.021,0.021,0.005,24),metal);
    pin.name = 'Small hinge pin';
    pin.rotation.z = Math.PI/2;
    pin.scale.setScalar(HANDLE_SCALE);
    pin.position.set(side*0.290,HINGE_HEIGHT,HINGE_OFFSET);
    pivot.add(pin);
  }
  return pivot;
}

export function createCap(coat) {
  const top = new THREE.Group();
  top.name = 'Neck, lid, and carry loop';
  const plastic = new THREE.MeshStandardMaterial({
    color:0x111317, roughness:0.52, metalness:0.025,
    bumpMap:coat.bumpMap, bumpScale:0.0016,
  });
  const gripPlastic = plastic.clone();
  gripPlastic.roughness = 0.50;
  const rubber = new THREE.MeshStandardMaterial({color:0x090b0e,roughness:0.82});
  const metal = new THREE.MeshStandardMaterial({color:0x6d7074,roughness:0.38,metalness:0.8});

  ring(top,'Neck collar edge',0.711,0.013,4.765,coat);
  top.add(turned('Straight neck collar',[
    [0.706,4.72],[0.711,4.755],[0.714,4.775],[0.714,4.82],[0.714,4.92],
  ],plastic));
  top.add(turned('Screw lid — restored original profile',[
    [0.714,4.835],[0.730,4.855],[0.743,4.88],[0.746,4.90],
    [0.746,5.00],[0.746,5.04],[0.746,5.08],[0.746,5.22],
    [0.744,5.28],[0.735,5.305],[0.720,5.325],
    [0.70,5.34],[0.56,5.355],[0.35,5.355],[0,5.355],
  ],plastic));
  ring(top,'Lid seam in its original position',0.745,0.004,5.045,rubber);
  ring(top,'Lower lid seam',0.731,0.006,4.865,rubber);

  const drinkingCap = new THREE.Group();
  drinkingCap.name = 'Ribbed drinking cap';
  drinkingCap.position.set(
    -Math.sin(HANDLE_ANGLE)*DRINKING_CAP_OFFSET,BRIDGE_SEAT_HEIGHT-DRINKING_CAP_BASE*DRINKING_CAP_SCALE,
    -Math.cos(HANDLE_ANGLE)*DRINKING_CAP_OFFSET,
  );
  drinkingCap.scale.setScalar(DRINKING_CAP_SCALE);
  drinkingCap.add(makeDrinkingCap(gripPlastic));
  top.add(drinkingCap,makeCarryLoop(plastic,metal));
  return top;
}
