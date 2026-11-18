/* K-7 cargo robot — procedural Three.js model */
(function () {
'use strict';
var host = document.getElementById('viewer');
if (!window.THREE) { document.getElementById('loading').textContent = '3Dライブラリを読み込めませんでした'; return; }
var T = THREE;

/* ---------- renderer / scene ---------- */
var renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
host.insertBefore(renderer.domElement, host.firstChild);

var scene = new T.Scene();
scene.background = new T.Color(0x0b0c0d);
scene.fog = new T.Fog(0x0b0c0d, 2.4, 6);
var pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;

var camera = new T.PerspectiveCamera(32, 1, 0.05, 30);
camera.position.set(1.25, 0.75, 1.35);
var controls = new T.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.22, 0);
controls.enableDamping = true; controls.minDistance = 0.6; controls.maxDistance = 4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
renderer.domElement.addEventListener('pointerdown', function () { controls.autoRotate = false; });

var key = new T.DirectionalLight(0xfff1dc, 2.4);
key.position.set(1.6, 2.6, 1.2); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
var sc = key.shadow.camera; sc.left = -1; sc.right = 1; sc.top = 1; sc.bottom = -1; sc.near = 0.5; sc.far = 6;
scene.add(key);
var rim = new T.DirectionalLight(0x6fa8ff, 1.3); rim.position.set(-1.8, 1.2, -1.6); scene.add(rim);
var warm = new T.PointLight(0xff7a30, 1.2, 3); warm.position.set(-0.9, 0.35, 0.9); scene.add(warm);
scene.add(new T.HemisphereLight(0x8a9bb0, 0x1a1410, 0.35));

/* ---------- procedural textures ---------- */
function rnd(a) { var s = a || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function canvasTex(w, h, draw, srgb) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 8; if (srgb) t.encoding = T.sRGBEncoding; return t;
}
function grime(base, seed, chips) {
  return function (g, w, h) {
    var r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 900; i++) { // soft blotches
      var x = r() * w, y = r() * h, s = 4 + r() * 40;
      var gr = g.createRadialGradient(x, y, 0, x, y, s);
      gr.addColorStop(0, 'rgba(60,45,30,' + (0.05 + r() * 0.08) + ')'); gr.addColorStop(1, 'rgba(60,45,30,0)');
      g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2);
    }
    for (i = 0; i < 160; i++) { // drip streaks
      var sx = r() * w, sy = r() * h * 0.6, len = 30 + r() * 160;
      var lg = g.createLinearGradient(sx, sy, sx, sy + len);
      lg.addColorStop(0, 'rgba(40,30,20,' + (0.1 + r() * 0.15) + ')'); lg.addColorStop(1, 'rgba(40,30,20,0)');
      g.fillStyle = lg; g.fillRect(sx, sy, 1 + r() * 3, len);
    }
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 0.6;
    for (i = 0; i < 260; i++) { // scratches
      var ax = r() * w, ay = r() * h, an = r() * 6.28, l = 4 + r() * 26;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + Math.cos(an) * l, ay + Math.sin(an) * l); g.stroke();
    }
    if (chips) for (i = 0; i < chips; i++) { // paint chips showing metal
      var cx = r() * w, cy = r() * h, cs = 1 + r() * 6;
      g.fillStyle = 'rgba(120,118,112,0.95)'; g.beginPath();
      for (var k = 0; k < 7; k++) { var a = k / 7 * 6.28, rr = cs * (0.5 + r()); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.fill();
    }
  };
}
function roughFrom(seed, base) {
  return canvasTex(512, 512, function (g, w, h) {
    var r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 4000; i++) { var v = Math.floor(100 + r() * 155); g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.12)'; g.fillRect(r() * w, r() * h, 1 + r() * 8, 1 + r() * 8); }
    g.strokeStyle = 'rgba(40,40,40,0.5)'; g.lineWidth = 0.7;
    for (i = 0; i < 300; i++) { var x = r() * w, y = r() * h, a = r() * 6.28, l = 5 + r() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  });
}
var texCeramic = canvasTex(1024, 1024, grime('#d9d2c2', 7, 110), true);
var texRed = canvasTex(512, 512, grime('#8e231b', 11, 160), true);
var texGun = canvasTex(512, 512, grime('#3b3f44', 5, 0), true);
var roughA = roughFrom(3, '#7a7a7a'), roughB = roughFrom(9, '#555');
var texHazard = canvasTex(512, 64, function (g, w, h) {
  g.fillStyle = '#161616'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6b422';
  for (var x = -h; x < w + h; x += 48) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 24, h); g.lineTo(x + 24 + h, 0); g.lineTo(x + h, 0); g.fill(); }
  grime('rgba(0,0,0,0)', 21, 90)(g, w, h);
}, true);
function decal(lines, color, w, h) {
  return canvasTex(w || 512, h || 256, function (g, W, H) {
    g.clearRect(0, 0, W, H); g.fillStyle = color || '#1b1b1b'; g.textBaseline = 'top';
    lines.forEach(function (l) { g.font = l[0]; g.fillText(l[1], l[2], l[3]); });
    g.globalCompositeOperation = 'destination-out'; var r = rnd(33);
    for (var i = 0; i < 500; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.8 + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 4, 1 + r() * 3); }
  }, true);
}
var texFloor = canvasTex(1024, 1024, function (g, w, h) {
  g.fillStyle = '#2a2b2c'; g.fillRect(0, 0, w, h);
  var r = rnd(17), n = 8, s = w / n;
  for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
    var v = 36 + Math.floor(r() * 14); g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 2) + ')';
    g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
  }
  grime('rgba(0,0,0,0)', 41, 0)(g, w, h);
}, true);
texFloor.repeat.set(4, 4);

