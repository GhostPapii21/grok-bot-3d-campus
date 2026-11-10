// Themed room props for Rico's campus. All geometry and textures are procedural
// (no third-party 3D assets). Emblems are original crests, not official league logos.
// ApexTitan wall mark is an original "APEX TITAN" wordmark — no official logo file
// was found (store apextitan-3.myshopify.com returned 402; no logo asset on the box).
"use client";

import type { CSSProperties, ReactNode } from "react";
import * as THREE from "three";

export type Spin = { obj: THREE.Object3D; speed: number };

const DESTINATIONS = ["Japan", "Italy", "Mexico", "Jamaica", "Greece", "France"] as const;

// Approximate pins on a simple globe (lat, lon).
const PINS: { name: (typeof DESTINATIONS)[number]; lat: number; lon: number }[] = [
  { name: "Japan", lat: 36, lon: 138 },
  { name: "Italy", lat: 42, lon: 12 },
  { name: "Mexico", lat: 23, lon: -102 },
  { name: "Jamaica", lat: 18, lon: -77 },
  { name: "Greece", lat: 39, lon: 22 },
  { name: "France", lat: 47, lon: 2 },
];

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 2;
  tx.needsUpdate = true;
  return tx;
}

function own<T extends THREE.Material>(m: T): T {
  m.userData.own = true;
  return m;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphGeo = new THREE.SphereGeometry(1, 16, 12);
const sphLo = new THREE.SphereGeometry(1, 12, 8);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
const torusGeo = new THREE.TorusGeometry(1, 0.12, 8, 16);

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

// ---- textures (created once per dress call; disposed with the room via userData.own) ----

function courtTex() {
  return canvasTex(1024, 680, (c) => {
    const W = 1024, H = 680;
    // hardwood planks
    for (let i = 0; i < 28; i++) {
      c.fillStyle = i % 2 === 0 ? "#c68642" : "#b87333";
      c.fillRect((i * W) / 28, 0, W / 28 + 1, H);
    }
    // faint grain
    c.globalAlpha = 0.12;
    for (let i = 0; i < 28; i++) {
      c.fillStyle = i % 3 === 0 ? "#8a4f22" : "#e0b07a";
      c.fillRect((i * W) / 28 + 2, 0, 3, H);
    }
    c.globalAlpha = 1;
    const padX = 36, padY = 28;
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 6;
    c.strokeRect(padX, padY, W - padX * 2, H - padY * 2);
    // mid line + circle
    c.beginPath();
    c.moveTo(W / 2, padY);
    c.lineTo(W / 2, H - padY);
    c.stroke();
    c.beginPath();
    c.arc(W / 2, H / 2, 78, 0, Math.PI * 2);
    c.stroke();
    // keys + backboards at each end
    const keyW = 140, keyH = 220;
    for (const x0 of [padX, W - padX - keyW]) {
      c.strokeRect(x0, (H - keyH) / 2, keyW, keyH);
      c.beginPath();
      c.arc(x0 === padX ? x0 + keyW : x0, H / 2, 70, x0 === padX ? -Math.PI / 2 : Math.PI / 2, x0 === padX ? Math.PI / 2 : -Math.PI / 2);
      c.stroke();
    }
    // 3-point arcs (simplified)
    c.beginPath();
    c.arc(padX + 20, H / 2, 250, -1.15, 1.15);
    c.stroke();
    c.beginPath();
    c.arc(W - padX - 20, H / 2, 250, Math.PI - 1.15, Math.PI + 1.15);
    c.stroke();
  });
}

function basketballTex() {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = "#d35400";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#1a1a1a";
    c.lineWidth = 8;
    c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 256); c.stroke();
    c.beginPath(); c.moveTo(0, 128); c.lineTo(256, 128); c.stroke();
    c.beginPath(); c.ellipse(128, 128, 70, 128, 0, 0, Math.PI * 2); c.stroke();
  });
}

/** Original basketball crest — typography + ball, not the official NBA silhouette logo. */
function nbaCrestTex() {
  return canvasTex(512, 512, (c) => {
    c.clearRect(0, 0, 512, 512);
    c.fillStyle = "#0e1a33";
    c.beginPath();
    c.arc(256, 256, 240, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e8a317";
    c.lineWidth = 16;
    c.stroke();
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 6;
    c.beginPath();
    c.arc(256, 256, 220, 0, Math.PI * 2);
    c.stroke();
    // basketball
    c.fillStyle = "#d35400";
    c.beginPath();
    c.arc(256, 200, 86, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#1a1a1a";
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(256, 114); c.lineTo(256, 286); c.stroke();
    c.beginPath(); c.moveTo(170, 200); c.lineTo(342, 200); c.stroke();
    c.beginPath(); c.ellipse(256, 200, 44, 86, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#f4f0e6";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 52px system-ui, Segoe UI, sans-serif";
    c.fillText("NBA", 256, 320);
    c.font = "bold 36px system-ui, Segoe UI, sans-serif";
    c.fillText("GAME HUB", 256, 368);
    // original star pair — not a league mark
    c.fillStyle = "#e8a317";
    const star = (x: number, y: number, r: number) => {
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const b = a + Math.PI / 5;
        c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        c.lineTo(x + Math.cos(b) * r * 0.4, y + Math.sin(b) * r * 0.4);
      }
      c.closePath();
      c.fill();
    };
    star(150, 318, 16);
    star(362, 318, 16);
  });
}

function turfTex() {
  return canvasTex(1024, 512, (c) => {
    const W = 1024, H = 512;
    // striped turf
    for (let i = 0; i < 12; i++) {
      c.fillStyle = i % 2 === 0 ? "#2d7a32" : "#24682a";
      c.fillRect((i * W) / 12, 0, W / 12 + 1, H);
    }
    // end zones
    c.fillStyle = "#1b4d22";
    c.fillRect(0, 0, 96, H);
    c.fillRect(W - 96, 0, 96, H);
    c.fillStyle = "#f4f0e6";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.save();
    c.translate(48, H / 2);
    c.rotate(-Math.PI / 2);
    c.font = "bold 42px system-ui, Segoe UI, sans-serif";
    c.fillText("HUB", 0, 0);
    c.restore();
    c.save();
    c.translate(W - 48, H / 2);
    c.rotate(Math.PI / 2);
    c.font = "bold 42px system-ui, Segoe UI, sans-serif";
    c.fillText("HUB", 0, 0);
    c.restore();
    // yard lines every 10 yards (10 interior lines between end zones)
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 4;
    const left = 96, right = W - 96, span = right - left;
    for (let i = 0; i <= 10; i++) {
      const x = left + (span * i) / 10;
      c.beginPath();
      c.moveTo(x, 16);
      c.lineTo(x, H - 16);
      c.stroke();
    }
    // hash marks
    c.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      for (let k = 1; k < 5; k++) {
        const x = left + (span * (i + k / 5)) / 10;
        c.beginPath();
        c.moveTo(x, H * 0.33);
        c.lineTo(x, H * 0.33 + 18);
        c.moveTo(x, H * 0.67 - 18);
        c.lineTo(x, H * 0.67);
        c.stroke();
      }
    }
    // numbers
    c.font = "bold 36px system-ui, Segoe UI, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    [10, 20, 30, 40, 50, 40, 30, 20, 10].forEach((n, i) => {
      const x = left + (span * (i + 1)) / 10;
      c.fillText(String(n), x, H * 0.22);
      c.fillText(String(n), x, H * 0.78);
    });
  });
}

