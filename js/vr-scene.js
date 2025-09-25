// VR Saraswati Temple — WebXR + Three.js
// Adds explicit CTA (Enter VR) that triggers native WebXR button internally
// Also includes teleport + snap-turn + adjustable arc speed.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Keep a reference to the native WebXR button and hide it (we'll click it from CTA)
const nativeBtn = VRButton.createButton(renderer);
nativeBtn.id = "native-vr-button";
nativeBtn.style.position = "fixed";
nativeBtn.style.right = "12px";
nativeBtn.style.bottom = "12px";
nativeBtn.style.zIndex = "4";
document.body.appendChild(nativeBtn);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09090b);
scene.fog = new THREE.Fog(0x0b0b10, 35, 140);

const rig = new THREE.Group();
scene.add(rig);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 1.6, 6);
rig.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;

// Hook up CTA to start/stop VR session via the native button (must be user gesture)
const cta = document.getElementById("ctaVR");
if (cta) {
  cta.addEventListener("click", () => {
    nativeBtn.click();
  });
  // Show CTA only if immersive-vr is supported
  if (navigator.xr?.isSessionSupported) {
    navigator.xr.isSessionSupported("immersive-vr").then(supported => {
      cta.style.display = supported ? "inline-flex" : "none";
    }).catch(()=> (cta.style.display = "none"));
  } else {
    cta.style.display = "none";
  }
  // Hide CTA during session
  renderer.xr.addEventListener("sessionstart", () => cta.style.display = "none");
  renderer.xr.addEventListener("sessionend",   () => {
    navigator.xr?.isSessionSupported?.("immersive-vr").then(s => {
      cta.style.display = s ? "inline-flex" : "none";
    }).catch(()=> (cta.style.display = "none"));
  });
}

// Lights
scene.add(new THREE.HemisphereLight(0xfff0e0, 0x0a0a12, 0.6));
const keyLight = new THREE.DirectionalLight(0xfff3d2, 0.9);
keyLight.position.set(8, 18, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

// Lamps
const lampPositions = [[-6, 2, -2], [6, 2, -2], [-6, 2, 6], [6, 2, 6], [0, 5, -6], [0, 5, 6]];
lampPositions.forEach(([x,y,z]) => {
  const s = new THREE.PointLight(0xffcc88, 0.7, 30, 2.0);
  s.position.set(x,y,z);
  s.castShadow = true;
  scene.add(s);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0xffb96b }));
  bulb.position.copy(s.position);
  scene.add(bulb);
});

// Floor
const FLOOR_Y = 0;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.6, metalness: 0.05 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
scene.add(floor);

// Columns
function makeColumn() {
  const g1 = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 24);
  const g2 = new THREE.CylinderGeometry(0.35, 0.35, 4.2, 24);
  const g3 = new THREE.CylinderGeometry(0.7, 0.6, 0.35, 24);
  const m1 = new THREE.MeshStandardMaterial({ color: 0xededf2, roughness: 0.4, metalness: 0.05 });
  const m2 = new THREE.MeshStandardMaterial({ color: 0xf2f2f7, roughness: 0.4, metalness: 0.05 });
  const base = new THREE.Mesh(g1, m1); base.castShadow = base.receiveShadow = true;
  const shaft = new THREE.Mesh(g2, m2); shaft.position.y = 2.4; shaft.castShadow = shaft.receiveShadow = true;
  const cap = new THREE.Mesh(g3, m1); cap.position.y = 4.8; cap.castShadow = cap.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(base, shaft, cap); return grp;
}
for (let x of [-8, -4, 4, 8]) for (let z of [-10, -5, 0, 5, 10]) { const c = makeColumn(); c.position.set(x, 0, z); scene.add(c); }

// Lotus + Idol
function makeLotus(radius = 1.5, petals = 18) {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius, 0.5, 48), new THREE.MeshStandardMaterial({ color: 0xe7e1ff, roughness: 0.35, metalness: 0.1 }));
  base.castShadow = base.receiveShadow = true; grp.add(base);
  const petalGeo = new THREE.SphereGeometry(0.45, 24, 24); petalGeo.scale(0.55, 0.25, 1.0);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf7e8ff, roughness: 0.3, metalness: 0.1 });
  for (let i = 0; i < petals; i++) {
    const p = new THREE.Mesh(petalGeo, petalMat);
    const ang = (i / petals) * Math.PI * 2;
    p.position.set(Math.cos(ang) * (radius * 0.95), 0.35, Math.sin(ang) * (radius * 0.95));
    p.rotation.y = ang; p.castShadow = p.receiveShadow = true; grp.add(p);
  }
  return grp;
}
const dais = makeLotus(); dais.position.y = 0.35; scene.add(dais);

