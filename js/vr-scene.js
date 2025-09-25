// BUILD: vr-2025-09-26-7
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";
import { EXRLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/EXRLoader.js";

// build tag visible on screen so you know this file loaded
(() => {
  const tag = document.createElement("div");
  tag.textContent = "BUILD: vr-2025-09-26-7";
  tag.style.cssText =
    "position:fixed;right:8px;top:8px;color:#fff;background:#111a;border:1px solid #333;padding:4px 8px;border-radius:8px;font:11px system-ui;z-index:10";
  document.body.appendChild(tag);
})();

const QS = new URLSearchParams(location.search);
const PREVIEW = QS.has("preview");

// HUD / ERR
function HUD(msg) {
  let el = document.querySelector(".hint");
  if (!el) {
    el = document.createElement("div");
    el.className = "hint";
    el.style.cssText =
      "position:fixed;left:12px;bottom:12px;color:#ddd;font:12px/1.3 system-ui;background:#0008;padding:6px 10px;border-radius:10px;z-index:5";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  window.parent?.postMessage({ type: "STATUS", text: String(msg) }, "*");
}
function ERR(msg) {
  let el = document.getElementById("err");
  if (!el) {
    el = document.createElement("div");
    el.id = "err";
    el.style.cssText =
      "position:fixed;left:12px;top:12px;max-width:66ch;background:#300;border:1px solid #a00;color:#fff;padding:8px 10px;border-radius:8px;font:12px/1.35 system-ui;white-space:pre-wrap;z-index:6";
    document.body.appendChild(el);
  }
  el.style.display = "block";
  el.textContent = String(msg);
  window.parent?.postMessage({ type: "STATUS", text: "error" }, "*");
}
window.addEventListener("error", (e) => ERR(e?.error?.stack || e.message || e));
window.addEventListener("unhandledrejection", (e) =>
  ERR(e?.reason?.stack || e.reason || e)
);

// Resolve model URL from global, body, QS, default
function resolveModelURL() {
  let m = window.GLB;
  if (!m) {
    const d = document.body?.dataset?.model;
    if (d) m = d;
  }
  if (!m) {
    const q = QS.get("model");
    if (q) m = q;
  }
  if (!m) m = "/assets/3d/saraswathi.glb";
  return m;
}
const MODEL_URL = resolveModelURL();
window.parent?.postMessage({ type: "MODEL_RESOLVED", url: MODEL_URL }, "*");
HUD("Model: " + MODEL_URL);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Scene / Camera / Controls
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0d);
const rig = new THREE.Group();
scene.add(rig);
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
camera.position.set(0, 1.7, 6);
rig.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.enablePan = false;

// Lights
scene.add(new THREE.HemisphereLight(0xfff0e0, 0x0a0a12, 0.4));
const key = new THREE.DirectionalLight(0xfff3d2, 0.8);
key.position.set(10, 20, 10);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

// HDRI (optional)
(async () => {
  try {
    HUD("Loading sky…");
    const exr = await new EXRLoader().loadAsync(
      "/assets/hdr/NightSkyHDRI003_2K-HDR.exr"
    );
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(exr).texture;
    scene.environment = env;
    scene.background = env;
    key.intensity = 0.5;
    exr.dispose();
    pmrem.dispose();
    HUD("Sky ready");
  } catch (e) {
    console.warn("HDRI not found/failed:", e);
    HUD("Sky fallback");
  }
})();

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.85 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Lotus dais
function makeLotus(radius = 1.8, petals = 20) {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius, 0.5, 48),
    new THREE.MeshStandardMaterial({
      color: 0xe7e1ff,
      roughness: 0.35,
      metalness: 0.1,
    })
  );
  base.castShadow = base.receiveShadow = true;
  base.position.y = 0.25;
  grp.add(base);
  const petalGeo = new THREE.SphereGeometry(0.5, 24, 24);
  petalGeo.scale(0.55, 0.25, 1.0);
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xf7e8ff,
    roughness: 0.3,
    metalness: 0.1,
  });
  for (let i = 0; i < petals; i++) {
    const p = new THREE.Mesh(petalGeo, petalMat);
    const a = (i / petals) * Math.PI * 2;
    p.position.set(
      Math.cos(a) * (radius * 0.95),
      0.55,
      Math.sin(a) * (radius * 0.95)
    );
    p.rotation.y = a;
    p.castShadow = p.receiveShadow = true;
    grp.add(p);
  }
  return grp;
}
scene.add(makeLotus());

// Material/mesh helpers
function normalizeMat(m) {
  if (!m) return;
  if (m.isMeshStandardMaterial) {
    m.roughness ??= 0.6;
    m.metalness ??= 0.05;
    m.needsUpdate = true;
    return;
  }
  const std = new THREE.MeshStandardMaterial({
    color: m.color ? m.color.getHex() : 0xdddddd,
    roughness: 0.6,
    metalness: 0.05,
  });
  if (m.map) std.map = m.map;
  if (m.normalMap) std.normalMap = m.normalMap;
  if (m.roughnessMap) std.roughnessMap = m.roughnessMap;
  if (m.metalnessMap) std.metalnessMap = m.metalnessMap;
  std.needsUpdate = true;
  return std;
}
function cleanupMesh(mesh) {
  const g = mesh.geometry;
  if (g && !g.getAttribute("normal")) g.computeVertexNormals();
  mesh.castShadow = mesh.receiveShadow = true;
  const nm = normalizeMat(mesh.material);
  if (nm) mesh.material = nm;
}

