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

/* ---------- robot ---------- */
var robot = grp(scene);
var chassis = grp(robot);
var contacts = []; // {o, r, g:'f'|'r'}
function contact(o, r, g) { contacts.push({ o: o, r: r, g: g }); }

// hull core + panels
rbox(0.28, 0.16, 0.30, 0.02, M.gun, chassis);
rbox(0.29, 0.022, 0.25, 0.009, M.ceramic, chassis, 0, 0.083, -0.005);
[-1, 1].forEach(function (s) {
  rbox(0.022, 0.118, 0.12, 0.008, M.ceramic, chassis, s * 0.142, 0.004, 0.07);
  rbox(0.022, 0.118, 0.105, 0.008, M.ceramic, chassis, s * 0.142, 0.004, -0.06);
  for (var i = 0; i < 6; i++) rbox(0.006, 0.008, 0.07, 0.002, M.dark, chassis, s * 0.154, 0.036 - i * 0.014, -0.06); // vents
  bolts(chassis, [[s * 0.154, 0.056, 0.02], [s * 0.154, -0.048, 0.02], [s * 0.154, 0.056, 0.12], [s * 0.154, -0.048, 0.12]], 'x');
  rbox(0.012, 0.016, 0.03, 0.004, M.amber, chassis, s * 0.152, 0.05, 0.115).castShadow = false; // side marker
  var d = mesh(new T.PlaneGeometry(0.1, 0.05), new T.MeshStandardMaterial({ map: decal([['bold 92px Oswald, sans-serif', 'К-7', 18, 20], ['600 40px IBM Plex Mono, monospace', 'ГРУЗ/07', 22, 140], ['600 30px IBM Plex Mono, monospace', '△ ОПАСНО', 22, 200]]), transparent: true, roughness: 0.6 }), chassis, s * 0.1535, 0.0, 0.07);
  d.rotation.y = s * Math.PI / 2; d.castShadow = false;
});
// front bezel, eye, chin
rbox(0.262, 0.15, 0.03, 0.012, M.ceramic, chassis, 0, 0.004, 0.152);
rbox(0.15, 0.11, 0.012, 0.01, M.dark, chassis, 0, 0.012, 0.166);
var eye = grp(chassis, 0, 0.014, 0.17); eye.rotation.x = Math.PI / 2;
cyl(0.052, 0.056, 0.03, M.brass, eye, 0, 0.004, 0);
cyl(0.044, 0.044, 0.034, M.dark, eye, 0, 0.006, 0);
var iris = mesh(new T.TorusGeometry(0.022, 0.0045, 16, 48), M.amber, eye, 0, 0.018, 0); iris.rotation.x = Math.PI / 2; iris.castShadow = false;
cyl(0.007, 0.007, 0.004, M.amber, eye, 0, 0.019, 0).castShadow = false;
mesh(new T.SphereGeometry(0.042, 48, 24, 0, Math.PI * 2, 0, 0.55), M.glass, eye, 0, -0.012, 0).castShadow = false;
for (var b = 0; b < 8; b++) { var a = b / 8 * Math.PI * 2; bolts(eye, [[Math.cos(a) * 0.049, 0.02, Math.sin(a) * 0.049]], 'y', 0.003); }
var eyeGlow = glowSprite(0xff9a30, 0.13, chassis, 0, 0.014, 0.2);
[-1, 1].forEach(function (s) { cyl(0.006, 0.006, 0.006, M.lamp, chassis, s * 0.06, 0.055, 0.172).rotation.x = Math.PI / 2; });
rbox(0.274, 0.034, 0.05, 0.01, M.red, chassis, 0, -0.066, 0.15);
var hz = mesh(new T.PlaneGeometry(0.25, 0.018), M.hazard, chassis, 0, -0.066, 0.1755); hz.castShadow = false;
bolts(chassis, [[-0.115, -0.066, 0.176], [0.115, -0.066, 0.176]], 'z');
// top: handle, stencil, antenna + beacon
var topD = mesh(new T.PlaneGeometry(0.12, 0.06), new T.MeshStandardMaterial({ map: decal([['bold 200px Oswald, sans-serif', '07', 140, 20]], '#2a2522'), transparent: true, roughness: 0.6 }), chassis, -0.05, 0.0945, 0.03);
topD.rotation.x = -Math.PI / 2; topD.castShadow = false;
var handle = mesh(new T.TorusGeometry(0.05, 0.007, 12, 32, Math.PI), M.steel, chassis, 0.06, 0.094, 0.0); handle.rotation.y = Math.PI / 2;
cyl(0.004, 0.003, 0.17, M.steel, chassis, -0.11, 0.18, -0.09, 8);
cyl(0.009, 0.009, 0.012, M.dark, chassis, -0.11, 0.1, -0.09);
var beacon = mesh(new T.SphereGeometry(0.008, 16, 12), M.lamp, chassis, -0.11, 0.268, -0.09); beacon.castShadow = false;
var beaconGlow = glowSprite(0xff2a1a, 0.08, chassis, -0.11, 0.268, -0.09);
// skids
[[0.09, 0.1, 'f'], [-0.09, 0.1, 'f']].forEach(function (p) { var k = rbox(0.03, 0.012, 0.05, 0.004, M.rubber, chassis, p[0], -0.086, p[1]); contact(k, 0.006, 'f'); });