function footballTex() {
  return canvasTex(256, 128, (c) => {
    c.fillStyle = "#6b3a1f";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#5a2e16";
    c.fillRect(0, 0, 256, 16);
    c.fillRect(0, 112, 256, 16);
    // laces
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(100, 64);
    c.lineTo(156, 64);
    c.stroke();
    c.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const x = 108 + i * 10;
      c.beginPath();
      c.moveTo(x, 52);
      c.lineTo(x, 76);
      c.stroke();
    }
  });
}

/** Original shield crest — typography + football, not the official NFL shield. */
function nflShieldTex() {
  return canvasTex(512, 640, (c) => {
    c.clearRect(0, 0, 512, 640);
    // custom pointed-kite shield (different silhouette from the official mark)
    c.beginPath();
    c.moveTo(256, 16);
    c.quadraticCurveTo(470, 40, 470, 220);
    c.quadraticCurveTo(470, 420, 256, 624);
    c.quadraticCurveTo(42, 420, 42, 220);
    c.quadraticCurveTo(42, 40, 256, 16);
    c.closePath();
    c.fillStyle = "#14301a";
    c.fill();
    c.strokeStyle = "#d4af37";
    c.lineWidth = 18;
    c.stroke();
    c.save();
    c.clip();
    // turf band
    c.fillStyle = "#2d7a32";
    c.fillRect(80, 200, 352, 220);
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(80, 220 + i * 44);
      c.lineTo(432, 220 + i * 44);
      c.stroke();
    }
    c.restore();
    // football
    c.save();
    c.translate(256, 300);
    c.scale(1, 0.62);
    c.fillStyle = "#6b3a1f";
    c.beginPath();
    c.ellipse(0, 0, 86, 86, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(226, 300);
    c.lineTo(286, 300);
    c.stroke();
    c.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(232 + i * 12, 290);
      c.lineTo(232 + i * 12, 310);
      c.stroke();
    }
    c.fillStyle = "#f4f0e6";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 44px system-ui, Segoe UI, sans-serif";
    c.fillText("NFL", 256, 140);
    c.font = "bold 32px system-ui, Segoe UI, sans-serif";
    c.fillText("GAME HUB", 256, 184);
    c.font = "bold 22px system-ui, Segoe UI, sans-serif";
    c.fillStyle = "#d4af37";
    c.fillText("CAMPUS", 256, 470);
  });
}

function globeTex() {
  return canvasTex(512, 256, (c) => {
    c.fillStyle = "#1a4d7a";
    c.fillRect(0, 0, 512, 256);
    // abstract continents (generic blobs, not a copyrighted map)
    c.fillStyle = "#3d9a5a";
    const blob = (x: number, y: number, rx: number, ry: number) => {
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    };
    blob(90, 110, 70, 50); // Americas-ish
    blob(70, 170, 36, 40);
    blob(250, 100, 50, 36); // Europe/Africa-ish
    blob(255, 160, 40, 50);
    blob(360, 100, 80, 44); // Asia-ish
    blob(420, 180, 30, 22); // Australia-ish
    // latitude lines
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      c.beginPath();
      c.moveTo(0, (i * 256) / 6);
      c.lineTo(512, (i * 256) / 6);
      c.stroke();
    }
    for (let i = 1; i < 8; i++) {
      c.beginPath();
      c.moveTo((i * 512) / 8, 0);
      c.lineTo((i * 512) / 8, 256);
      c.stroke();
    }
  });
}

function chalkboardTex() {
  return canvasTex(512, 384, (c) => {
    c.fillStyle = "#5a3a22";
    c.fillRect(0, 0, 512, 384);
    c.fillStyle = "#1e2a1e";
    c.fillRect(16, 16, 480, 352);
    // chalk dust
    c.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 40; i++) {
      c.fillRect(30 + (i * 97) % 450, 40 + (i * 53) % 300, 8, 2);
    }
    c.fillStyle = "#f4f0e6";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 32px Georgia, 'Times New Roman', serif";
    c.fillText("Destinations", 256, 52);
    c.strokeStyle = "#f4f0e6";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(140, 74);
    c.lineTo(372, 74);
    c.stroke();
    c.textAlign = "left";
    c.font = "28px Georgia, 'Times New Roman', serif";
    DESTINATIONS.forEach((name, i) => {
      const y = 112 + i * 40;
      c.fillText("•  " + name, 80, y);
    });
    // chalk ledge
    c.fillStyle = "#6b4528";
    c.fillRect(16, 360, 480, 16);
    c.fillStyle = "#f4f0e6";
    c.fillRect(40, 364, 36, 6);
  });
}