/* ---------- materials ---------- */
var M = {
  ceramic: new T.MeshPhysicalMaterial({ map: texCeramic, roughnessMap: roughA, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5 }),
  red: new T.MeshPhysicalMaterial({ map: texRed, roughnessMap: roughA, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
  gun: new T.MeshStandardMaterial({ map: texGun, roughnessMap: roughB, roughness: 0.55, metalness: 0.85 }),
  dark: new T.MeshStandardMaterial({ color: 0x17181a, roughness: 0.7, metalness: 0.4 }),
  brass: new T.MeshStandardMaterial({ color: 0xb8925a, roughnessMap: roughA, roughness: 0.35, metalness: 1 }),
  steel: new T.MeshStandardMaterial({ color: 0xa8acb0, roughnessMap: roughB, roughness: 0.3, metalness: 1 }),
  rubber: new T.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }),
  hazard: new T.MeshStandardMaterial({ map: texHazard, roughness: 0.6, metalness: 0.1 }),
  glass: new T.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 1 }),
  amber: new T.MeshStandardMaterial({ color: 0x331a00, emissive: 0xffa53a, emissiveIntensity: 2.4 }),
  lamp: new T.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2a1a, emissiveIntensity: 2 }),
  cableR: new T.MeshStandardMaterial({ color: 0x7a1d17, roughness: 0.6 }),
  cableK: new T.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.55 }),
  cableY: new T.MeshStandardMaterial({ color: 0xc89a2a, roughness: 0.6 })
};

Object.keys(M).forEach(function (k) { if (M[k].envMapIntensity === 1) M[k].envMapIntensity = 0.55; });
/* ---------- helpers ---------- */
function mesh(geo, mat, parent, x, y, z) {
  var m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m;
}
function rbox(w, h, d, r, mat, parent, x, y, z) { return mesh(new T.RoundedBoxGeometry(w, h, d, 3, r), mat, parent, x, y, z); }
function cyl(rt, rb, h, mat, parent, x, y, z, seg) { return mesh(new T.CylinderGeometry(rt, rb, h, seg || 40), mat, parent, x, y, z); }
function grp(parent, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
function bolts(parent, pts, axis, r) { // hex bolt heads
  var geo = new T.CylinderGeometry(r || 0.0045, r || 0.0045, 0.003, 6);
  pts.forEach(function (p) {
    var b = mesh(geo, M.steel, parent, p[0], p[1], p[2]); b.castShadow = false;
    if (axis === 'x') b.rotation.z = Math.PI / 2; else if (axis === 'z') b.rotation.x = Math.PI / 2;
  });
}
function plateLink(len, w, t, holes, mat) { // CNC link plate with lightening holes, along +Y from origin
  var s = new T.Shape(), r = w / 2;
  s.absarc(0, 0, r, Math.PI, 0, true); s.lineTo(r, len); s.absarc(0, len, r, 0, Math.PI, false); s.lineTo(-r, 0);
  var hp = new T.Path(); hp.absarc(0, 0, r * 0.32, 0, Math.PI * 2, true); s.holes.push(hp);
  hp = new T.Path(); hp.absarc(0, len, r * 0.32, 0, Math.PI * 2, true); s.holes.push(hp);
  for (var i = 0; i < holes; i++) {
    var cy = len * (i + 1) / (holes + 1), hh = len / (holes + 1) * 0.36;
    var p = new T.Path(); p.moveTo(-r * 0.45, cy - hh); p.lineTo(r * 0.45, cy - hh * 0.6); p.lineTo(r * 0.45, cy + hh * 0.6); p.lineTo(-r * 0.45, cy + hh); p.lineTo(-r * 0.45, cy - hh);
    s.holes.push(p);
  }
  var g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -t / 2); return new T.Mesh(g, mat);
}
function cable(parent, pts, rad, mat) {
  var c = new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
  return mesh(new T.TubeGeometry(c, 48, rad, 8, false), mat, parent);
}
function glowSprite(color, size, parent, x, y, z) {
  var t = canvasTex(128, 128, function (g) {
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  var sp = new T.Sprite(new T.SpriteMaterial({ map: t, color: color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  sp.scale.set(size, size, 1); sp.position.set(x || 0, y || 0, z || 0); parent.add(sp); return sp;
}

/* ---------- ground ---------- */
var floor = mesh(new T.PlaneGeometry(12, 12), new T.MeshStandardMaterial({ map: texFloor, roughness: 0.9, metalness: 0.05, envMapIntensity: 0.3, color: 0x9a9a9a }), scene);
floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
camera.position.set(1.3, 0.72, 1.45); controls.target.set(0, 0.24, 0);

var robot = grp(scene), chassis = grp(robot);
var contacts = [];
function contact(o, r, g, ring) { contacts.push({ o: o, r: r, g: g, ring: !!ring }); }
var BW = 0.22, BH = 0.23, BL = 0.23, TOP = BH / 2;
var Y1 = new T.Vector3(0, 1, 0);
function sideFrameGeo() { // rounded-square side plate with the wheel opening
  var h = BH / 2, r = 0.045, sh = new T.Shape();
  sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.absarc(h - r, -h + r, r, -Math.PI / 2, 0); sh.lineTo(h, h - r); sh.absarc(h - r, h - r, r, 0, Math.PI / 2);
  sh.lineTo(-h + r, h); sh.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI); sh.lineTo(-h, -h + r); sh.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5);
  var hole = new T.Path(); hole.absarc(0, 0, 0.1075, 0, Math.PI * 2, true); sh.holes.push(hole);
  return new T.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 3, curveSegments: 64 });
}
function annulusGeo(r0, r1, t) {
  var sh = new T.Shape(); sh.absarc(0, 0, r1, 0, Math.PI * 2, false);
  var h = new T.Path(); h.absarc(0, 0, r0, 0, Math.PI * 2, true); sh.holes.push(h);
  var g = new T.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 72 });
  g.translate(0, 0, -t / 2); g.rotateY(Math.PI / 2); return g;
}
function orient(m, a, b) { // unit-height mesh along Y, stretched from a to b
  var d = new T.Vector3().subVectors(b, a), len = d.length();
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(Y1, d.normalize()); m.scale.set(1, len, 1);
}