/* ---------- cargo pod (behind body) ---------- */
var pod = grp(chassis, 0, -0.005, -0.16);
rbox(0.24, 0.012, 0.2, 0.004, M.gun, pod, 0, -0.07, -0.1); // floor
[-1, 1].forEach(function (s) {
  rbox(0.014, 0.15, 0.2, 0.006, M.ceramic, pod, s * 0.125, 0, -0.1);
  rbox(0.018, 0.02, 0.21, 0.006, M.red, pod, s * 0.127, 0.03, -0.1);
  bolts(pod, [[s * 0.133, 0.03, -0.03], [s * 0.133, 0.03, -0.17]], 'x');
});
var rear = mesh(new T.CylinderGeometry(0.12, 0.12, 0.15, 48, 1, true, Math.PI / 2, Math.PI), M.ceramic, pod, 0, 0, -0.2);
rear.material = M.ceramic.clone(); rear.material.side = T.DoubleSide; rear.scale.set(1, 1, 0.7);
var rearIn = mesh(new T.CylinderGeometry(0.11, 0.11, 0.14, 48, 1, true, Math.PI / 2, Math.PI), M.dark, pod, 0, 0, -0.2); rearIn.material = M.dark.clone(); rearIn.material.side = T.BackSide; rearIn.scale.set(1, 1, 0.62);
var podFloor2 = mesh(new T.CircleGeometry(0.12, 32, Math.PI, Math.PI), M.gun, pod, 0, -0.07, -0.2); podFloor2.rotation.x = -Math.PI / 2; podFloor2.scale.set(1, 0.7, 1);
var band = mesh(new T.CylinderGeometry(0.123, 0.123, 0.02, 48, 1, true, Math.PI / 2, Math.PI), M.hazard, pod, 0, 0.045, -0.2); band.material = M.hazard.clone(); band.material.side = T.DoubleSide; band.scale.set(1, 1, 0.71);
var lidHinge = grp(pod, 0, 0.078, -0.005);
var lid = grp(lidHinge);
rbox(0.25, 0.014, 0.2, 0.006, M.ceramic, lid, 0, 0, -0.1);
var lidCap = mesh(new T.CylinderGeometry(0.125, 0.125, 0.014, 48, 1, false, Math.PI / 2, Math.PI), M.ceramic, lid, 0, 0, -0.2); lidCap.scale.set(1, 1, 0.71);
rbox(0.04, 0.02, 0.24, 0.006, M.red, lid, 0, 0.01, -0.13);
cyl(0.008, 0.008, 0.25, M.steel, lidHinge, 0, 0, 0).rotation.z = Math.PI / 2;
var slot = grp(pod, 0.03, -0.028, -0.13); // where cargo lands
[[0.08, -0.33], [-0.08, -0.33]].forEach(function (p) { var k = rbox(0.03, 0.012, 0.04, 0.004, M.rubber, chassis, p[0], -0.086, p[1]); contact(k, 0.006, 'r'); });