/** Clean original wordmark — used because no official ApexTitan logo file was found. */
function apexWordmarkTex() {
  return canvasTex(1024, 384, (c) => {
    c.fillStyle = "#0d0d0d";
    c.fillRect(0, 0, 1024, 384);
    // red chevron / peak, original geometric mark (not an official logo)
    c.fillStyle = "#e10600";
    c.beginPath();
    c.moveTo(512, 46);
    c.lineTo(590, 150);
    c.lineTo(512, 122);
    c.lineTo(434, 150);
    c.closePath();
    c.fill();
    c.fillStyle = "#f4f0e6";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "800 96px system-ui, Segoe UI, sans-serif";
    c.fillText("APEX TITAN", 512, 220);
    c.strokeStyle = "#e10600";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(260, 280);
    c.lineTo(764, 280);
    c.stroke();
    c.fillStyle = "#bdbdbd";
    c.font = "600 28px system-ui, Segoe UI, sans-serif";
    c.fillText("SHOP", 512, 320);
  });
}

function shirtTex(color: string, accent: string, label: string) {
  return canvasTex(128, 160, (c) => {
    c.fillStyle = color;
    // torso
    c.fillRect(28, 36, 72, 110);
    // sleeves
    c.fillRect(4, 36, 28, 36);
    c.fillRect(96, 36, 28, 36);
    c.fillStyle = accent;
    c.fillRect(28, 36, 72, 8);
    if (label) {
      c.fillStyle = accent;
      c.font = "bold 14px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(label, 64, 90);
    }
  });
}

function latLonToVec(lat: number, lon: number, r: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function makeGlobe(radius: number, tex: THREE.Texture, withPins: boolean, mobile: boolean) {
  const g = new THREE.Group();
  const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05 }));
  const ball = new THREE.Mesh(mobile ? sphLo : sphGeo, mat);
  ball.scale.setScalar(radius);
  g.add(ball);
  // axis stand
  const standMat = own(new THREE.MeshStandardMaterial({ color: "#8a6a3a", roughness: 0.6 }));
  const baseMat = own(new THREE.MeshStandardMaterial({ color: "#3a2a18", roughness: 0.7 }));
  if (withPins) {
    const pinMat = own(new THREE.MeshBasicMaterial({ color: "#e10600" }));
    const pinHead = own(new THREE.MeshBasicMaterial({ color: "#f4c430" }));
    PINS.forEach((p) => {
      const v = latLonToVec(p.lat, p.lon, radius);
      const pin = mesh(cylGeo, pinMat, 0.012, 0.08, 0.012, 0, 0, 0);
      pin.position.copy(v);
      pin.lookAt(v.clone().multiplyScalar(2));
      pin.rotateX(Math.PI / 2);
      pin.position.add(v.clone().normalize().multiplyScalar(0.04));
      g.add(pin);
      const head = mesh(sphLo, pinHead, 0.03, 0.03, 0.03, 0, 0, 0);
      head.position.copy(v).add(v.clone().normalize().multiplyScalar(0.09));
      g.add(head);
    });
  }
  return { globe: g, standMat, baseMat };
}

function hoopAt(x: number, z: number, facing: number, mats: { metal: THREE.Material; board: THREE.Material; orange: THREE.Material; pad: THREE.Material }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh(cylGeo, mats.metal, 0.03, 0.9, 0.03, 0, 0.45, 0));
  g.add(mesh(boxGeo, mats.metal, 0.04, 0.04, 0.32, 0, 0.88, facing * 0.16));
  const board = mesh(boxGeo, mats.board, 0.7, 0.44, 0.03, 0, 0.92, facing * 0.34);
  g.add(board);
  // inner square
  const sq = mesh(boxGeo, mats.orange, 0.22, 0.16, 0.01, 0, 0.82, facing * 0.356);
  g.add(sq);
  const rim = new THREE.Mesh(torusGeo, mats.orange);
  rim.scale.set(0.13, 0.13, 0.13);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.74, facing * (0.34 + 0.13));
  g.add(rim);
  return g;
}

function basketball(tex: THREE.Texture, x: number, y: number, z: number) {
  const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  return mesh(sphGeo, mat, 0.11, 0.11, 0.11, x, y, z);
}

function football(tex: THREE.Texture, x: number, y: number, z: number) {
  const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 }));
  const m = mesh(sphGeo, mat, 0.1, 0.06, 0.16, x, y, z);
  m.rotation.y = 0.4;
  return m;
}

function emblemPlane(tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, rotY = 0) {
  const mat = own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  return m;
}

function floorOverlay(tex: THREE.Texture, w: number, d: number, y = 0.107) {
  const mat = own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

function clothingRack(x: number, z: number, rotY: number, mobile: boolean) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const metal = own(new THREE.MeshStandardMaterial({ color: "#4a4a4c", metalness: 0.55, roughness: 0.35 }));
  const wood = own(new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.7 }));
  g.add(mesh(cylGeo, metal, 0.025, 1.15, 0.025, -0.7, 0.57, 0));
  g.add(mesh(cylGeo, metal, 0.025, 1.15, 0.025, 0.7, 0.57, 0));
  const bar = mesh(cylGeo, metal, 0.018, 1.46, 0.018, 0, 1.12, 0);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  g.add(mesh(boxGeo, wood, 0.16, 0.05, 0.16, -0.7, 0.025, 0));
  g.add(mesh(boxGeo, wood, 0.16, 0.05, 0.16, 0.7, 0.025, 0));
  const shirts = [
    { color: "#1a1a1a", accent: "#e10600", label: "AT" },
    { color: "#e10600", accent: "#f4f0e6", label: "APEX" },
    { color: "#f4f0e6", accent: "#111", label: "AT" },
    { color: "#2c3a2c", accent: "#e10600", label: "" },
    { color: "#222228", accent: "#e10600", label: "TITAN" },
  ];
  const n = mobile ? 3 : 5;
  for (let i = 0; i < n; i++) {
    const s = shirts[i];
    const hx = -0.55 + (i * 1.1) / Math.max(1, n - 1);
    const hook = mesh(torusGeo, metal, 0.05, 0.05, 0.05, hx, 1.05, 0);
    hook.scale.set(0.06, 0.06, 0.03);
    hook.rotation.x = Math.PI / 2;
    g.add(hook);
    const tex = shirtTex(s.color, s.accent, s.label);
    const mat = own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), mat);
    shirt.position.set(hx, 0.82, 0.01);
    g.add(shirt);
    // slight hoodie bulk on last two
    if (i >= 3) {
      const hood = mesh(sphLo, own(new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.8 })), 0.07, 0.05, 0.07, hx, 0.98, -0.01);
      g.add(hood);
    }
  }
  return g;
}