/* ---------- body: compact shell with a cargo well in the top ---------- */
rbox(BW - 0.02, 0.14, BL - 0.01, 0.035, M.gun, chassis, 0, -0.04, 0);       // lower core
[-1, 1].forEach(function (s) {
  rbox(0.042, 0.1, BL - 0.01, 0.012, M.gun, chassis, s * 0.081, 0.06, 0);    // upper side blocks (wheel bays live here)
  var fr = mesh(sideFrameGeo(), M.ceramic, chassis, s > 0 ? BW / 2 - 0.012 : -BW / 2, 0, 0); fr.rotation.y = Math.PI / 2;
  var rec = mesh(new T.CircleGeometry(0.107, 64), M.dark, chassis, s * 0.1035, 0, 0); rec.rotation.y = s * Math.PI / 2; rec.castShadow = false;
  bolts(chassis, [[s * (BW / 2 + 0.001), 0.1, 0.1], [s * (BW / 2 + 0.001), -0.1, 0.1], [s * (BW / 2 + 0.001), 0.1, -0.1], [s * (BW / 2 + 0.001), -0.1, -0.1]], 'x', 0.0035);
  for (var i = 0; i < 4; i++) rbox(0.004, 0.006, 0.04, 0.002, M.dark, chassis, s * (BW / 2 + 0.001), -0.07 - i * 0.011, -0.055);
  rbox(0.004, 0.01, 0.018, 0.002, M.amber, chassis, s * (BW / 2 + 0.001), 0.1, -0.075).castShadow = false;
});
rbox(0.12, 0.1, 0.044, 0.01, M.gun, chassis, 0, 0.06, 0.088);   // front block of the well
rbox(0.12, 0.1, 0.044, 0.01, M.gun, chassis, 0, 0.06, -0.088);  // rear block
var well = mesh(new T.PlaneGeometry(0.12, 0.13), M.dark, chassis, 0, 0.065, 0); well.rotation.x = -Math.PI / 2;
// top frame around the well
rbox(BW - 0.004, 0.012, 0.05, 0.005, M.ceramic, chassis, 0, TOP - 0.004, 0.088);
rbox(BW - 0.004, 0.012, 0.05, 0.005, M.ceramic, chassis, 0, TOP - 0.004, -0.088);
[-1, 1].forEach(function (s) { rbox(0.05, 0.012, 0.13, 0.005, M.ceramic, chassis, s * 0.085, TOP - 0.004, 0); });
var lidHinge = grp(chassis, 0, TOP + 0.004, -0.064), lid = grp(lidHinge);
rbox(0.124, 0.01, 0.13, 0.004, M.red, lid, 0, 0, 0.065);
var hz = mesh(new T.PlaneGeometry(0.11, 0.016), M.hazard, lid, 0, 0.0055, 0.11); hz.rotation.x = -Math.PI / 2; hz.castShadow = false;
cyl(0.005, 0.005, 0.126, M.steel, lidHinge).rotation.z = Math.PI / 2;
var slot = grp(chassis, 0, 0.031 + 0.024, 0);
// front face + eye
rbox(BW - 0.012, BH - 0.012, 0.016, 0.03, M.ceramic, chassis, 0, 0, BL / 2);
rbox(0.13, 0.1, 0.01, 0.012, M.dark, chassis, 0, 0.032, BL / 2 + 0.008);
var eye = grp(chassis, 0, 0.034, BL / 2 + 0.012); eye.rotation.x = Math.PI / 2;
cyl(0.044, 0.047, 0.026, M.brass, eye, 0, 0.004, 0);
cyl(0.037, 0.037, 0.03, M.dark, eye, 0, 0.006, 0);
var iris = mesh(new T.TorusGeometry(0.018, 0.004, 16, 48), M.amber, eye, 0, 0.016, 0); iris.rotation.x = Math.PI / 2; iris.castShadow = false;
cyl(0.006, 0.006, 0.004, M.amber, eye, 0, 0.017, 0).castShadow = false;
mesh(new T.SphereGeometry(0.035, 48, 24, 0, Math.PI * 2, 0, 0.55), M.glass, eye, 0, -0.011, 0).castShadow = false;
for (var b = 0; b < 8; b++) { var ba = b / 8 * Math.PI * 2; bolts(eye, [[Math.cos(ba) * 0.041, 0.018, Math.sin(ba) * 0.041]], 'y', 0.0026); }
var eyeGlow = glowSprite(0xff9a30, 0.11, chassis, 0, 0.034, BL / 2 + 0.04);
[-1, 1].forEach(function (s) { cyl(0.005, 0.005, 0.006, M.lamp, chassis, s * 0.05, 0.075, BL / 2 + 0.01).rotation.x = Math.PI / 2; });
rbox(BW - 0.004, 0.03, 0.03, 0.01, M.red, chassis, 0, -0.072, BL / 2 + 0.002);
var hz2 = mesh(new T.PlaneGeometry(0.19, 0.016), M.hazard, chassis, 0, -0.072, BL / 2 + 0.0175); hz2.castShadow = false;
// antenna + beacon at rear
cyl(0.0035, 0.0025, 0.15, M.steel, chassis, -0.085, TOP + 0.08, -0.09, 8);
var beacon = mesh(new T.SphereGeometry(0.007, 16, 12), M.lamp, chassis, -0.085, TOP + 0.158, -0.09); beacon.castShadow = false;
var beaconGlow = glowSprite(0xff2a1a, 0.07, chassis, -0.085, TOP + 0.158, -0.09);
// skids (contact when wheels are stowed)
[[0.07, 0.08, 'f'], [-0.07, 0.08, 'f'], [0.07, -0.08, 'r'], [-0.07, -0.08, 'r']].forEach(function (p) {
  var k = rbox(0.026, 0.008, 0.04, 0.003, M.rubber, chassis, p[0], -BH / 2 - 0.002, p[1]); contact(k, 0.004, p[2]);
});

