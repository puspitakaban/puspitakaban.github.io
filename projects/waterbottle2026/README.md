# Water Bottle

A single-page, responsive 3D viewer of Puspita’s black water bottle. The page
contains only the bottle, with a soft light-gray studio background and shadow.

Run `npm run dev`, then open http://localhost:4173. No dependency installation
is needed: Three.js 0.181.2 is included locally under its MIT license.
`npm run check` validates the source and local asset references. `npm run build`
creates the deployable copy in `dist/`, which is generated, ignored by Git, and
safe to delete. The source can also be served directly,
including at a GitHub Pages subdirectory; all paths are relative.
Node.js is only needed for development commands. GitHub Pages can serve this
folder directly without a build or a Node.js server in production.

Drag or swipe to rotate, and scroll or pinch to zoom. Arrow keys rotate, +/−
zoom, Home resets, and Space toggles rotation. Gentle automatic rotation stops
on interaction and respects reduced motion. If 3D is unavailable, the page
shows a brief message explaining how to try again.

The body is a modeled approximation using the supplied reference photos, rather
than a photogrammetry scan. The approved bottle shape, cap and handle remain
separate geometry. Nine individual curved decal meshes use optimized textures
made from the numbered PNGs in `assets/stickers/`; their placement follows the
previous 3D view. Promised Land is
rotated 90 degrees, SEAS keeps a square shape, and explicit layers control the
overlaps. Underground Sounds sits beneath Wander and SEAS. Sticker 10 forms
a continuous ITS background behind the foreground decals, including newly
exposed areas when stickers move. Its obscured artwork is reconstructed from
the supplied reference, rather than a pixel-identical scan.
`python3 scripts/prepare-sticker-textures.py` prepares optimized WebP textures
and alpha-crop UV bounds without changing the original PNGs.

`sticker-data.js` records sticker IDs, dimensions, rotations and positions. All entries
start disabled. To add interaction later, enable the relevant entry and handle
the canvas’s `stickerselect` custom event to open its story or destination.

`assets/stickers/` holds the approved full-resolution PNG originals so textures
can be rebuilt. `assets/decals/` holds the optimized WebP files and crop data
that the viewer loads. The build excludes the originals. `vendor/` contains
Three.js and its license.

`cap.js` models the lid and recessed drinking-cap grips, with the cap seated
on a single molded bridge that includes the rounded hinge mounts. The handle
rotates around a separate hinge barrel.
The broad carry loop follows IMG_8277 and IMG_8278; its outer width matches
the diameter of the lower lid. `handle.js` forms the loop, two fork arms, and
rounded pin housings as one continuous molded surface. A crosspiece closes the
main loop. Two arms project from its inner edge, fitting between the bridge's
fixed hinge mounts and leaving a small rectangular opening behind the barrel.
The finger tips are rounded; the barrel and small metal pins remain separate.
The main loop has a softly tapered outline with continuously outward-rounded
sides and a straight top. The band has even width and flat faces through the
finger roots; its width is a further 5% slimmer, with the previously approved
depth retained.