function gymEquipment(x: number, z: number, rotY: number, mobile: boolean) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const metal = own(new THREE.MeshStandardMaterial({ color: "#3a3a3c", metalness: 0.5, roughness: 0.4 }));
  const black = own(new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 }));
  const red = own(new THREE.MeshStandardMaterial({ color: "#b71c1c", roughness: 0.6 }));
  const silver = own(new THREE.MeshStandardMaterial({ color: "#9a9a9a", metalness: 0.6, roughness: 0.3 }));
  // dumbbell rack (two uprights, three shelves)
  g.add(mesh(boxGeo, metal, 0.04, 0.7, 0.04, -0.28, 0.35, 0));
  g.add(mesh(boxGeo, metal, 0.04, 0.7, 0.04, 0.28, 0.35, 0));
  [0.18, 0.38, 0.58].forEach((y, i) => {
    g.add(mesh(boxGeo, metal, 0.62, 0.03, 0.2, 0, y, 0));
    const db = (ox: number, color: THREE.Material) => {
      const bar = mesh(cylGeo, silver, 0.012, 0.22, 0.012, ox, y + 0.05, 0);
      bar.rotation.z = Math.PI / 2;
      g.add(bar);
      g.add(mesh(sphLo, color, 0.05, 0.05, 0.05, ox - 0.12, y + 0.05, 0));
      g.add(mesh(sphLo, color, 0.05, 0.05, 0.05, ox + 0.12, y + 0.05, 0));
    };
    db(-0.12, i === 2 ? red : black);
    db(0.12, black);
  });
  // kettlebells
  const kb = (ox: number, s: number) => {
    g.add(mesh(sphLo, black, 0.08 * s, 0.07 * s, 0.08 * s, ox, 0.08 * s, 0.28));
    const handle = new THREE.Mesh(torusGeo, silver);
    handle.scale.set(0.05 * s, 0.05 * s, 0.05 * s);
    handle.position.set(ox, 0.16 * s, 0.28);
    g.add(handle);
  };
  kb(-0.16, 1);
  kb(0.14, 0.85);
  // plates leaning
  if (!mobile) {
    [0, 1, 2].forEach((i) => {
      const p = mesh(cylGeo, i === 1 ? red : black, 0.12, 0.03, 0.12, 0.42, 0.12, 0.1 + i * 0.04);
      p.rotation.z = Math.PI / 2;
      p.rotation.y = 0.15;
      g.add(p);
    });
  }
  return g;
}

/**
 * Dress a campus room (and a small outdoor apron in front of the door) with
 * themed props. Returns objects that should spin each frame.
 */

function hqBannerTex() {
  return canvasTex(1024, 256, (c) => {
    c.fillStyle = "#0d0d12";
    c.fillRect(0, 0, 1024, 256);
    c.strokeStyle = "#d4af37";
    c.lineWidth = 10;
    c.strokeRect(8, 8, 1008, 240);
    c.fillStyle = "#d4af37";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "800 92px system-ui, Segoe UI, sans-serif";
    c.fillText("GHOST HQ", 512, 110);
    c.fillStyle = "#f4f0e6";
    c.font = "600 32px system-ui, Segoe UI, sans-serif";
    c.fillText("CHIEF OF STAFF", 512, 180);
  });
}