/* ---------- internals (Loop 5 packaging, see calc/budget.py) ---------- */
var IM = {
  batt: new T.MeshStandardMaterial({ color: 0x2b5d8a, emissive: 0x2b5d8a, emissiveIntensity: 0.6, roughness: 0.5 }),
  pcb: new T.MeshStandardMaterial({ color: 0x1f5d3a, emissive: 0x2f9d5a, emissiveIntensity: 0.6, roughness: 0.6 }),
  chip: new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
};
var internals = grp(chassis);
[[0, -0.075, -0.096, 0.105, 0.035, 0.018, 'batt'], [0, -0.075, -0.076, 0.105, 0.035, 0.018, 'batt'],
 [0, 0.07, -0.092, 0.085, 0.056, 0.004, 'pcb'], [0, -0.005, -0.03, 0.09, 0.004, 0.06, 'pcb'],
 [0, -0.04, 0, 0.02, 0.005, 0.02, 'chip'], [-0.03, -0.085, 0.098, 0.015, 0.01, 0.01, 'chip'], [0.03, -0.085, 0.098, 0.015, 0.01, 0.01, 'chip']
].forEach(function (b) { mesh(new T.BoxGeometry(b[3], b[4], b[5]), IM[b[6]], internals, b[0], b[1], b[2]); });
rbox(0.06, 0.04, 0.016, 0.003, M.steel, internals, 0, 0.07, -0.08);            // Kakip heatsink
rbox(0.04, 0.04, 0.025, 0.004, IM.chip, internals, 0, 0.034, 0.09);            // camera module
[-1, 1].forEach(function (s) { cyl(0.014, 0.014, 0.034, M.dark, internals, s * 0.035, 0.04, 0).rotation.x = Math.PI / 2; }); // slide steppers
internals.visible = false;
var SHELL = [M.ceramic, M.gun, M.red];
function setXray(on) {
  SHELL.forEach(function (m) { m.transparent = on; m.opacity = on ? 0.18 : 1; m.depthWrite = !on; m.needsUpdate = true; });
  internals.visible = on;
}
var xb = document.getElementById('xray');
if (xb) xb.addEventListener('click', function () { var on = xb.getAttribute('aria-pressed') !== 'true'; xb.setAttribute('aria-pressed', on ? 'true' : 'false'); setXray(on); });