const idol = new THREE.Group();
const idolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222233, metalness: 0.05, roughness: 0.35 });
idol.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 8, 16), idolMat));
idol.children[0].position.y = 2.1; idol.children[0].castShadow = idol.children[0].receiveShadow = true;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), idolMat); head.position.y = 2.7; head.castShadow = head.receiveShadow = true; idol.add(head);
const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0xffd87a, metalness: 0.6, roughness: 0.2 })); crown.position.y = 3.05; crown.castShadow = true; idol.add(crown);
const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.8, 32), idolMat); skirt.position.y = 1.6; skirt.castShadow = skirt.receiveShadow = true; idol.add(skirt);
const veenaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 16), idolMat); veenaNeck.rotation.z = 0.45; veenaNeck.position.set(0.4, 2.1, 0.15); idol.add(veenaNeck);
const veenaGourd = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), idolMat); veenaGourd.position.set(0.95, 1.7, 0.15); idol.add(veenaGourd);
const halo = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 16, 48), new THREE.MeshStandardMaterial({ color: 0xffe79a, emissive: 0xffd98a, emissiveIntensity: 0.35 })); halo.position.set(0, 2.7, -0.1); idol.add(halo);
idol.position.y = 0.6; scene.add(idol);

// Particles
const pGeo = new THREE.BufferGeometry(); const count = 120; const pos = new Float32Array(count * 3);
for (let i = 0; i < count; i++) { const r = 2 + Math.random() * 3; const a = Math.random() * Math.PI * 2; pos[i*3] = Math.cos(a) * r; pos[i*3+1] = 1 + Math.random() * 2; pos[i*3+2] = Math.sin(a) * r; }
pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
const pMat = new THREE.PointsMaterial({ color: 0xffe4b3, size: 0.04, sizeAttenuation: true, transparent: true, opacity: 0.9 });
const points = new THREE.Points(pGeo, pMat); scene.add(points);

// Controllers & Teleport
const controllerModelFactory = new XRControllerModelFactory();
for (let i = 0; i < 2; i++) { const grip = renderer.xr.getControllerGrip(i); grip.add(controllerModelFactory.createControllerModel(grip)); rig.add(grip); }
const controllers = [0,1].map(i => { const c = renderer.xr.getController(i); rig.add(c);
  c.addEventListener("connected", (e) => { c.userData.gamepad = e.data.gamepad; c.userData.handedness = e.data.handedness; });
  c.addEventListener("disconnected", () => { c.userData.gamepad = null; });
  return c;
});