export function dressThemedRoom(
  G: THREE.Group,
  id: string,
  g: { w: number; d: number },
  mobile: boolean,
  pick: (o: THREE.Object3D) => THREE.Object3D,
): Spin[] {
  const spins: Spin[] = [];
  if (id !== "nba" && id !== "nfl" && id !== "travel" && id !== "shop" && id !== "hq" && id !== "money") return spins;

  const frontZ = g.d / 2 + 0.08;
  const backZ = -g.d / 2 + 0.1;

  if (id === "hq") {
    const banner = hqBannerTex();
    const gold = own(new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 0.55, roughness: 0.35 }));
    const dark = own(new THREE.MeshStandardMaterial({ color: "#16161c", roughness: 0.7 }));
    const metal = own(new THREE.MeshStandardMaterial({ color: "#8a8a90", metalness: 0.6, roughness: 0.3 }));
    const frontZ = g.d / 2 + 0.08;
    const backZ = -g.d / 2 + 0.1;
    const wallY = 2.25;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), gold);
    roof.scale.set(2.5, 0.85, 2.5);
    roof.position.y = wallY + 0.42;
    roof.rotation.y = Math.PI / 4;
    G.add(roof);
    // radio masts
    G.add(mesh(cylGeo, metal, 0.018, 0.7, 0.018, 0.15, wallY + 1.05, 0.1));
    G.add(mesh(cylGeo, metal, 0.012, 0.45, 0.012, -0.18, wallY + 0.95, -0.08));
    const tip = mesh(sphLo, gold, 0.04, 0.04, 0.04, 0.15, wallY + 1.42, 0.1);
    G.add(tip);
    const signF = emblemPlane(banner, 2.2, 0.55, 0, 1.7, frontZ + 0.03);
    pick(signF);
    G.add(signF);
    G.add(emblemPlane(banner, 1.8, 0.45, 0, 1.55, backZ + 0.03));
    // gold ring around the tower base, visible from campus overview
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.15, 48), own(new THREE.MeshBasicMaterial({ color: "#d4af37", transparent: true, opacity: 0.7, side: THREE.DoubleSide })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    G.add(ring);
    return spins;
  }

  if (id === "nba") {
    const court = courtTex();
    const ballT = basketballTex();
    const crest = nbaCrestTex();
    const metal = own(new THREE.MeshStandardMaterial({ color: "#6a6a6c", metalness: 0.5, roughness: 0.4 }));
    const board = own(new THREE.MeshStandardMaterial({ color: "#f4f0e6", roughness: 0.5 }));
    const orange = own(new THREE.MeshStandardMaterial({ color: "#d35400", roughness: 0.45 }));
    const pad = own(new THREE.MeshStandardMaterial({ color: "#2a2a2c" }));
    const mats = { metal, board, orange, pad };
    G.add(floorOverlay(court, g.w - 0.25, g.d - 0.25));
    // outdoor apron court + hoop, visible from the campus overview
    const apron = floorOverlay(court, 2.4, 1.8, 0.02);
    apron.position.set(0, 0.02, frontZ + 1.05);
    G.add(apron);
    const outdoorHoop = hoopAt(0, frontZ + 1.85, -1, mats);
    G.add(outdoorHoop);
    G.add(hoopAt(g.w * 0.36, backZ + 0.15, 1, mats));
    const ball = basketball(ballT, -0.55, 0.12, frontZ + 0.55);
    pick(ball);
    G.add(ball);
    const indoorBall = basketball(ballT, 0.7, 0.12, 0.4);
    G.add(indoorBall);
    const crestOut = emblemPlane(crest, 0.85, 0.85, -1.15, 0.7, frontZ + 0.55, 0.25);
    pick(crestOut);
    G.add(crestOut);
    const post = mesh(boxGeo, metal, 0.06, 0.55, 0.06, -1.15, 0.27, frontZ + 0.55);
    G.add(post);
    const crestIn = emblemPlane(crest, 0.55, 0.55, 0, 0.95, backZ + 0.03);
    G.add(crestIn);
  }

  if (id === "nfl") {
    const turf = turfTex();
    const ballT = footballTex();
    const shield = nflShieldTex();
    const yellow = own(new THREE.MeshStandardMaterial({ color: "#f0c14a", metalness: 0.3, roughness: 0.45 }));
    const metal = own(new THREE.MeshStandardMaterial({ color: "#4a4a4c", metalness: 0.5, roughness: 0.4 }));
    G.add(floorOverlay(turf, g.w - 0.25, g.d - 0.25));
    const apron = floorOverlay(turf, 3.2, 1.7, 0.02);
    apron.position.set(0, 0.02, frontZ + 1.05);
    G.add(apron);
    // goal posts at the far end of the apron
    const gp = new THREE.Group();
    gp.position.set(0, 0, frontZ + 1.85);
    gp.add(mesh(cylGeo, yellow, 0.03, 0.55, 0.03, 0, 0.27, 0));
    gp.add(mesh(boxGeo, yellow, 1.1, 0.04, 0.04, 0, 0.55, 0));
    gp.add(mesh(cylGeo, yellow, 0.025, 0.7, 0.025, -0.53, 0.9, 0));
    gp.add(mesh(cylGeo, yellow, 0.025, 0.7, 0.025, 0.53, 0.9, 0));
    G.add(gp);
    const ball = football(ballT, 0.35, 0.07, frontZ + 0.7);
    pick(ball);
    G.add(ball);
    const ballIn = football(ballT, -0.6, 0.07, 0.2);
    G.add(ballIn);
    const shOut = emblemPlane(shield, 0.7, 0.88, 1.2, 0.72, frontZ + 0.5, -0.25);
    pick(shOut);
    G.add(shOut);
    G.add(mesh(boxGeo, metal, 0.06, 0.55, 0.06, 1.2, 0.27, frontZ + 0.5));
    G.add(emblemPlane(shield, 0.46, 0.58, 0, 0.95, backZ + 0.03));
  }

  if (id === "travel") {
    const gTex = globeTex();
    const board = chalkboardTex();
    const { globe, standMat, baseMat } = makeGlobe(0.55, gTex, true, mobile);
    globe.position.set(1.15, 0.82, frontZ + 0.95);
    pick(globe);
    G.add(globe);
    spins.push({ obj: globe, speed: 0.45 });
    // meridians stand (does not spin)
    const stand = new THREE.Group();
    stand.position.copy(globe.position);
    stand.position.y = 0;
    stand.add(mesh(cylGeo, standMat, 0.018, 0.85, 0.018, 0, 0.5, 0));
    stand.add(mesh(boxGeo, baseMat, 0.36, 0.05, 0.36, 0, 0.025, 0));
    G.add(stand);
    // chalkboard inside, along the right wall
    const chalk = emblemPlane(board, 1.05, 0.78, g.w / 2 - 0.12, 0.72, 0.15, -Math.PI / 2);
    pick(chalk);
    G.add(chalk);
    const frame = mesh(
      boxGeo,
      own(new THREE.MeshStandardMaterial({ color: "#5a3a22", roughness: 0.8 })),
      0.04,
      0.84,
      1.12,
      g.w / 2 - 0.1,
      0.72,
      0.15,
    );
    G.add(frame);
    // small spinning globe on the lead desk
    const { globe: mini } = makeGlobe(0.08, gTex, false, true);
    mini.position.set(-0.42, 0.52, -g.d * 0.12);
    G.add(mini);
    spins.push({ obj: mini, speed: 0.9 });
  }

  if (id === "shop") {
    const mark = apexWordmarkTex();
    const rackOut = clothingRack(-0.15, frontZ + 0.95, 0, mobile);
    pick(rackOut);
    G.add(rackOut);
    const rackIn = clothingRack(-g.w / 2 + 0.45, 0.15, Math.PI / 2, mobile);
    G.add(rackIn);
    const eqOut = gymEquipment(1.15, frontZ + 0.9, -0.2, mobile);
    pick(eqOut);
    G.add(eqOut);
    const eqIn = gymEquipment(g.w / 2 - 0.5, 0.2, -Math.PI / 2, true);
    G.add(eqIn);
    // logo on the back wall and as a facade sign
    const logoIn = emblemPlane(mark, 1.6, 0.6, 0, 1.0, backZ + 0.02);
    G.add(logoIn);
    const logoOut = emblemPlane(mark, 1.5, 0.56, 0, 1.35, frontZ + 0.02);
    pick(logoOut);
    G.add(logoOut);
    // rubber gym floor strip inside
    const rubber = own(new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.95 }));
    const matFloor = new THREE.Mesh(new THREE.PlaneGeometry(g.w - 0.3, g.d - 0.3), rubber);
    matFloor.rotation.x = -Math.PI / 2;
    matFloor.position.y = 0.106;
    G.add(matFloor);
  }


  if (id === "money") {
    const gold = own(new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 0.8, roughness: 0.28 }));
    const steel = own(new THREE.MeshStandardMaterial({ color: "#6a6e72", metalness: 0.85, roughness: 0.3 }));
    const dark = own(new THREE.MeshStandardMaterial({ color: "#2a2c2e", metalness: 0.7, roughness: 0.35 }));
    const green = own(new THREE.MeshStandardMaterial({ color: "#1f6b3a", roughness: 0.7 }));
    const cloth = own(new THREE.MeshStandardMaterial({ color: "#3d6b2e", roughness: 0.85 }));
    const stone = own(new THREE.MeshStandardMaterial({ color: "#d8d2c6", roughness: 0.4, metalness: 0.1 }));
    G.add(floorOverlay(canvasTex(256, 256, (c) => {
      c.fillStyle = "#d8d2c6";
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = "rgba(80,70,60,0.2)";
      for (let i = 0; i < 10; i++) {
        c.beginPath();
        c.moveTo(Math.random() * 256, Math.random() * 256);
        c.lineTo(Math.random() * 256, Math.random() * 256);
        c.stroke();
      }
    }), g.w - 0.2, g.d - 0.2));
    // vault door on the facade
    const vault = new THREE.Group();
    vault.position.set(-0.55, 0.85, frontZ + 0.12);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 32), steel);
    door.rotation.x = Math.PI / 2;
    vault.add(door);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 32), gold);
    vault.add(rim);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 16), dark);
    wheel.position.z = 0.1;
    vault.add(wheel);
    pick(vault);
    G.add(vault);
    // cash stacks, gold bars, money bags in front of the building
    const stack = (x: number, z: number) => {
      G.add(mesh(boxGeo, green, 0.22, 0.1, 0.1, x, 0.08, z));
      G.add(mesh(boxGeo, gold, 0.23, 0.02, 0.11, x, 0.08, z));
    };
    stack(0.7, frontZ + 0.7);
    stack(0.95, frontZ + 0.85);
    stack(1.2, frontZ + 0.7);
    G.add(mesh(boxGeo, gold, 0.28, 0.08, 0.12, 1.35, 0.07, frontZ + 1.05));
    G.add(mesh(boxGeo, gold, 0.28, 0.08, 0.12, 1.5, 0.07, frontZ + 1.15));
    G.add(mesh(boxGeo, gold, 0.28, 0.08, 0.12, 1.42, 0.15, frontZ + 1.1));
    const bagAt = (x: number, z: number) => {
      const bag = new THREE.Group();
      bag.position.set(x, 0, z);
      const body = mesh(sphLo, cloth, 0.16, 0.2, 0.16, 0, 0.18, 0);
      bag.add(body);
      bag.add(mesh(cylGeo, cloth, 0.05, 0.08, 0.05, 0, 0.36, 0));
      const dollar = canvasTex(64, 64, (c) => {
        c.fillStyle = "#f4e7b0";
        c.font = "700 48px Georgia, serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("$", 32, 36);
      });
      const sign = emblemPlane(dollar, 0.14, 0.14, 0, 0.2, 0.17);
      bag.add(sign);
      G.add(bag);
      return bag;
    };
    const b1 = bagAt(-1.15, frontZ + 0.85);
    pick(b1);
    bagAt(-0.85, frontZ + 1.05);
    bagAt(0.35, frontZ + 1.15);
    // a few bills hovering in front (spin as a group)
    const bills = new THREE.Group();
    bills.position.set(0.2, 0.55, frontZ + 0.55);
    const billMat = own(new THREE.MeshStandardMaterial({ color: "#2e8a4a", roughness: 0.7 }));
    for (let i = 0; i < 6; i++) {
      const bill = mesh(boxGeo, billMat, 0.18, 0.004, 0.08, (i % 3) * 0.12 - 0.12, i * 0.05, (i % 2) * 0.08);
      bill.rotation.set(0.2, i * 0.4, 0.1);
      bills.add(bill);
    }
    G.add(bills);
    spins.push({ obj: bills, speed: 0.4 });
    // facade "$ BANK" sign
    const signTex = canvasTex(512, 160, (c) => {
      c.fillStyle = "#1a1612";
      c.fillRect(0, 0, 512, 160);
      c.strokeStyle = "#d4af37";
      c.lineWidth = 8;
      c.strokeRect(6, 6, 500, 148);
      c.fillStyle = "#d4af37";
      c.font = "700 64px Georgia, serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("$  BANK", 256, 84);
    });
    const sign = emblemPlane(signTex, 1.8, 0.56, 0.4, 1.35, frontZ + 0.03);
    pick(sign);
    G.add(sign);
  }

  return spins;
}