/* ---------- hubless wheels ---------- */
var RO = 0.105, RIN = 0.072, RW = 0.032, LINK = 0.07;
function lathe(pts) { var g = new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), 96); g.rotateZ(Math.PI / 2); return g; }
var rimGeo = lathe([[RIN, -0.013], [0.09, -0.013], [0.09, 0.013], [RIN, 0.013], [RIN, -0.013]]);
var tirePts = [[0.088, -RW / 2]], rr = 0.01;
for (var q = 0; q <= 8; q++) { var qa = -Math.PI / 2 + q / 8 * Math.PI / 2; tirePts.push([RO - rr + Math.cos(qa) * rr, -RW / 2 + rr + Math.sin(qa) * rr]); }
for (q = 0; q <= 8; q++) { qa = q / 8 * Math.PI / 2; tirePts.push([RO - rr + Math.cos(qa) * rr, RW / 2 - rr + Math.sin(qa) * rr]); }
tirePts.push([0.088, RW / 2]);
var tireGeo2 = lathe(tirePts);
function ringInstances(geo, mat, n, rad, xoff, alt) {
  var im = new T.InstancedMesh(geo, mat, n), m4 = new T.Matrix4(), qq = new T.Quaternion(), e = new T.Euler();
  for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; e.set(a, 0, 0); qq.setFromEuler(e);
    m4.compose(new T.Vector3(alt ? ((i % 2) - 0.5) * alt : xoff, Math.cos(a) * rad, Math.sin(a) * rad), qq, new T.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }
  im.castShadow = true; return im;
}
var wheels = [];
[-1, 1].forEach(function (s) {
  var root = grp(chassis), steer = grp(root), camber = grp(steer), spin = grp(camber);
  mesh(rimGeo, M.gun, spin); mesh(tireGeo2, M.rubber, spin);
  spin.add(ringInstances(new T.BoxGeometry(RW * 0.75, 0.006, 0.014), M.rubber, 44, RO + 0.0015, 0, 0.006));
  spin.add(ringInstances(new T.BoxGeometry(0.02, 0.005, 0.005), M.brass, 60, RIN - 0.002, 0));
  for (var k = 0; k < 6; k++) { // spinning LED segments on the outer face
    var led = mesh(new T.TorusGeometry(0.081, 0.0018, 6, 12, 0.6), M.amber, spin, s * 0.0135, 0, 0);
    led.rotation.set(0, Math.PI / 2, k / 6 * Math.PI * 2); led.castShadow = false;
  }
  // non-rotating carrier: gimbal block + three rollers riding on the inner rim
  var block = rbox(0.02, 0.05, 0.05, 0.006, M.red, camber, -s * 0.03, 0, 0);
  var pin = cyl(0.008, 0.008, 0.07, M.steel, camber, -s * 0.03, 0, 0); pin.rotation.x = Math.PI / 2;
  cyl(0.012, 0.012, 0.02, M.dark, steer, -s * 0.03, 0.03, 0);
  [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 - 2.094].forEach(function (a, idx) {
    var p = new T.Vector3(0, Math.sin(a) * (RIN - 0.009), Math.cos(a) * (RIN - 0.009));
    var arm = mesh(new T.BoxGeometry(0.012, 1, 0.012), M.gun, camber); orient(arm, new T.Vector3(-s * 0.024, 0, 0), p);
    var rl = cyl(0.009, 0.009, 0.022, idx === 0 ? M.red : M.brass, camber, p.x, p.y, p.z); rl.rotation.z = Math.PI / 2;
  });
  // non-rotating outer fairing: flush with the side frame when stowed, keeps fingers out of the ring
  mesh(annulusGeo(0.075, 0.104, 0.005), M.ceramic, camber, s * (RW / 2 + 0.0045), 0, 0);
  var fd = mesh(new T.PlaneGeometry(0.05, 0.016), new T.MeshStandardMaterial({ map: decal([['bold 150px Oswald, sans-serif', 'К-7 MkIII', 20, 30]], '#2a2522', 512, 160), transparent: true, roughness: 0.6 }), camber, s * (RW / 2 + 0.0078), 0.0895, 0);
  fd.rotation.y = s * Math.PI / 2; fd.castShadow = false;
  var red = mesh(annulusGeo(0.098, 0.104, 0.0052), M.red, camber, s * (RW / 2 + 0.0047), 0, 0); red.scale.set(1, 1, 1);
  var mot = cyl(0.011, 0.011, 0.03, M.dark, camber, -s * 0.012, RIN - 0.02, 0); mot.rotation.z = Math.PI / 2;
  var gimbalPt = grp(steer, -s * 0.03, 0.04, 0);
  var rods = [-1, 1].map(function (z) {
    return { z: z * 0.03, rod: mesh(new T.CylinderGeometry(0.0055, 0.0055, 1, 12), M.steel, chassis) };
  });
  var stage = mesh(new T.BoxGeometry(0.014, 1, 0.022), M.gun, chassis);
  var pivotBox = rbox(0.03, 0.03, 0.03, 0.005, M.dark, chassis);
  contact(camber, RO, 'r', true);
  wheels.push({ s: s, root: root, steer: steer, camber: camber, spin: spin, pt: gimbalPt, rods: rods, stage: stage, pivot: pivotBox, dy: 0, ang: 0 });
});

