import * as THREE from 'three';

// A constant-width rounded band tapers gently toward its straight top.
// The two inward fingers join it in the same plane; only their pin housings
// thicken at the hinge. No raised seam is added where the fingers meet the band.
export function createMoldedHandleGeometry() {
  const bandWidth=(0.130+0.038)*0.95*0.95;
  const halfDepth=(0.0325+0.014)*0.95;
  const bevel=0.012;
  const sideCenter=0.746/0.90-bandWidth/2;
  const centerline=new THREE.Path();
  centerline.moveTo(-0.27,-0.385);
  centerline.lineTo(0.27,-0.385);
  // Each side turns continuously outward from the top into the broad base.
  // Convex control polygons avoid the inward bends of the sharper version.
  centerline.bezierCurveTo(0.45,-0.385,sideCenter,-0.70,sideCenter,-0.98);
  centerline.bezierCurveTo(sideCenter,-1.155,0.61,-1.239,0.42,-1.239);
  centerline.lineTo(-0.42,-1.239);
  centerline.bezierCurveTo(-0.61,-1.239,-sideCenter,-1.155,-sideCenter,-0.98);
  centerline.bezierCurveTo(-sideCenter,-0.70,-0.45,-0.385,-0.27,-0.385);
  centerline.closePath();
  const finger=new THREE.Shape();
  finger.moveTo(0.105,0);
  finger.lineTo(0.168,0);
  finger.lineTo(0.168,-0.205);
  finger.bezierCurveTo(0.168,-0.270,0.195,-0.290,0.225,-0.330);
  finger.lineTo(0.225,-0.400);
  finger.lineTo(0.105,-0.400);
  finger.closePath();
  const edgesOf=points=>points.slice(0,-1).map((a,i)=>{
    const b=points[i+1],dx=b.x-a.x,dy=b.y-a.y;
    return {x:a.x,y:a.y,dx,dy,inverse:1/(dx*dx+dy*dy || 1)};
  });
  const bandEdges=edgesOf(centerline.getPoints(96));
  const fingerEdges=edgesOf(finger.getPoints(32));
  function distanceToEdges(edges,x,y,signed=false) {
    let squared=Infinity,inside=false;
    for (const e of edges) {
      const t=THREE.MathUtils.clamp(((x-e.x)*e.dx+(y-e.y)*e.dy)*e.inverse,0,1);
      squared=Math.min(squared,(x-e.x-t*e.dx)**2+(y-e.y-t*e.dy)**2);
      if (signed && (e.y>y)!=(e.y+e.dy>y) && x<e.x+e.dx*(y-e.y)/e.dy) inside=!inside;
    }
    return (inside ? -1 : 1)*Math.sqrt(squared);
  }
  const smoothUnion=(a,b,radius=0.028)=>{
    const h=Math.max(0,radius-Math.abs(a-b))/radius;
    return Math.min(a,b)-h*h*radius/4;
  };
  const nx=160, ny=136, nz=20;
  const minX=-0.85, minY=-1.35, minZ=-0.105;
  const dx=1.70/nx, dy=1.45/ny, dz=0.210/nz;
  const row=nx+1, plane=row*(ny+1);
  const field=new Float32Array(plane*(nz+1));
  const distance2D=new Float32Array(plane);

  for (let iy=0;iy<=ny;iy++) for (let ix=0;ix<=nx;ix++) {
    const x=minX+ix*dx, y=minY+iy*dy;
    const band=distanceToEdges(bandEdges,x,y)-bandWidth/2;
    const forks=distanceToEdges(fingerEdges,Math.abs(x),y,true);
    // Blend the outlines before extrusion so the joined faces remain flat.
    distance2D[iy*row+ix]=smoothUnion(band,forks,0.012);
  }

  const roundedBoxDistance=(a,b)=>Math.sqrt(Math.max(a,0)**2+Math.max(b,0)**2)+Math.min(Math.max(a,b),0);
  for (let iz=0;iz<=nz;iz++) for (let iy=0;iy<=ny;iy++) {
    const z=minZ+iz*dz, y=minY+iy*dy;
    const loopDepth=Math.abs(z)-halfDepth+bevel;
    const pinRadius=Math.hypot(y,z)-0.062;
    for (let ix=0;ix<=nx;ix++) {
      const x=minX+ix*dx;
      let value=roundedBoxDistance(distance2D[iy*row+ix]+bevel,loopDepth)-bevel;
      for (const side of [-1,1]) {
        // The moving knuckles sit inboard of the bridge's fixed mounts.
        // Their circular ends cover the arm tips without a projecting corner.
        const housing=roundedBoxDistance(Math.abs(x-side*0.1425)-0.0335,pinRadius)-0.008;
        value=smoothUnion(value,housing);
      }
      field[iz*plane+iy*row+ix]=value;
    }
  }

  const positions=[], normals=[], uvs=[], indices=[], crossings=new Map();
  function crossing(a,b) {
    const key=a<b ? a+','+b : b+','+a;
    if (crossings.has(key)) return crossings.get(key);
    const t=field[a]/(field[a]-field[b]);
    const position=index=>{
      const iz=Math.floor(index/plane), rest=index-iz*plane;
      const iy=Math.floor(rest/row), ix=rest-iy*row;
      return [minX+ix*dx,minY+iy*dy,minZ+iz*dz];
    };
    const gradient=index=>[
      (field[index+1]-field[index-1])/(2*dx),
      (field[index+row]-field[index-row])/(2*dy),
      (field[index+plane]-field[index-plane])/(2*dz),
    ];
    const p=position(a), q=position(b), na=gradient(a), nb=gradient(b);
    const point=p.map((value,i)=>THREE.MathUtils.lerp(value,q[i],t));
    const normal=na.map((value,i)=>THREE.MathUtils.lerp(value,nb[i],t));
    const length=Math.hypot(...normal) || 1;
    const index=positions.length/3;
    crossings.set(key,index);
    positions.push(...point);
    normals.push(...normal.map(value=>value/length));
    uvs.push((point[0]-minX)/1.70,-point[1]/1.35);
    return index;
  }

  function triangle(a,b,c) {
    const ax=positions[b*3]-positions[a*3], ay=positions[b*3+1]-positions[a*3+1], az=positions[b*3+2]-positions[a*3+2];
    const bx=positions[c*3]-positions[a*3], by=positions[c*3+1]-positions[a*3+1], bz=positions[c*3+2]-positions[a*3+2];
    const orientation=(ay*bz-az*by)*(normals[a*3]+normals[b*3]+normals[c*3])
      +(az*bx-ax*bz)*(normals[a*3+1]+normals[b*3+1]+normals[c*3+1])
      +(ax*by-ay*bx)*(normals[a*3+2]+normals[b*3+2]+normals[c*3+2]);
    indices.push(a,...(orientation>=0 ? [b,c] : [c,b]));
  }

  const tetrahedra=[[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6],[0,5,1,6]];
  for (let iz=0;iz<nz;iz++) for (let iy=0;iy<ny;iy++) for (let ix=0;ix<nx;ix++) {
    const a=iz*plane+iy*row+ix;
    const corners=[a,a+1,a+row+1,a+row,a+plane,a+plane+1,a+plane+row+1,a+plane+row];
    let mask=0;
    for (let i=0;i<8;i++) if (field[corners[i]]<0) mask|=1<<i;
    if (mask===0 || mask===255) continue;
    for (const tetrahedron of tetrahedra) {
      const inside=[], outside=[];
      for (const corner of tetrahedron) (field[corners[corner]]<0 ? inside : outside).push(corners[corner]);
      if (!inside.length || !outside.length) continue;
      if (inside.length===1 || outside.length===1) {
        const single=inside.length===1 ? inside[0] : outside[0];
        const other=inside.length===1 ? outside : inside;
        triangle(...other.map(index=>crossing(single,index)));
      } else {
        const a=crossing(inside[0],outside[0]), b=crossing(inside[0],outside[1]);
        const c=crossing(inside[1],outside[0]), d=crossing(inside[1],outside[1]);
        triangle(a,b,c);triangle(b,d,c);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