// ---------------------------------------------------------------------------
// CSS-3D decorations for the Room3D "enter the room" view
// ---------------------------------------------------------------------------

export function themeFloorBg(id: string, fallback: string): string {
  if (id === "nba") {
    return "repeating-linear-gradient(90deg, #c68642 0 18px, #b87333 18px 36px)";
  }
  if (id === "nfl") {
    return "repeating-linear-gradient(90deg, #2d7a32 0 70px, #24682a 70px 140px)";
  }
  if (id === "shop") {
    return "repeating-linear-gradient(0deg, #161618 0 48px, #1c1c1e 48px 50px), #161618";
  }
  if (id === "money") {
    return "linear-gradient(90deg, #d8d2c6 0 49%, #c8c0b2 49% 51%, #d8d2c6 51%), #d8d2c6";
  }
  if (id === "travel") {
    return "#e6c98a";
  }
  return fallback;
}

const S3: CSSProperties = { position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d" };
const at = (x: number, y: number, z: number) => `translate3d(${x}px, ${y}px, ${z}px)`;

function cssFace(w: number, h: number, tr: string, style: CSSProperties, children?: ReactNode) {
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, transform: tr, boxSizing: "border-box", ...style }}>
      {children}
    </div>
  );
}

function nbaCrestSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="240" fill="#0e1a33" stroke="#e8a317" strokeWidth="16" />
      <circle cx="256" cy="256" r="220" fill="none" stroke="#f4f0e6" strokeWidth="6" />
      <circle cx="256" cy="200" r="86" fill="#d35400" />
      <path d="M256 114 V286 M170 200 H342" stroke="#1a1a1a" strokeWidth="5" fill="none" />
      <ellipse cx="256" cy="200" rx="44" ry="86" fill="none" stroke="#1a1a1a" strokeWidth="5" />
      <text x="256" y="332" textAnchor="middle" fill="#f4f0e6" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="52">NBA</text>
      <text x="256" y="378" textAnchor="middle" fill="#f4f0e6" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="32">GAME HUB</text>
    </svg>
  );
}

function nflShieldSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 512 640">
      <path d="M256 16 Q470 40 470 220 Q470 420 256 624 Q42 420 42 220 Q42 40 256 16 Z" fill="#14301a" stroke="#d4af37" strokeWidth="18" />
      <text x="256" y="150" textAnchor="middle" fill="#f4f0e6" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="44">NFL</text>
      <text x="256" y="192" textAnchor="middle" fill="#f4f0e6" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="30">GAME HUB</text>
      <ellipse cx="256" cy="310" rx="86" ry="52" fill="#6b3a1f" />
      <path d="M226 310 H286" stroke="#f4f0e6" strokeWidth="4" />
    </svg>
  );
}

function chalkboardFace() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1e2a1e", color: "#f4f0e6", fontFamily: "Georgia, serif", padding: "16px 20px", boxSizing: "border-box", border: "12px solid #5a3a22" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 22, borderBottom: "1px solid #f4f0e6", paddingBottom: 6, marginBottom: 8 }}>Destinations</div>
      {DESTINATIONS.map((n) => (
        <div key={n} style={{ fontSize: 18, lineHeight: "26px" }}>•  {n}</div>
      ))}
    </div>
  );
}

function apexWordmarkFace() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0d0d0d", color: "#f4f0e6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: 2 }}>
      <div style={{ width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "22px solid #e10600" }} />
      <b style={{ fontSize: 28, fontWeight: 800 }}>APEX TITAN</b>
      <div style={{ width: 160, height: 3, background: "#e10600" }} />
      <span style={{ fontSize: 12, color: "#bdbdbd", letterSpacing: 6 }}>SHOP</span>
    </div>
  );
}

function cssGlobe(size: number, t: number, pins: boolean) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #4aa0d8, #1a4d7a 60%, #0d2a44)", boxShadow: "inset -12px -8px 20px rgba(0,0,0,.4), 0 8px 16px rgba(0,0,0,.35)", transform: `rotateY(${(t * 40) % 360}deg)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 28% 45%, #3d9a5a 0 14%, transparent 15%), radial-gradient(ellipse at 52% 42%, #3d9a5a 0 10%, transparent 11%), radial-gradient(ellipse at 72% 40%, #3d9a5a 0 14%, transparent 15%), radial-gradient(ellipse at 80% 70%, #3d9a5a 0 6%, transparent 7%)", transform: `rotateY(${(t * 40) % 360}deg)` }} />
      {pins && PINS.slice(0, 6).map((p, i) => (
        <div key={p.name} title={p.name} style={{ position: "absolute", left: `${50 + Math.sin(t * 0.7 + i) * 28 + (p.lon / 180) * 8}%`, top: `${50 - p.lat * 0.35}%`, width: 8, height: 8, borderRadius: 8, background: "#e10600", boxShadow: "0 0 0 2px #f4c430", transform: "translate(-50%,-50%)" }} />
      ))}
    </div>
  );
}