/* ---------- arms ---------- */
function servoBox(parent) {
  var g = grp(parent);
  rbox(0.04, 0.052, 0.032, 0.005, M.dark, g);
  rbox(0.042, 0.018, 0.034, 0.005, M.red, g, 0, 0.011, 0);
  cyl(0.012, 0.012, 0.046, M.brass, g).rotation.z = Math.PI / 2;
  return g;
}
function halfJaw(parent, sgn, R) {
  var j = grp(parent);
  var t = mesh(new T.TorusGeometry(R, 0.009, 14, 32, Math.PI), M.rubber, j, 0, R, 0); t.rotation.set(0, Math.PI / 2, sgn > 0 ? Math.PI / 2 : -Math.PI / 2);
  var d = mesh(new T.CylinderGeometry(R * 0.85, R * 0.85, 0.014, 32, 1, false, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), M.gun, j, 0, R, 0); d.rotation.z = Math.PI / 2;
  var c = mesh(new T.CylinderGeometry(R * 0.5, R * 0.5, 0.02, 24, 1, false, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), M.red, j, 0, R, 0); c.rotation.z = Math.PI / 2;
  for (var i = 0; i < 3; i++) rbox(0.018, 0.005, 0.005, 0.002, M.brass, j, 0, R - 0.016 + i * 0.016, sgn * 0.003);
  return j;
}
var AL1 = 0.065, AL2 = 0.065, BALL = 0.012;
var arms = [];
[-1, 1].forEach(function (s) {
  var root = grp(chassis, s * 0.075, -0.045, BL / 2 + 0.03), yaw = grp(root);
  rbox(0.05, 0.05, 0.022, 0.008, M.gun, chassis, s * 0.075, -0.045, BL / 2 + 0.012);
  servoBox(yaw);
  var pitch = grp(yaw);
  [-1, 1].forEach(function (k) { var p = plateLink(AL1, 0.03, 0.005, 1, M.gun); p.rotation.y = Math.PI / 2; p.position.x = k * 0.018; p.castShadow = true; pitch.add(p); });
  rbox(0.024, 0.03, 0.018, 0.007, M.ceramic, pitch, 0, AL1 / 2, 0);
  var elbow = grp(pitch, 0, AL1, 0); servoBox(elbow);
  [-1, 1].forEach(function (k) { var p = plateLink(AL2, 0.028, 0.005, 1, M.gun); p.rotation.y = Math.PI / 2; p.position.x = k * 0.016; p.castShadow = true; elbow.add(p); });
  rbox(0.02, 0.028, 0.016, 0.006, M.red, elbow, 0, AL2 / 2, 0);
  var wrist = grp(elbow, 0, AL2, 0); servoBox(wrist);
  rbox(0.02, 0.026, 0.026, 0.005, M.gun, wrist, 0, 0.022, 0);
  cyl(0.017, 0.013, 0.014, M.dark, wrist, 0, 0.03, 0);                       // caster housing
  var ball = mesh(new T.SphereGeometry(BALL, 24, 16), M.steel, wrist, 0, 0.035 + 0.004, 0);
  var jA = grp(wrist, 0, 0.026, 0.013), jB = grp(wrist, 0, 0.026, -0.013);    // mini claws for light items
  rbox(0.006, 0.026, 0.004, 0.0015, M.brass, jA, 0, 0.013, 0); rbox(0.006, 0.026, 0.004, 0.0015, M.brass, jB, 0, 0.013, 0);
  var center = grp(wrist, 0, 0.035 + 0.004, 0);
  contact(center, BALL, 'f'); center.userData.k = s > 0 ? 'l' : 'r';
  cable(chassis, [[s * 0.1, -0.02, BL / 2 + 0.005], [s * 0.11, -0.03, BL / 2 + 0.03], [s * 0.095, -0.045, BL / 2 + 0.035]], 0.003, s > 0 ? M.cableY : M.cableR);
  arms.push({ yaw: yaw, pitch: pitch, elbow: elbow, wrist: wrist, jA: jA, jB: jB, center: center });
});

/* ---------- cargo ---------- */
function crate(parent, sz) {
  var g = grp(parent);
  rbox(sz, sz * 0.8, sz, 0.004, M.gun, g);
  rbox(sz * 1.02, sz * 0.16, sz * 1.02, 0.003, M.hazard, g);
  rbox(sz * 0.16, sz * 0.82, sz * 1.02, 0.003, M.red, g);
  return g;
}
var cargo = crate(scene, 0.035); cargo.position.set(0.25, 0.014, 0.42);
var spare = crate(scene, 0.12); spare.position.set(-0.7, 0.048, -0.6); spare.rotation.y = 0.5;
var spare2 = crate(scene, 0.09); spare2.position.set(-0.62, 0.036, -0.42); spare2.rotation.y = -0.3;
/* ---------- poses ---------- */
var ARM_READY = { l1: 1.0, l2: 1.2, l3: 0.5, ly: 0.15, r1: 1.0, r2: 1.2, r3: 0.5, ry: 0.15, lp: 0, rp: 0 };
function P() {
  var b = { d: 1, pitch: 0, roll: 0, level: 0, wob: 0, camber: 0, steer: 0, spin: 0, orbit: 0, lid: 0,
    l1: 1.833, l2: 1.838, l3: -0.53, lj: 0, ly: 0.15, lp: 1, r1: 1.833, r2: 1.838, r3: -0.53, rj: 0, ry: 0.15, rp: 1 };
  for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) b[k] = arguments[i][k];
  return b;
}
var POSES = {
  stance: P(),
  balance: P(ARM_READY, { wob: 1 }),
  turn: P({ roll: -0.16, camber: 0.2, steer: 0.2, orbit: 1, ly: 0.1, ry: 0.45 }),
  stow: P({ d: 0, level: 1, lp: 0, rp: 0, l1: 0, l2: 3.1, l3: 3.1, ly: 0, r1: 0, r2: 3.1, r3: 3.1, ry: 0 }),
  carry: P(ARM_READY, { d: 0, level: 1 })
};
var CARRY_SEQ = [ // grounded: pick a light item, show it to the camera, put it back
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.045, l2: 1.55, l3: 0.547, lj: 0.9, ly: 0.1 }) },
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.045, l2: 1.55, l3: 0.547, lj: 0, ly: 0.1 }), ev: 'grab' },
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.48, l2: -1.6, l3: 1.69, ly: -0.7 }) },
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.48, l2: -1.6, l3: 1.69, ly: -0.7 }) },
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.045, l2: 1.55, l3: 0.547, ly: 0.1 }) },
  { p: P(ARM_READY, { d: 0, level: 1, l1: 1.045, l2: 1.55, l3: 0.547, lj: 0.9, ly: 0.1 }), ev: 'release' },
  { p: P(ARM_READY, { d: 0, level: 1 }) }
];
var LABEL = { stance: 'STANCE — 2輪＋アーム補助輪', balance: 'BALANCE — 2輪倒立', turn: 'TURN — アーム接地キャンバー旋回', stow: 'STOW — 全格納', carry: 'LAND — 着地してアーム作業' };