/* ---------- rear wheel legs ---------- */
function tireGeo(R, w) {
  var pts = [], tw = w / 2, rr = 0.016;
  pts.push(new T.Vector2(R * 0.62, -tw));
  for (var i = 0; i <= 8; i++) { var a = -Math.PI / 2 + i / 8 * Math.PI / 2; pts.push(new T.Vector2(R - rr + Math.cos(a) * rr, -tw + rr + Math.sin(a) * rr)); }
  for (i = 0; i <= 8; i++) { a = i / 8 * Math.PI / 2; pts.push(new T.Vector2(R - rr + Math.cos(a) * rr, tw - rr + Math.sin(a) * rr)); }
  pts.push(new T.Vector2(R * 0.62, tw));
  var g = new T.LatheGeometry(pts, 64); g.rotateZ(Math.PI / 2); return g;
}
function bigWheel(parent, s) {
  var R = 0.085, W = 0.05, spin = grp(parent);
  mesh(tireGeo(R, W), M.rubber, spin);
  var tread = new T.InstancedMesh(new T.BoxGeometry(W * 0.8, 0.008, 0.016), M.rubber, 36);
  var m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
  for (var i = 0; i < 36; i++) {
    var a = i / 36 * Math.PI * 2; e.set(a, 0, 0); q.setFromEuler(e);
    m4.compose(new T.Vector3(((i % 2) - 0.5) * 0.008, Math.cos(a) * (R + 0.002), Math.sin(a) * (R + 0.002)), q, new T.Vector3(1, 1, 1));
    tread.setMatrixAt(i, m4);
  }
  tread.castShadow = true; spin.add(tread);
  var rimG = new T.CylinderGeometry(R * 0.6, R * 0.6, W * 0.7, 40); rimG.rotateZ(Math.PI / 2);
  mesh(rimG, M.gun, spin);
  for (i = 0; i < 6; i++) { var sp = rbox(0.008, R * 0.9, 0.012, 0.003, M.steel, spin, s * W * 0.37, 0, 0); sp.rotation.x = i / 6 * Math.PI; }
  var cap = cyl(0.016, 0.02, 0.012, M.brass, spin, s * W * 0.4, 0, 0); cap.rotation.z = Math.PI / 2;
  var can = cyl(0.03, 0.03, 0.04, M.red, parent, -s * W * 0.55, 0, 0); can.rotation.z = Math.PI / 2;
  return spin;
}
var legs = [];
[-1, 1].forEach(function (s) {
  var hinge = grp(chassis, s * 0.165, -0.02, -0.075);
  var servo = rbox(0.03, 0.05, 0.05, 0.006, M.dark, chassis, s * 0.158, -0.02, -0.075);
  var plate = plateLink(0.13, 0.034, 0.008, 2, M.gun); plate.castShadow = true; plate.rotation.y = Math.PI / 2; hinge.add(plate);
  var hub = grp(hinge, s * 0.04, 0.13, 0);
  var spin = bigWheel(hub, s);
  contact(hub, 0.085, 'r');
  legs.push({ hinge: hinge, spin: spin });
  cable(chassis, [[s * 0.145, 0.03, -0.12], [s * 0.18, 0.0, -0.11], [s * 0.172, -0.02, -0.09]], 0.0035, M.cableR);
});

/* ---------- front arms (legs) with gripper wheel ---------- */
function servoBox(parent) {
  var g = grp(parent);
  rbox(0.044, 0.058, 0.034, 0.005, M.dark, g);
  rbox(0.046, 0.02, 0.036, 0.005, M.red, g, 0, 0.012, 0);
  var horn = cyl(0.014, 0.014, 0.05, M.brass, g, 0, 0, 0); horn.rotation.z = Math.PI / 2;
  return g;
}
function halfJaw(parent, sgn) {
  var R = 0.045, j = grp(parent);
  var t = mesh(new T.TorusGeometry(R, 0.012, 16, 40, Math.PI), M.rubber, j, 0, R, 0); t.rotation.set(0, Math.PI / 2, sgn > 0 ? Math.PI / 2 : -Math.PI / 2);
  var d = mesh(new T.CylinderGeometry(R * 0.85, R * 0.85, 0.018, 40, 1, false, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), M.gun, j, 0, R, 0); d.rotation.z = Math.PI / 2;
  var c = mesh(new T.CylinderGeometry(R * 0.55, R * 0.55, 0.024, 32, 1, false, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), M.red, j, 0, R, 0); c.rotation.z = Math.PI / 2;
  for (var i = 0; i < 4; i++) { var tooth = rbox(0.022, 0.006, 0.006, 0.002, M.brass, j, 0, R - 0.03 + i * 0.02, sgn * 0.004); }
  return j;
}
var arms = [];
[-1, 1].forEach(function (s) {
  var root = grp(chassis, s * 0.172, -0.03, 0.1);
  var yaw = grp(root);
  servoBox(yaw);
  var pitch = grp(yaw);
  [-1, 1].forEach(function (k) { var p = plateLink(0.2, 0.036, 0.006, 3, M.gun); p.rotation.y = Math.PI / 2; p.position.x = k * 0.02; p.castShadow = true; pitch.add(p); });
  rbox(0.03, 0.12, 0.022, 0.008, M.ceramic, pitch, 0, 0.1, 0.0); // armor shell
  var elbow = grp(pitch, 0, 0.2, 0);
  servoBox(elbow);
  [-1, 1].forEach(function (k) { var p = plateLink(0.2, 0.032, 0.006, 3, M.gun); p.rotation.y = Math.PI / 2; p.position.x = k * 0.018; p.castShadow = true; elbow.add(p); });
  rbox(0.026, 0.11, 0.02, 0.008, M.red, elbow, 0, 0.1, 0);
  var wrist = grp(elbow, 0, 0.2, 0);
  servoBox(wrist);
  rbox(0.024, 0.03, 0.03, 0.006, M.gun, wrist, 0, 0.025, 0);
  var jawHinge = grp(wrist, 0, 0.04, 0);
  var jA = halfJaw(jawHinge, 1), jB = halfJaw(jawHinge, -1);
  var center = grp(jawHinge, 0, 0.045, 0);
  contact(center, 0.057, 'f');
  cable(chassis, [[s * 0.145, 0.02, 0.06], [s * 0.19, 0.0, 0.07], [s * 0.19, -0.03, 0.095]], 0.0035, s > 0 ? M.cableY : M.cableK);
  arms.push({ yaw: yaw, pitch: pitch, elbow: elbow, wrist: wrist, jA: jA, jB: jB, center: center });
});