export function ThemeRoomExtras(props: { id: string; t: number; portrait: boolean; W: number; D: number }) {
  const { id, t, portrait, W, D } = props;
  if (id !== "nba" && id !== "nfl" && id !== "travel" && id !== "shop" && id !== "hq" && id !== "money") return null;
  const side = portrait ? W * 0.38 : W * 0.42;
  const front = D * 0.38;

  if (id === "nba") {
    return (
      <>
        {cssFace(W * 0.92, D * 0.7, at(0, -2, D * 0.08) + " rotateX(90deg)", {
          backgroundImage: "radial-gradient(circle at 50% 50%, transparent 54px, #f4f0e6 55px 58px, transparent 59px), linear-gradient(#f4f0e6, #f4f0e6)",
          backgroundSize: "100% 100%, 4px 100%",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          opacity: 0.85,
        })}
        <div style={{ ...S3, transform: at(-side, 0, -D * 0.2) }}>
          {cssFace(140, 140, at(0, -200, 0), { background: "transparent" }, nbaCrestSvg())}
        </div>
        <div style={{ ...S3, transform: at(side * 0.6, -18, front) }}>
          {cssFace(54, 54, "rotateX(70deg)", { borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #e07a30, #d35400 55%, #8a3200)", boxShadow: "0 6px 10px rgba(0,0,0,.4)", border: "3px solid #1a1a1a" })}
        </div>
        {/* simple hoop */}
        <div style={{ ...S3, transform: at(0, 0, -D * 0.42) }}>
          {cssFace(90, 60, at(0, -210, 0), { background: "#f4f0e6", border: "4px solid #333", boxShadow: "0 4px 10px rgba(0,0,0,.35)" },
            <div style={{ position: "absolute", left: "50%", bottom: -8, width: 36, height: 8, marginLeft: -18, border: "3px solid #d35400", borderRadius: 8, background: "transparent" }} />)}
        </div>
      </>
    );
  }

  if (id === "nfl") {
    return (
      <>
        {cssFace(W * 0.92, D * 0.7, at(0, -2, D * 0.08) + " rotateX(90deg)", {
          background: "repeating-linear-gradient(90deg, #2d7a32 0 64px, #f4f0e6 64px 67px, #24682a 67px 128px)",
          pointerEvents: "none",
        })}
        <div style={{ ...S3, transform: at(side, 0, -D * 0.18) }}>
          {cssFace(110, 140, at(0, -200, 0), { background: "transparent" }, nflShieldSvg())}
        </div>
        <div style={{ ...S3, transform: at(-side * 0.35, -16, front * 0.7) }}>
          {cssFace(70, 42, "rotateX(60deg) rotateZ(20deg)", { borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #8a5230, #6b3a1f 70%)", boxShadow: "0 6px 10px rgba(0,0,0,.4)" },
            <div style={{ position: "absolute", left: "30%", right: "30%", top: "42%", height: 2, background: "#f4f0e6" }} />)}
        </div>
      </>
    );
  }

  if (id === "travel") {
    return (
      <>
        <div style={{ ...S3, transform: at(-side * 0.85, 0, -D * 0.15) }}>
          {cssFace(200, 250, at(0, -280, 0), { background: "transparent", boxShadow: "0 10px 24px rgba(0,0,0,.4)" }, chalkboardFace())}
        </div>
        <div style={{ ...S3, transform: at(side * 0.7, -160, D * 0.15) }}>
          {cssFace(160, 160, "", { background: "transparent" }, cssGlobe(160, t, true))}
        </div>
        {/* desk-scale globe sits near the lead desk (center) */}
        <div style={{ ...S3, transform: at(80, -110, portrait ? -D * 0.18 : -D * 0.1) }}>
          {cssFace(52, 52, "", { background: "transparent" }, cssGlobe(52, t * 1.4, false))}
        </div>
      </>
    );
  }

  if (id === "hq") {
    return (
      <>
        <div style={{ ...S3, transform: at(0, 0, -D * 0.46) }}>
          {cssFace(340, 90, at(0, -330, 0), { background: "#0d0d12", border: "3px solid #d4af37", color: "#d4af37", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", letterSpacing: 3, boxShadow: "0 8px 18px rgba(0,0,0,.45)" },
            <><b style={{ fontSize: 28, fontWeight: 800 }}>GHOST HQ</b><span style={{ fontSize: 12, color: "#f4f0e6", letterSpacing: 4, marginTop: 4 }}>CHIEF OF STAFF</span></>)}
        </div>
      </>
    );
  }


  if (id === "money") {
    return (
      <>
        {cssFace(W * 0.92, D * 0.7, at(0, -2, D * 0.08) + " rotateX(90deg)", {
          background: "linear-gradient(90deg, #d8d2c6 0 48%, #c8c0b2 48% 52%, #d8d2c6 52%)",
          pointerEvents: "none",
        })}
        <div style={{ ...S3, transform: at(-side * 0.55, 0, -D * 0.4) }}>
          {cssFace(200, 200, at(0, -280, 0), { borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #8a8e92, #4a4e52 70%)", border: "8px solid #d4af37", boxShadow: "0 10px 24px rgba(0,0,0,.45)" },
            <div style={{ position: "absolute", inset: "28%", borderRadius: "50%", border: "6px solid #2a2c2e" }} />)}
        </div>
        <div style={{ ...S3, transform: at(side * 0.7, -30, front * 0.5) }}>
          {cssFace(50, 28, at(0, 0, 0), { background: "#1f6b3a", borderRadius: 2, boxShadow: "0 4px 8px rgba(0,0,0,.35)", borderTop: "6px solid #d4af37" })}
          {cssFace(50, 28, at(20, 0, 8), { background: "#1f6b3a", borderRadius: 2, borderTop: "6px solid #d4af37" })}
          {cssFace(56, 18, at(-30, 8, 4), { background: "#d4af37", borderRadius: 3, boxShadow: "0 4px 8px rgba(0,0,0,.35)" })}
        </div>
        <div style={{ ...S3, transform: at(-side * 0.2, -20, front * 0.6) }}>
          {cssFace(44, 52, at(0, 0, 0), { background: "#3d6b2e", borderRadius: "50% 50% 46% 46%", boxShadow: "0 6px 10px rgba(0,0,0,.4)", color: "#f4e7b0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }, "$")}
        </div>
      </>
    );
  }

  // shop
  const shirts = ["#1a1a1a", "#e10600", "#f4f0e6", "#2c3a2c"];
  return (
    <>
      <div style={{ ...S3, transform: at(0, 0, -D * 0.46) }}>
        {cssFace(320, 110, at(0, -320, 0), { background: "transparent", boxShadow: "0 8px 18px rgba(0,0,0,.45)" }, apexWordmarkFace())}
      </div>
      <div style={{ ...S3, transform: at(-side, 0, front * 0.2) }}>
        {cssFace(220, 8, at(0, -200, 0), { background: "#6a6a6c", borderRadius: 4 })}
        {shirts.map((col, i) =>
          cssFace(36, 52, at(-80 + i * 52, -168, 2), { background: col, borderRadius: 3, boxShadow: "0 4px 8px rgba(0,0,0,.35)", borderTop: "6px solid #888" }),
        )}
      </div>
      <div style={{ ...S3, transform: at(side * 0.85, 0, front * 0.15) }}>
        {cssFace(70, 18, at(-20, -22, 0), { background: "#1a1a1a", borderRadius: 10 })}
        {cssFace(70, 18, at(16, -22, 10), { background: "#b71c1c", borderRadius: 10 })}
        {cssFace(28, 28, at(-10, -40, 20), { background: "#1a1a1a", borderRadius: "50%", boxShadow: "inset 0 8px 0 #9a9a9a" })}
        {cssFace(22, 22, at(22, -36, 28), { background: "#1a1a1a", borderRadius: "50%", boxShadow: "inset 0 6px 0 #9a9a9a" })}
      </div>
    </>
  );
}