/* ---------- kinematics + grounding ---------- */
function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
var plant = { l: 0, r: 0 }, corr = 0, tmp = new T.Vector3(), nrm = new T.Vector3(), orbitAng = 0, heading = 0, rpos = new T.Vector3();
function ringLow(c) {
  c.o.getWorldPosition(tmp); nrm.set(1, 0, 0).transformDirection(c.o.matrixWorld);
  return tmp.y - c.r * Math.sqrt(Math.max(0, 1 - nrm.y * nrm.y)) - RW / 2 * Math.abs(nrm.y);
}
function low(c) { return c.ring ? ringLow(c) : c.o.getWorldPosition(tmp).y - c.r; }
function apply(p, t) {
  var wob = p.wob * Math.sin(t * 1.7);
  [['r', arms[0]], ['l', arms[1]]].forEach(function (e) {
    var k = e[0], a = e[1];
    a.yaw.rotation.y = (k === 'l' ? 1 : -1) * p[k + 'y'];
    var o = plant[k]; a.pitch.rotation.x = p[k + '1'] + o - wob * 0.05; a.elbow.rotation.x = p[k + '2']; a.wrist.rotation.x = p[k + '3'] - o;
    a.jA.rotation.x = p[k + 'j'] * 0.6; a.jB.rotation.x = -p[k + 'j'] * 0.6;
  });
  var slide = smooth(p.d / 0.6), out = smooth((p.d - 0.6) / 0.4);
  if (p.d < 0.9) wheels.forEach(function (w) { w.dy *= 0.9; });
  ['l', 'r'].forEach(function (k) { if (p[k + 'p'] < 0.05) plant[k] *= 0.85; });
  lidHinge.rotation.x = -p.lid;
  robot.position.set(rpos.x, 0, rpos.z); robot.rotation.y = heading;
  for (var it = 0; it < 5; it++) {
    chassis.rotation.set(p.pitch + wob * 0.035 + corr * p.level, 0, p.roll);
    wheels.forEach(function (w) {
      var yy = Math.max(-0.068, Math.min(0, (-0.06 + w.dy) * out)), th = Math.asin(-yy / LINK);
      w.root.position.set(w.s * (0.087 + 0.068 * slide), yy, LINK * (1 - Math.cos(th)));
      w.steer.rotation.y = p.steer * out; w.camber.rotation.z = -p.camber * out;
    });
    robot.updateMatrixWorld(true);
    if (out > 0.9) { // active suspension: equalise both rings on the floor
      var a = ringLow(contacts[contacts.length - 4]), b = ringLow(contacts[contacts.length - 3]);
      var diff = a - b; wheels[0].dy -= diff / 2; wheels[1].dy += diff / 2;
      wheels.forEach(function (w) { w.dy = Math.max(-0.07, Math.min(0.07, w.dy)); });
    }
    [['r', 6], ['l', 7]].forEach(function (e) { // keep planted arm wheels on the floor
      var k = e[0], pw = p[k + 'p']; if (pw < 0.05 || it === 0) return;
      var ref = Math.min(ringLow(contacts[4]), ringLow(contacts[5]));
      plant[k] = Math.max(-0.6, Math.min(0.6, plant[k] + (low(contacts[e[1]]) - ref) * 5 * pw));
      var a = k === 'l' ? arms[1] : arms[0]; a.pitch.rotation.x = p[k + '1'] + plant[k]; a.wrist.rotation.x = p[k + '3'] - plant[k];
    });
    if (p.level > 0.01) {
      var f = 1e9, r = 1e9;
      contacts.forEach(function (c) { var y = low(c); if (c.g === 'f') f = Math.min(f, y); else r = Math.min(r, y); });
      corr = Math.max(-0.6, Math.min(0.6, corr + (f - r) / 0.35));
    }
  }
  var m = 1e9; contacts.forEach(function (c) { m = Math.min(m, low(c)); });
  robot.position.y = -m; robot.updateMatrixWorld(true);
  wheels.forEach(function (w) { // lateral slide rails + short vertical stage
    w.pt.getWorldPosition(tmp); chassis.worldToLocal(tmp);
    w.rods.forEach(function (r) { orient(r.rod, new T.Vector3(w.s * 0.05, 0.04, r.z), new T.Vector3(tmp.x, 0.04, r.z)); });
    var pv = new T.Vector3(tmp.x, 0.04, w.root.position.z + LINK * Math.cos(Math.asin(Math.min(1, -w.root.position.y / LINK))));
    w.pivot.position.copy(pv); orient(w.stage, pv, tmp.clone());
  });
}