// Load model (probe HEAD then fallback GET range)
async function isReachable(url) {
  try {
    const h = await fetch(url, { method: "HEAD" });
    if (h.ok) return true;
  } catch {}
  try {
    const g = await fetch(url, { headers: { Range: "bytes=0-0" } });
    return g.ok;
  } catch {}
  return false;
}
async function loadModel(url) {
  const ok = await isReachable(url);
  if (!ok) {
    ERR("GLB not reachable at " + url + " (check path / hosting)");
    return;
  }
  HUD("Loading idol…");
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(
    "https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/"
  );
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync(url);
  let model = gltf.scene || gltf.scenes?.[0];
  if (!model) throw new Error("GLB contained no scene");

  let meshes = 0,
    tris = 0;
  model.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      cleanupMesh(o);
      const idx = o.geometry.getIndex();
      tris +=
        ((idx ? idx.count : o.geometry.attributes.position?.count || 0) / 3) |
        0;
      if (o.material?.isMeshStandardMaterial) o.material.envMapIntensity = 1.0;
    }
  });

  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const targetH = 2.2;
  const s = size.y > 1e-4 ? targetH / size.y : 1.0;
  model.scale.setScalar(s);

  const bbox2 = new THREE.Box3().setFromObject(model);
  const min2 = bbox2.min;
  const cen2 = bbox2.getCenter(new THREE.Vector3());
  const lift = -min2.y + 0.65;
  model.position.set(-cen2.x, lift, -cen2.z);

  scene.add(model);
  HUD(`Model ready — meshes: ${meshes}, ~tris: ${tris.toLocaleString()}`);
}
loadModel(MODEL_URL).catch((e) => ERR(e?.message || e));

// Controllers + teleport (works only in VR)
const factory = new XRControllerModelFactory();
for (let i = 0; i < 2; i++) {
  const g = renderer.xr.getControllerGrip(i);
  g.add(factory.createControllerModel(g));
  scene.add(g);
}
const controllers = [0, 1].map((i) => {
  const c = renderer.xr.getController(i);
  scene.add(c);
  return c;
});

let teleportActive = false,
  lastHit = null,
  arcSpeed = 8;
const GRAV = new THREE.Vector3(0, -9.8, 0),
  TMP = new THREE.Vector3(),
  MAT = new THREE.Matrix4();
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const MAX = 60;
const curveGeom = new THREE.BufferGeometry().setFromPoints(
  new Array(MAX).fill(0).map(() => new THREE.Vector3())
);
const curveLine = new THREE.Line(
  curveGeom,
  new THREE.LineBasicMaterial({ color: 0x6ee7ff })
);
curveLine.visible = false;
scene.add(curveLine);
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.45, 0.55, 32, 1),
  new THREE.MeshBasicMaterial({
    color: 0x9efc8f,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.01;
ring.visible = false;
scene.add(ring);
function pose(c) {
  const o = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
  const d = new THREE.Vector3(0, 0, -1)
    .applyMatrix4(MAT.extractRotation(c.matrixWorld))
    .normalize();
  return { o, d };
}
function parab(o, d, s = arcSpeed, dt = 0.03, maxT = 2.0) {
  const L = [];
  let v = d.clone().multiplyScalar(s),
    p = o.clone();
  for (let t = 0; t < maxT && L.length < MAX; t += dt) {
    L.push(p.clone());
    v = v.addScaledVector(GRAV, dt);
    p = p.addScaledVector(v, dt);
  }
  return L;
}
function floorHit(a, b) {
  const dir = TMP.copy(b).sub(a);
  const den = FLOOR.normal.dot(dir);
  if (Math.abs(den) < 1e-6) return null;
  const t = -(FLOOR.normal.dot(a) + FLOOR.constant) / den;
  if (t < 0 || t > 1) return null;
  return a.clone().addScaledVector(dir, t);
}
function updateTP(c) {
  const { o, d } = pose(c);
  const pts = parab(o, d, arcSpeed);
  const pos = curveGeom.attributes.position.array;
  let hit = null;
  for (let i = 0; i < MAX; i++) {
    const A = pts[Math.min(i, pts.length - 1)];
    pos[i * 3] = A.x;
    pos[i * 3 + 1] = A.y;
    pos[i * 3 + 2] = A.z;
    if (!hit && i > 0) {
      const B = pts[Math.min(i - 1, pts.length - 1)];
      hit = floorHit(B, A);
    }
  }
  curveGeom.attributes.position.needsUpdate = true;
  if (hit) {
    ring.position.set(hit.x, 0.01, hit.z);
    ring.visible = true;
    lastHit = hit.clone();
  } else {
    ring.visible = false;
    lastHit = null;
  }
  curveLine.visible = true;
  teleportActive = true;
}
function endTP() {
  curveLine.visible = false;
  ring.visible = false;
  teleportActive = false;
}
function tpTo(hit) {
  if (!hit)
    return; /* in real VR we’d reposition the rig; preview only shows scene */
}

const cta = document.getElementById("ctaVR");
if (cta) {
  const startVR = async () => {
    try {
      if (!navigator.xr) throw new Error("WebXR not available in this browser");
      const ok = await navigator.xr.isSessionSupported?.("immersive-vr");
      if (!ok)
        throw new Error("immersive-vr not supported (no headset/runtime?)");
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: [
          "local-floor",
          "bounded-floor",
          "hand-tracking",
          "layers",
        ],
      });
      await renderer.xr.setSession(session);
    } catch (e) {
      ERR(e?.message || e);
    }
  };
  cta.addEventListener("click", startVR);
  cta.addEventListener("touchend", startVR);
}

// Resize + animate
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