/* ---------- cargo crate + scenery ---------- */
function crate(parent, sz) {
  var g = grp(parent);
  rbox(sz, sz * 0.8, sz, 0.004, M.gun, g);
  rbox(sz * 1.02, sz * 0.16, sz * 1.02, 0.003, M.hazard, g);
  rbox(sz * 0.16, sz * 0.82, sz * 1.02, 0.003, M.red, g);
  return g;
}
var cargo = crate(scene, 0.07);
var spare = crate(scene, 0.12); spare.position.set(-0.7, 0.048, -0.6); spare.rotation.y = 0.5;
var spare2 = crate(scene, 0.09); spare2.position.set(-0.62, 0.036, -0.42); spare2.rotation.y = -0.3;

/* ---------- poses ---------- */
function P(o) { var b = { pitch: 0, level: 1, wob: 0, leg: -2.7, lid: 0,
  l1: 1.35, l2: 0.75, l3: 0.4, lj: 0, ly: 0, r1: 1.35, r2: 0.75, r3: 0.4, rj: 0, ry: 0 };
  for (var k in o) b[k] = o[k]; return b; }
var POSES = {
  drive: P({}),
  stow: P({ leg: -0.45, l1: -1.45, l2: 2.9, l3: 1.25, r1: -1.45, r2: 2.9, r3: 1.25 }),
  carry: P({ pitch: -0.6, level: 0, wob: 1, leg: -0.5, l1: 2.9, l2: 0.6, l3: 0.25, r1: 2.9, r2: 0.6, r3: 0.25 })
};
var LOAD = [
  { p: P({ lid: 1.9, l1: 1.95, l2: 0.7, l3: 0.6, lj: 0.8, ly: 0.35 }) },
  { p: P({ lid: 1.9, l1: 1.95, l2: 0.7, l3: 0.6, lj: 0, ly: 0.35 }), ev: 'grab' },
  { p: P({ lid: 1.9, l1: 0.2, l2: 0.3, l3: 0.3, ly: 0.15 }) },
  { p: P({ lid: 1.9, l1: -0.9, l2: -0.7, l3: -0.6, ly: 0.32 }) },
  { p: P({ lid: 1.9, l1: -0.9, l2: -0.7, l3: -0.6, ly: 0.32, lj: 0.8 }), ev: 'release' },
  { p: P({}) }
];
var LABEL = { drive: 'MODE: DRIVE — 4点支持', stow: 'MODE: STOW — 全格納', carry: 'MODE: CARRY — 2輪倒立', load: 'MODE: LOAD — 積み込み中' };

var corr = 0, tmp = new T.Vector3();
function apply(p, t) {
  var pitch = p.pitch + p.wob * 0.03 * Math.sin(t * 2.3);
  [['r', arms[0]], ['l', arms[1]]].forEach(function (e) {
    var k = e[0], a = e[1];
    a.yaw.rotation.y = (k === 'l' ? 1 : -1) * p[k + 'y'];
    a.pitch.rotation.x = p[k + '1'] - p.wob * 0.03 * Math.sin(t * 2.3);
    a.elbow.rotation.x = p[k + '2']; a.wrist.rotation.x = p[k + '3'];
    a.jA.rotation.x = p[k + 'j'] * 0.9; a.jB.rotation.x = -p[k + 'j'] * 0.9;
  });
  legs.forEach(function (l) { l.hinge.rotation.x = p.leg; });
  lid.rotation.x = p.lid;
  robot.position.y = 0;
  for (var it = 0; it < 4; it++) {
    chassis.rotation.x = pitch + corr * p.level;
    robot.updateMatrixWorld(true);
    if (p.level < 0.01) break;
    var f = 1e9, r = 1e9;
    contacts.forEach(function (c) { var y = c.o.getWorldPosition(tmp).y - c.r; if (c.g === 'f') f = Math.min(f, y); else r = Math.min(r, y); });
    corr += (f - r) / 0.6;
    corr = Math.max(-0.8, Math.min(0.8, corr));
  }
  var m = 1e9;
  contacts.forEach(function (c) { m = Math.min(m, c.o.getWorldPosition(tmp).y - c.r); });
  robot.position.y = -m;
  robot.updateMatrixWorld(true);
}