/* ---------- animation ---------- */
var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var cur = P(), mode = 'stance', seq = [], segFrom = cur, segStart = 0, DUR = 1.15, drop = null;
function lerpPose(a, b, t) { var o = {}; for (var k in b) o[k] = a[k] + (b[k] - a[k]) * t; return o; }
function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function setUI(m) {
  document.querySelectorAll('.modes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m ? 'true' : 'false'); });
  document.getElementById('status').textContent = 'MODE: ' + LABEL[m];
}
function placeCrate() {
  scene.attach(cargo);
  var save = corr, sdy = wheels.map(function (w) { return w.dy; });
  apply(CARRY_SEQ[0].p, 0); arms[1].center.getWorldPosition(tmp);
  cargo.position.set(tmp.x, 0.014, tmp.z); cargo.quaternion.setFromEuler(new T.Euler(0, heading, 0));
  corr = save; wheels.forEach(function (w, i) { w.dy = sdy[i]; }); apply(cur, 0);
}
function fire(ev) {
  if (ev === 'place') placeCrate();
  if (ev === 'grab') arms[1].center.attach(cargo);
  if (ev === 'release') { scene.attach(cargo); drop = { t0: performance.now() / 1000, p0: cargo.position.clone(), q0: cargo.quaternion.clone(), to: new T.Vector3(cargo.position.x, 0.014, cargo.position.z), qt: new T.Quaternion().setFromEuler(new T.Euler(0, heading, 0)) }; }
}
function go(m) {
  if (seq.length && mode === 'carry' && seq.length > 1) return;
  var list = [];
  if (m === 'carry') {
    list.push({ p: POSES.carry, ev: 'place' });
    list = list.concat(CARRY_SEQ);
  } else list.push({ p: POSES[m] });
  mode = m; setUI(m);
  if (reduce) {
    list.forEach(function (s) { cur = s.p; apply(cur, 0); if (s.ev) fire(s.ev); });
    if (drop) { cargo.position.copy(drop.to); cargo.quaternion.copy(drop.qt); drop = null; }
    seq = []; return;
  }
  seq = list; segFrom = cur; segStart = performance.now() / 1000;
}
document.querySelectorAll('.modes button').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.m); }); });

/* ---------- loop ---------- */
function resize() { var w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
try { new ResizeObserver(resize).observe(host); } catch (e) { window.addEventListener('resize', resize); }
resize();
var visible = true;
try { new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(host); } catch (e) {}
var first = true, last = performance.now() / 1000, tgt = new T.Vector3(), RC = 0.42, OMEGA = 0.85;
function frame() {
  requestAnimationFrame(frame);
  var now = performance.now() / 1000, dt = Math.min(0.05, now - last); last = now;
  if (seq.length) {
    var t = (now - segStart) / DUR;
    if (t >= 1) { cur = seq[0].p; if (seq[0].ev) fire(seq[0].ev); seq.shift(); segFrom = cur; segStart = now; }
    else cur = lerpPose(segFrom, seq[0].p, ease(t));
  }
  if (drop) {
    var dd = Math.min(1, (now - drop.t0) / 0.6);
    cargo.position.lerpVectors(drop.p0, drop.to, dd * dd); cargo.quaternion.copy(drop.q0).slerp(drop.qt, dd);
    if (dd >= 1) drop = null;
  }
  if (!visible && !first) return;
  var tt = reduce ? 0 : now;
  if (!reduce) {
    orbitAng += OMEGA * cur.orbit * dt;
    if (cur.orbit > 0.01) heading = orbitAng;
    rpos.set((RC - RC * Math.cos(orbitAng)) * cur.orbit, 0, RC * Math.sin(orbitAng) * cur.orbit);
    var v = OMEGA * RC / RO * cur.orbit;
    wheels.forEach(function (w) {
      w.ang += dt * (v * (1 - w.s * 0.33) + cur.wob * 1.1 * Math.cos(now * 1.7));
      w.spin.rotation.x = w.ang;
    });
  }
  apply(cur, tt);
  var pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(now * 3.1);
  M.amber.emissiveIntensity = 2.4 * pulse; eyeGlow.material.opacity = 0.75 * pulse;
  var on = reduce || Math.sin(now * 4) > 0.2;
  M.lamp.emissiveIntensity = on ? 2.2 : 0.2; beaconGlow.visible = on;
  chassis.getWorldPosition(tgt);
  controls.target.x += (tgt.x * 0.8 - controls.target.x) * 0.04;
  controls.target.y += (tgt.y - controls.target.y) * 0.05;
  controls.target.z += (tgt.z * 0.8 - controls.target.z) * 0.04;
  controls.update(); renderer.render(scene, camera);
  if (first) { first = false; var l = document.getElementById('loading'); if (l) l.remove(); }
}
frame();
window.__k7 = { go: go };
})();