const MAX_STEPS = 60;
const curveGeom = new THREE.BufferGeometry().setFromPoints(new Array(MAX_STEPS).fill(0).map(()=> new THREE.Vector3()));
const curveLine = new THREE.Line(curveGeom, new THREE.LineBasicMaterial({ color: 0x6ee7ff })); curveLine.visible = false; scene.add(curveLine);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.55, 32, 1), new THREE.MeshBasicMaterial({ color: 0x9efc8f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
targetRing.rotation.x = -Math.PI/2; targetRing.position.y = FLOOR_Y + 0.01; targetRing.visible = false; scene.add(targetRing);

let teleportActive = false; let lastHit = null;
const tmpVec = new THREE.Vector3(); const tmpMat = new THREE.Matrix4(); const gravity = new THREE.Vector3(0, -9.8, 0);
const FLOOR = new THREE.Plane(new THREE.Vector3(0,1,0), -FLOOR_Y);

// Adjustable arc speed and snap-turn
let arcSpeed = 8;
const SPEED_MIN = 4, SPEED_MAX = 14, SPEED_STEP = 0.5, ADJ_COOLDOWN = 120;
const lastAdjust = new WeakMap();
const SNAP_TURN_DEG = 30, SNAP_TURN_RAD = THREE.MathUtils.degToRad(SNAP_TURN_DEG);
const SNAP_DEADZONE = 0.4, SNAP_COOLDOWN_MS = 300; const lastSnap = new WeakMap();

function setHUD() {
  const hud = document.querySelector(".hint");
  if (hud) hud.textContent = "Tip: Enter VR. Hold trigger to aim, release to teleport. Thumbstick: ◀︎/▶︎ snap-turn, ▲/▼ arc speed. Speed: " + arcSpeed.toFixed(1) + " m/s";
}
setHUD();

function clamp(v,a,b){ return Math.min(b, Math.max(a, v)); }
function getControllerPose(controller) {
  const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
  const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(tmpMat.extractRotation(controller.matrixWorld)).normalize();
  return { origin, dir };
}
function computeParabolaPoints(origin, dir, speed = arcSpeed, dt = 0.03, maxT = 2.0) {
  const pts = []; let vel = dir.clone().multiplyScalar(speed); let p = origin.clone();
  for (let t = 0; t < maxT && pts.length < MAX_STEPS; t += dt) { pts.push(p.clone()); vel = vel.addScaledVector(gravity, dt); p = p.addScaledVector(vel, dt); }
  return pts;
}
function intersectFloor(p1, p2) {
  const dir = tmpVec.copy(p2).sub(p1); const denom = FLOOR.normal.dot(dir);
  if (Math.abs(denom) < 1e-6) return null; const t = -(FLOOR.normal.dot(p1) + FLOOR.constant) / denom; if (t < 0 || t > 1) return null;
  return p1.clone().addScaledVector(dir, t);
}
function updateTeleport(controller) {
  const { origin, dir } = getControllerPose(controller);
  const pts = computeParabolaPoints(origin, dir, arcSpeed); const positions = curveGeom.attributes.position.array;
  let hit = null;
  for (let i = 0; i < MAX_STEPS; i++) {
    const a = pts[Math.min(i, pts.length - 1)]; positions[i*3] = a.x; positions[i*3+1] = a.y; positions[i*3+2] = a.z;
    if (!hit && i > 0) { const b = pts[Math.min(i-1, pts.length - 1)]; hit = intersectFloor(b, a); }
  }
  curveGeom.attributes.position.needsUpdate = true;
  if (hit) {
    const maxR = 75; const r2 = hit.x * hit.x + hit.z * hit.z;
    if (r2 < maxR * maxR) { targetRing.position.set(hit.x, FLOOR_Y + 0.01, hit.z); targetRing.visible = true; lastHit = hit.clone(); }
    else { targetRing.visible = false; lastHit = null; }
  } else { targetRing.visible = false; lastHit = null; }
  curveLine.visible = true; teleportActive = true;
}
function endTeleport(){ curveLine.visible = false; targetRing.visible = false; teleportActive = false; }
function teleportTo(hit) {
  if (!hit) return;
  const head = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const headOffset = head.clone().sub(rig.position);
  rig.position.set(hit.x - headOffset.x, FLOOR_Y, hit.z - headOffset.z);
}
controllers.forEach((c) => {
  c.addEventListener('selectstart', () => updateTeleport(c));
  c.addEventListener('squeezestart', () => updateTeleport(c));
  c.addEventListener('selectend', () => { if (teleportActive) { teleportTo(lastHit); endTeleport(); } });
  c.addEventListener('squeezeend', () => { if (teleportActive) { teleportTo(lastHit); endTeleport(); } });
});

function readAxes(gp){
  let best = {x:0, y:0, mag:0}; if (!gp) return best;
  const pairs = [[0,1],[2,3],[4,5]];
  for (const [ix,iy] of pairs){
    if (gp.axes.length > Math.max(ix,iy)){
      const x = gp.axes[ix] || 0, y = gp.axes[iy] || 0; const mag = Math.hypot(x,y);
      if (mag > best.mag) best = {x,y,mag};
    }
  } return best;
}
function processSnapAndSpeed(controller){
  const gp = controller.userData.gamepad; if (!gp) return;
  const {x, y} = readAxes(gp); const now = performance.now();
  if (Math.abs(x) > 0.4) { const last = lastSnap.get(controller) || 0;
    if (now - last > 300) { rig.rotation.y += (x > 0 ? -THREE.MathUtils.degToRad(30) : THREE.MathUtils.degToRad(30)); lastSnap.set(controller, now); }
  }
  if (Math.abs(y) > 0.4) { const last = lastAdjust.get(controller) || 0;
    if (now - last > 120) { const delta = (-y) * 0.5; arcSpeed = Math.min(14, Math.max(4, arcSpeed + delta)); lastAdjust.set(controller, now); setHUD(); }
  }
}

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
renderer.setAnimationLoop(() => {
  controls.update();
  const pp = points.geometry.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    let y = pp.getY(i) + 0.002 + Math.random()*0.004;
    if (y > 4) y = 1 + Math.random()*0.2;
    pp.setY(i, y);
  }
  pp.needsUpdate = true;

  controllers.forEach(processSnapAndSpeed);
  if (teleportActive) {
    const active = controllers.find(cc => cc.visible) || controllers[0];
    updateTeleport(active);
  }
  renderer.render(scene, camera);
});