/* ---------- animation ---------- */
var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var cur = P({}), mode = 'drive', seq = [], segFrom = null, segStart = 0, DUR = 1.1, drop = null;
function lerpPose(a, b, t) { var o = {}; for (var k in b) o[k] = a[k] + (b[k] - a[k]) * t; return o; }
function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function setUI(m) {
  document.querySelectorAll('.modes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m ? 'true' : 'false'); });
  document.getElementById('status').textContent = LABEL[m];
}
function placeCrate() { // put the crate where the left gripper will grab it
  scene.attach(cargo);
  var save = cur; apply(LOAD[1].p, 0);
  arms[1].center.getWorldPosition(tmp);
  cargo.position.set(tmp.x, 0.028, tmp.z); cargo.quaternion.identity();
  apply(save, 0);
}
function go(m) {
  if (seq.length && mode === 'load') return;
  var list = [];
  if (m === 'load') {
    if (mode !== 'drive') list.push({ p: POSES.drive });
    placeCrate(); list = list.concat(LOAD);
  } else {
    if (mode !== 'drive' && m !== 'drive') list.push({ p: POSES.drive });
    list.push({ p: POSES[m] });
  }
  mode = m; setUI(m);
  if (reduce) { list.forEach(function (s) { if (s.ev) fire(s.ev); }); cur = list[list.length - 1].p; seq = []; if (m === 'load') { mode = 'drive'; setUI('drive'); } return; }
  seq = list; segFrom = cur; segStart = performance.now() / 1000;
}
function fire(ev) {
  if (ev === 'grab') arms[1].center.attach(cargo);
  if (ev === 'release') { pod.attach(cargo); drop = { t0: performance.now() / 1000, p0: cargo.position.clone(), q0: cargo.quaternion.clone() }; if (reduce) { cargo.position.copy(slot.position); cargo.quaternion.identity(); drop = null; } }
}
document.querySelectorAll('.modes button').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.m); }); });

/* ---------- loop ---------- */
function resize() {
  var w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.position.multiplyScalar(1); camera.updateProjectionMatrix();
}
try { new ResizeObserver(resize).observe(host); } catch (e) { window.addEventListener('resize', resize); }
resize();
placeCrate();
var visible = true;
try { new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(host); } catch (e) {}
var first = true, tgtY = new T.Vector3();
function frame() {
  requestAnimationFrame(frame);
  var now = performance.now() / 1000;
  if (seq.length) {
    var t = (now - segStart) / DUR;
    if (t >= 1) {
      cur = seq[0].p; if (seq[0].ev) fire(seq[0].ev);
      seq.shift(); segFrom = cur; segStart = now;
      if (!seq.length && mode === 'load') { mode = 'drive'; setUI('drive'); }
    } else cur = lerpPose(segFrom, seq[0].p, ease(t));
  }
  if (drop) {
    var d = Math.min(1, (now - drop.t0) / 0.6), e = d * d;
    cargo.position.lerpVectors(drop.p0, slot.position, e); cargo.quaternion.copy(drop.q0).slerp(new T.Quaternion(), d);
    if (d >= 1) drop = null;
  }
  if (!visible && !first) return;
  apply(cur, reduce ? 0 : now);
  var pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(now * 3.1);
  M.amber.emissiveIntensity = 2.4 * pulse; eyeGlow.material.opacity = 0.75 * pulse;
  var on = reduce || Math.sin(now * 4) > 0.2;
  M.lamp.emissiveIntensity = on ? 2.2 : 0.2; beaconGlow.visible = on;
  chassis.getWorldPosition(tgtY);
  controls.target.y += (tgtY.y - controls.target.y) * 0.05;
  controls.update();
  renderer.render(scene, camera);
  if (first) { first = false; var l = document.getElementById('loading'); if (l) l.remove(); }
}
frame();
window.__k7 = { go: go };
})();


