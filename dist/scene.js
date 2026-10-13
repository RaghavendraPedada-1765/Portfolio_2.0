import * as THREE from './vendor/three.module.js';

export function createWorld(container, state) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x12313b, .018);
  const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 350);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.3 : 1.65));
  renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);
  const hemi = new THREE.HemisphereLight(0xb6d8e4, 0x173940, 2.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd392, 3.6); sun.position.set(-12, 22, -8); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x91dce9, 1.2); fill.position.set(12, 8, 18); scene.add(fill);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 18), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: {}, vertexShader: 'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: `varying vec3 vPos; void main(){vec3 n=normalize(vPos);float h=clamp(n.y*2.0,0.,1.);vec3 horizon=vec3(.24,.39,.41);vec3 zenith=vec3(.025,.11,.16);vec3 col=mix(horizon,zenith,pow(h,.45));float glow=pow(max(0.,dot(n,normalize(vec3(-.6,.13,-1.)))),13.);col+=vec3(.52,.3,.13)*glow;gl_FragColor=vec4(col,1.);}` })); scene.add(sky);
  const solar = new THREE.Mesh(new THREE.SphereGeometry(4.2, 32, 16), new THREE.MeshBasicMaterial({ color: 0xeec892, fog: false })); solar.position.set(-40, 10, -95); scene.add(solar);

  const oceanMat = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } }, vertexShader: `uniform float time; varying vec3 vWorld; varying float vWave; void main(){vec3 p=position;float wave=sin(p.x*.30+time*.48)*.22+sin(p.y*.39+time*.62)*.15+sin((p.x+p.y)*.7+time*.8)*.045;p.z+=wave;vWave=wave;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`, fragmentShader: `uniform float time;varying vec3 vWorld;varying float vWave;void main(){vec2 p=vWorld.xz;float ridges=sin(p.x*1.7+sin(p.y*.7+time*.35)*2.+time*.7)*sin(p.y*2.3+time*.65);float foam=smoothstep(.80,.99,ridges)*.25;float fine=sin(p.x*7.+time)*sin(p.y*5.-time)*.025;vec3 color=mix(vec3(.018,.13,.19),vec3(.045,.32,.36),clamp(vWave*.9+.45,0.,1.));color+=vec3(.26,.46,.43)*(foam+fine);float shimmer=pow(max(0.,sin(p.x*.5+p.y*.8+time*.3)),22.)*.18;float sunPath=exp(-pow((p.x+15.)/12.,2.))*clamp(-p.y/45.,0.,1.);color+=vec3(.7,.51,.25)*shimmer*sunPath;float fog=1.-exp(-length(vWorld-cameraPosition)*.012);color=mix(color,vec3(.1,.21,.25),fog);gl_FragColor=vec4(color,1.);}` });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(280, 280, 170, 170), oceanMat); water.rotation.x = -Math.PI / 2; water.position.y = -.25; scene.add(water);

  function mat(color, roughness = .8) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: .05, flatShading: true }); }
  const wood = mat(0x6e3620), darkWood = mat(0x3b2921), deckMat = mat(0xc29353), gold = mat(0xe7ae46), ivory = mat(0xf3e4bb), red = mat(0xa12f2b), green = mat(0x43795b), black = mat(0x182e31), blue = mat(0x4e9baf);
  function mesh(geo, material, parent, x = 0, y = 0, z = 0) { const obj = new THREE.Mesh(geo, material); obj.position.set(x, y, z); parent.add(obj); return obj; }
  function box(parent, w, h, d, material, x = 0, y = 0, z = 0) { return mesh(new THREE.BoxGeometry(w, h, d), material, parent, x, y, z); }
  function sphere(parent, r, material, x, y, z, detail = 16) { return mesh(new THREE.SphereGeometry(r, detail, detail), material, parent, x, y, z); }
  function rod(parent, a, b, radius, material) { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), delta = vb.clone().sub(va); const m = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material, parent); m.position.copy(va).add(vb).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m; }
  const ship = new THREE.Group(); scene.add(ship);
  // Layered hull creates a boat silhouette instead of a rectangular platform.
  const hullShape = new THREE.Shape(); hullShape.moveTo(-1.45, -2.6); hullShape.quadraticCurveTo(-1.9, -.6, -1.45, 2.15); hullShape.quadraticCurveTo(0, 4.25, 1.45, 2.15); hullShape.quadraticCurveTo(1.9, -.6, 1.45, -2.6); hullShape.quadraticCurveTo(0, -3.1, -1.45, -2.6);
  function hullLayer(scale, depth, y, material) { const geo = new THREE.ExtrudeGeometry(hullShape, { depth, bevelEnabled: true, bevelThickness: .16, bevelSize: .13, bevelSegments: 2, steps: 1, curveSegments: 18 }); const h = mesh(geo, material, ship, 0, y, 0); h.rotation.x = Math.PI / 2; h.scale.set(scale, scale, 1); return h; }
  hullLayer(.75, .55, .6, darkWood); hullLayer(.88, .45, .95, wood); hullLayer(.97, .13, 1.15, gold); hullLayer(1, .38, 1.52, wood); hullLayer(1.015, .13, 1.62, ivory); hullLayer(.98, .08, 1.72, deckMat);
  for (let z = -2.3; z < 2.7; z += .27) box(ship, z > 2 ? 2.2 : 2.8, .015, .015, darkWood, 0, 1.73, z);
  for (const side of [-1, 1]) {
    for (let z = -2; z <= 2; z += .75) { rod(ship, [side * 1.48, 1.75, z], [side * 1.48, 2.13, z], .035, ivory); }
    rod(ship, [side * 1.48, 2.13, -2.1], [side * 1.48, 2.13, 2.1], .05, ivory);
    for (let z = -1.8; z <= 1.8; z += 1.2) { const port = mesh(new THREE.CylinderGeometry(.24, .24, .09, 20), gold, ship, side * 1.56, 1.23, z); port.rotation.z = Math.PI / 2; const hole = mesh(new THREE.CylinderGeometry(.17, .17, .11, 20), black, ship, side * 1.62, 1.23, z); hole.rotation.z = Math.PI / 2; }
  }
  // Stern cabin, lawn and orange trees.
  box(ship, 2.45, 1, 1.4, ivory, 0, 2.15, -1.65); box(ship, 2.65, .18, 1.65, red, 0, 2.73, -1.65);
  for (const x of [-.78, 0, .78]) box(ship, .4, .44, .025, blue, x, 2.2, -.938);
  box(ship, 2.4, .05, 1.3, green, 0, 1.79, .4);
  for (const x of [-.83, .83]) { rod(ship, [x, 2.85, -1.9], [x, 3.4, -1.9], .07, wood); const leaves = sphere(ship, .39, green, x, 3.48, -1.9, 10); leaves.scale.y = .8; for (let i = 0; i < 4; i++) sphere(ship, .072, gold, x + Math.sin(i * 2) * .3, 3.48 + Math.cos(i * 3) * .17, -1.65 + Math.sin(i) * .14, 8); }
  // Sunny's lion figurehead.
  const lion = new THREE.Group(); lion.position.set(0, 1.9, 3.17); ship.add(lion);
  sphere(lion, .64, gold, 0, 0, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const ray = mesh(new THREE.ConeGeometry(.18, .48, 5), gold, lion, Math.sin(a) * .69, Math.cos(a) * .69, 0); ray.rotation.z = -a; }
  const face = sphere(lion, .49, ivory, 0, 0, .38); face.scale.z = .5;
  sphere(lion, .062, black, -.17, .1, .62, 10); sphere(lion, .062, black, .17, .1, .62, 10); sphere(lion, .085, wood, 0, -.025, .67, 10);
  const smile = mesh(new THREE.TorusGeometry(.17, .018, 6, 18, Math.PI), darkWood, lion, 0, -.05, .67); smile.rotation.z = Math.PI;
  // Main mast and bowed cloth sails.
  rod(ship, [0, 1.7, .1], [0, 7.6, .1], .095, darkWood);
  rod(ship, [-2.03, 6.72, .1], [2.03, 6.72, .1], .075, darkWood);
  rod(ship, [-1.75, 3.78, .1], [1.75, 3.78, .1], .055, darkWood);
  function sailTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const ctx = c.getContext('2d');
    ctx.fillStyle = '#efdfba'; ctx.fillRect(0, 0, 512, 512); ctx.strokeStyle = '#c6b38d'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 512); ctx.stroke(); }
    ctx.save(); ctx.translate(256, 265); ctx.strokeStyle = '#26332e'; ctx.lineWidth = 22; ctx.lineCap = 'round'; for (const dir of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-88, -65 * dir); ctx.lineTo(88, 65 * dir); ctx.stroke(); }
    ctx.fillStyle = '#26332e'; ctx.beginPath(); ctx.ellipse(0, -10, 70, 62, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-38, 35, 76, 36); ctx.fillStyle = '#f4e6c4'; for (const x of [-27, 27]) { ctx.beginPath(); ctx.arc(x, -6, 19, 0, 7); ctx.fill(); } ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-8, 27); ctx.lineTo(8, 27); ctx.fill(); for (let i = -2; i < 3; i++) ctx.fillRect(i * 13 - 3, 46, 6, 19);
    ctx.fillStyle = '#d5a84c'; ctx.beginPath(); ctx.ellipse(0, -61, 56, 44, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(-58, -67, 116, 17); ctx.fillStyle = '#a93f31'; ctx.fillRect(-57, -67, 114, 13); ctx.fillStyle = '#d5a84c'; ctx.beginPath(); ctx.ellipse(0, -51, 92, 14, 0, 0, 7); ctx.fill(); ctx.restore();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }
  const sailGeo = new THREE.PlaneGeometry(3.8, 2.8, 20, 20); const sailPositions = sailGeo.attributes.position;
  for (let i = 0; i < sailPositions.count; i++) { const x = sailPositions.getX(i), y = sailPositions.getY(i); sailPositions.setZ(i, .53 * (1 - Math.pow(x / 1.9, 2)) * (1 - Math.pow(y / 1.4, 2))); } sailGeo.computeVertexNormals();
  mesh(sailGeo, new THREE.MeshStandardMaterial({ map: sailTexture(), roughness: 1, side: THREE.DoubleSide }), ship, 0, 5.24, .14);
  const topSail = mesh(new THREE.PlaneGeometry(2.3, .9, 4, 4), ivory, ship, 0, 7.07, .12); topSail.material = new THREE.MeshStandardMaterial({ color: 0xe4d8b7, side: THREE.DoubleSide, roughness: .9 });
  rod(ship, [-1.3, 7.58, .1], [1.3, 7.58, .1], .04, darkWood);
  rod(ship, [0, 1.8, -2.3], [0, 4.8, -2.3], .065, darkWood); rod(ship, [-1, 4.6, -2.3], [1, 4.6, -2.3], .05, darkWood);
  mesh(new THREE.PlaneGeometry(1.9, 1.4), new THREE.MeshStandardMaterial({ color: 0xb84132, side: THREE.DoubleSide }), ship, 0, 3.9, -2.3);
  const flag = mesh(new THREE.PlaneGeometry(.85, .43), new THREE.MeshStandardMaterial({ color: 0x20272a, side: THREE.DoubleSide }), ship, .4, 7.86, .1); flag.rotation.y = .3;
  const rigging = new THREE.LineBasicMaterial({ color: 0x9c946f, transparent: true, opacity: .8 });
  function rope(a, b) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); ship.add(new THREE.Line(g, rigging)); }
  for (const x of [-1.4, 1.4]) { rope([0, 7.6, .1], [x, 1.9, 1.8]); rope([0, 6.65, .1], [x, 1.9, -1.5]); }
  rope([0, 7.6, .1], [0, 1.85, 3.2]); rope([0, 7.6, .1], [0, 2.75, -2.5]);
  for (let i = 0; i < 10; i++) { const y = 2.1 + i * .3, s = (6.7 - y) / 4.6; rope([-.48 * s, y, -.02], [.48 * s, y, -.02]); } rope([-.48, 2.1, -.02], [0, 6.7, -.02]); rope([.48, 2.1, -.02], [0, 6.7, -.02]);
  ship.position.set(6, -.15, 0); ship.rotation.y = -.6;

  // Three project islands, with different architectural silhouettes.
  const islands = new THREE.Group(); scene.add(islands);
  const sand = mat(0xb4a273), rock = mat(0x446464), grass = mat(0x396e58), trunk = mat(0x6c5433), leaf = mat(0x467c58);
  function palm(parent, x, z, scale = 1) { const group = new THREE.Group(); group.position.set(x, .75, z); group.scale.setScalar(scale); parent.add(group); rod(group, [0, 0, 0], [.18, 2.3, .05], .08, trunk); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(.5, .3, 1.55, -.5); shape.quadraticCurveTo(.6, -.05, 0, 0); const frond = mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0x478465, side: THREE.DoubleSide, roughness: 1 }), group, .18, 2.3, .05); frond.rotation.set(-.45, a, .12); } }
  const islandPositions = [[-7, 0, -7], [0, 0, -13], [8, 0, -6]];
  islandPositions.forEach((p, index) => {
    const island = new THREE.Group(); island.position.set(...p); islands.add(island);
    const base = mesh(new THREE.CylinderGeometry(2.4, 2.9, .7, 11), sand, island, 0, .05, 0); base.scale.z = .8;
    const terrain = mesh(new THREE.IcosahedronGeometry(2.2, 1), grass, island, 0, .4, 0); terrain.scale.set(1, .25, .8);
    for (let i = 0; i < 5; i++) { const stone = mesh(new THREE.DodecahedronGeometry(.55, 0), rock, island, Math.cos(i * 2) * 1.85, .15, Math.sin(i * 2) * 1.3); stone.scale.y = .75; }
    palm(island, -1.1, .4, .75); palm(island, 1.2, -.5, .9);
    if (index === 0) { for (let i = 0; i < 3; i++) { const cube = box(island, .65, .65, .65, gold, -.65 + i * .55, 1.1 + i * .36, -.2); cube.rotation.y = .5; } }
    if (index === 1) { const crystal = mesh(new THREE.OctahedronGeometry(.65), mat(0x6aaebb), island, 0, 1.65, 0); crystal.scale.y = 1.6; mesh(new THREE.TorusGeometry(1.05, .045, 8, 32), gold, island, 0, 1.6, 0).rotation.x = 1; }
    if (index === 2) { box(island, 1.1, 1.8, .3, ivory, 0, 1.65, 0); for (let i = 0; i < 4; i++) box(island, .72, .055, .035, gold, 0, 2.1 - i * .25, .18); }
    const beacon = mesh(new THREE.CylinderGeometry(.022, .022, 6, 6), new THREE.MeshBasicMaterial({ color: [0xe9b85f, 0x93d4d3, 0xc1c48a][index], transparent: true, opacity: .3 }), island, 0, 3.7, 0); beacon.name = 'beacon';
  });
  // Distant land and drifting clouds set the scale of the sea.
  for (let i = 0; i < 12; i++) { const distant = mesh(new THREE.ConeGeometry(3 + (i % 3), 3 + (i % 4), 5), mat(0x284d51), scene, -65 + i * 12, .6, -62 - (i % 3) * 7); distant.scale.x = 1.6; }
  const clouds = new THREE.Group(); scene.add(clouds);
  const cloudCanvas = document.createElement('canvas'); cloudCanvas.width = 256; cloudCanvas.height = 128;
  const cloudContext = cloudCanvas.getContext('2d');
  for (let i = 0; i < 6; i++) { const x = 40 + i * 33, y = 65 + Math.sin(i * 2.8) * 10; const gradient = cloudContext.createRadialGradient(x, y, 0, x, y, 42); gradient.addColorStop(0, 'rgba(194,210,198,.25)'); gradient.addColorStop(.5, 'rgba(194,210,198,.13)'); gradient.addColorStop(1, 'rgba(194,210,198,0)'); cloudContext.fillStyle = gradient; cloudContext.fillRect(0, 0, 256, 128); }
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  for (let i = 0; i < 9; i++) { const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: .55, depthWrite: false, fog: true })); cloud.position.set(-62 + i * 16, 13 + Math.sin(i) * 3, -55 - (i % 3) * 8); cloud.scale.set(25, 6, 1); clouds.add(cloud); }
  const birdMat = new THREE.LineBasicMaterial({ color: 0x273f43 }); const birds = new THREE.Group(); scene.add(birds);
  for (let i = 0; i < 7; i++) { const bird = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.35, 0, 0), new THREE.Vector3(0, -.12, .1), new THREE.Vector3(.35, 0, 0)]), birdMat); bird.position.set(-8 + i * 2.4, 10 + Math.sin(i) * 2, -20 - i * 2); birds.add(bird); }
  // Subtle wake rings under the moving hull.
  const wakes = [];
  for (let i = 0; i < 5; i++) { const ring = mesh(new THREE.RingGeometry(1.9, 1.94, 50), new THREE.MeshBasicMaterial({ color: 0x92cbc3, transparent: true, opacity: .12, side: THREE.DoubleSide }), scene, 6, -.07, 0); ring.rotation.x = -Math.PI / 2; ring.scale.set(.7 + i * .25, 1.6 + i * .4, 1); wakes.push(ring); }

  let enabled = !state.lite, disposed = false, reduced = state.reduced, raf = 0;
  const clock = new THREE.Clock(); let last = 0, elapsed = 0; const target = new THREE.Vector3(); const desiredPos = new THREE.Vector3(); const lookAt = new THREE.Vector3(0, 2, 0); const pointer = new THREE.Vector2();
  function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.3 : 1.65)); }
  function pointerMove(event) { pointer.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5); }
  addEventListener('resize', resize); addEventListener('pointermove', pointerMove, { passive: true });
  camera.position.set(15, 9, 20); camera.lookAt(0, 2, 0);
  function render() {
    if (disposed) return;
    raf = requestAnimationFrame(render);
    const now = clock.getElapsedTime(); const delta = Math.min(now - last, .06); last = now;
    if (!enabled || document.hidden) return;
    if (!reduced) elapsed += delta;
    const mobile = innerWidth < 700;
    const project = state.chapter === 2;
    const p = state.scroll;
    if (project) { desiredPos.set(0, mobile ? 25 : 14, mobile ? 27 : 23); target.set(0, 0, mobile ? -6 : -8); }
    else if (mobile) { desiredPos.set(17, 14, 34); target.set(6, 9.8, 0); }
    else { desiredPos.set(16 + Math.sin(p * .5) * 2, 8.8, 21); target.set(-.5 + Math.sin(p * .4), 3.1, 0); }
    if (!reduced) { desiredPos.x += pointer.x * .6; desiredPos.y -= pointer.y * .3; }
    camera.position.lerp(desiredPos, reduced ? 1 : Math.min(1, delta * 2)); lookAt.lerp(target, reduced ? 1 : Math.min(1, delta * 2)); camera.lookAt(lookAt);
    ship.visible = !project; islands.visible = project;
    islands.children.forEach((island, index) => { const mobilePositions = [[-3, 0, -15], [3, 0, -6], [-1, 0, 3]]; island.position.set(...(mobile ? mobilePositions[index] : islandPositions[index])); island.scale.setScalar(mobile ? .8 : 1); });
    ship.position.y = -.05 + Math.sin(elapsed * .7) * .1; ship.rotation.z = Math.sin(elapsed * .55) * .027; ship.rotation.x = Math.sin(elapsed * .63) * .018; ship.rotation.y = -.64 + Math.sin(p * .4) * .12;
    oceanMat.uniforms.time.value = elapsed; clouds.position.x = Math.sin(elapsed * .015) * 3; birds.position.x = Math.sin(elapsed * .08) * 3;
    wakes.forEach((ring, i) => { ring.visible = !project; ring.material.opacity = .035 + Math.sin(elapsed * .7 - i) * .02; });
    renderer.render(scene, camera);
  }
  render();
  function contextLost(event) { event.preventDefault(); enabled = false; document.body.classList.add('lite'); container.dispatchEvent(new CustomEvent('world-lost')); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  return { setEnabled(value) { enabled = value; }, setReduced(value) { reduced = value; }, dispose() { disposed = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', pointerMove); scene.traverse(obj => { obj.geometry?.dispose(); if (obj.material) { const materials = Array.isArray(obj.material) ? obj.material : [obj.material]; materials.forEach(m => { m.map?.dispose(); m.dispose(); }); } }); renderer.dispose(); } };
}
