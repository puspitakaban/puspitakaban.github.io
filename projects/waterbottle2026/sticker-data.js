import { stickerTextures } from './assets/decals/texture-info.js';
import { BODY_RADIUS } from './dimensions.js';

// Placement follows the reference bottle; layer overrides control the overlaps.
// Angles are in degrees. Dimensions use the bottle model's units.
const placements = [
  { number:1, id:'promised-land', name:'Promised Land', angle:21.6489, y:2.2903, width:2.3974, rotation:90, horizontalScale:1.15, metallic:0.50 },
  { number:2, id:'cat', name:'Cat / NSFW', angle:6.0173, y:0.6615, height:1.1379, horizontalScale:1.15 },
  { number:3, id:'cats', name:'Buddha', angle:104.4501, y:3.3279, height:1.3964, glossy:true },
  { number:4, id:'disco', name:'Wisco Disco', angle:91.4503, y:2.1804, height:1.1534, circle:true, glossy:true },
  { number:5, id:'atlas-record', name:'Atlas Record', angle:93.7533, y:0.8792, height:1.425696, circle:true },
  { number:6, id:'wander', name:'Not all those who wander are lost', angle:194.3008, y:2.9027, height:1.7281 },
  { number:7, id:'michigan-seas', name:'Michigan SEAS', angle:190.9291, y:1.1235, height:1.71, square:true },
  { number:8, id:'underground-sounds', name:'Underground Sounds', angle:271.5458, y:2.4630, height:1.8246, circle:true, layer:5.5 },
  { number:9, id:'art-feminism', name:'Ann Arbor Art + Feminism', angle:304.5768, y:1.3202, height:1.2054, glossy:true },
];

function resolvePlacement(placement) {
  const texture = stickerTextures[placement.id];
  const aspect = placement.circle || placement.square ? 1 : texture.aspect;
  const width = placement.width ?? placement.height * aspect;
  const height = placement.height ?? placement.width / aspect;
  const rotation = placement.rotation ?? 0;
  const radians = rotation * Math.PI / 180;
  const horizontalScale = placement.horizontalScale ?? 1;
  const horizontalExtent = (Math.abs(width*Math.cos(radians)) + Math.abs(height*Math.sin(radians)))*horizontalScale;
  const verticalExtent = Math.abs(width*Math.sin(radians)) + Math.abs(height*Math.cos(radians));
  return { ...placement, width, height, rotation, horizontalScale, layer:placement.layer ?? placement.number, texture:texture.file, uv:texture.uv,
    angleSpan:horizontalExtent / BODY_RADIUS * 180 / Math.PI, verticalExtent, enabled:false, href:null };
}

export const stickers = placements.map(resolvePlacement);
export const backgroundSticker = resolvePlacement({
  number:10, id:'its-background', name:'ITS background', angle:135, y:2.00,
  height:1.65, layer:0.5, glossy:true, metallic:0.12,
});
