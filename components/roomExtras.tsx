// Themed interior/campus props for v4 rooms. Procedural, low-poly, no official logos.
"use client";
import * as THREE from "three";
import { makeMiniPlayer } from "./botAvatars";

const box = new THREE.BoxGeometry(1, 1, 1);
const sph = new THREE.SphereGeometry(1, 12, 10);
const sphLo = new THREE.SphereGeometry(1, 8, 6);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
const torus = new THREE.TorusGeometry(1, 0.12, 8, 16);

function M(color: string, opts: { rough?: number; metal?: number } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.7, metalness: opts.metal ?? 0.05 });
}
function add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number, rot?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.needsUpdate = true;
  return tx;
}

export function addPiggyBank(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const pink = M("#f4a7c1", { rough: 0.45 });
  const dark = M("#8a3a5a");
  const body = add(g, sph, pink, 0.55, 0.42, 0.38, 0, 0.42, 0);
  add(g, sphLo, pink, 0.18, 0.16, 0.16, 0.48, 0.48, 0); // snout
  add(g, cyl, dark, 0.03, 0.04, 0.03, 0.62, 0.5, 0.05, [0, 0, Math.PI / 2]);
  add(g, cyl, dark, 0.03, 0.04, 0.03, 0.62, 0.5, -0.05, [0, 0, Math.PI / 2]);
  add(g, sphLo, pink, 0.08, 0.12, 0.06, 0.05, 0.7, 0.12); // ear
  add(g, sphLo, pink, 0.08, 0.12, 0.06, 0.05, 0.7, -0.12);
  add(g, sphLo, dark, 0.04, 0.04, 0.04, 0.25, 0.55, 0.22); // eye
  add(g, sphLo, dark, 0.04, 0.04, 0.04, 0.25, 0.55, -0.22);
  add(g, cyl, pink, 0.07, 0.16, 0.07, -0.2, 0.16, 0.2);
  add(g, cyl, pink, 0.07, 0.16, 0.07, -0.2, 0.16, -0.2);
  add(g, cyl, pink, 0.07, 0.16, 0.07, 0.2, 0.16, 0.2);
  add(g, cyl, pink, 0.07, 0.16, 0.07, 0.2, 0.16, -0.2);
  // coin slot
  add(g, box, dark, 0.22, 0.02, 0.04, 0, 0.82, 0);
  void body;
  parent.add(g);
  return g;
}

export function addCoinStack(parent: THREE.Object3D, x: number, y: number, z: number, n = 6) {
  const gold = M("#d4af37", { metal: 0.8, rough: 0.3 });
  for (let i = 0; i < n; i++) add(parent, cyl, gold, 0.08, 0.02, 0.08, x, y + 0.02 + i * 0.022, z);
}

export function addMoneyBag(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const cloth = M("#3d6b2e", { rough: 0.85 });
  add(g, sph, cloth, 0.28, 0.32, 0.28, 0, 0.3, 0);
  add(g, cyl, cloth, 0.08, 0.14, 0.08, 0, 0.6, 0);
  add(g, torus, M("#d4af37", { metal: 0.5, rough: 0.4 }), 0.09, 0.09, 0.09, 0, 0.56, 0, [Math.PI / 2, 0, 0]);
  const mark = canvasTex(64, 64, (c) => {
    c.fillStyle = "#f4e7b0";
    c.font = "700 48px Georgia, serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("$", 32, 36);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: mark, transparent: true }));
  sign.position.set(0, 0.32, 0.29);
  g.add(sign);
  parent.add(g);
  return g;
}

export function addCashCounter(parent: THREE.Object3D, x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  add(g, box, M("#2a2a2c"), 0.7, 0.22, 0.4, 0, 0.11, 0);
  add(g, box, M("#111"), 0.5, 0.08, 0.08, 0, 0.26, 0.12);
  const tex = canvasTex(256, 64, (c) => {
    c.fillStyle = "#0a1a0a";
    c.fillRect(0, 0, 256, 64);
    c.fillStyle = "#7dff9a";
    c.font = "700 32px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("COUNT  ·  $", 128, 34);
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.12), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 0.26, 0.165);
  g.add(screen);
  parent.add(g);
  return g;
}

const DEST = [
  { name: "Japan", colors: ["#fff", "#bc002d"] },
  { name: "Italy", colors: ["#009246", "#fff", "#ce2b37"] },
  { name: "Mexico", colors: ["#006847", "#fff", "#ce1126"] },
  { name: "Jamaica", colors: ["#009b3a", "#fed100", "#009b3a"] },
  { name: "Greece", colors: ["#0d5eaf", "#fff"] },
  { name: "France", colors: ["#0055a4", "#fff", "#ef4135"] },
];

export function addFlagBillboard(parent: THREE.Object3D, x: number, y: number, z: number, rotY = 0) {
  const tex = canvasTex(1024, 512, (c) => {
    c.fillStyle = "#f4f0e6";
    c.fillRect(0, 0, 1024, 512);
    c.strokeStyle = "#5a3a22";
    c.lineWidth = 16;
    c.strokeRect(8, 8, 1008, 496);
    c.fillStyle = "#1a1a1a";
    c.font = "700 42px system-ui, sans-serif";
    c.textAlign = "center";
    c.fillText("Destinations", 512, 58);
    DEST.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x0 = 70 + col * 320;
      const y0 = 110 + row * 180;
      const w = 260, h = 110;
      const n = d.colors.length;
      d.colors.forEach((colr, k) => {
        c.fillStyle = colr;
        c.fillRect(x0 + (k * w) / n, y0, w / n + 1, h);
      });
      c.strokeStyle = "#222";
      c.lineWidth = 3;
      c.strokeRect(x0, y0, w, h);
      c.fillStyle = "#1a1a1a";
      c.font = "700 32px system-ui, sans-serif";
      c.textAlign = "center";
      c.fillText(d.name, x0 + w / 2, y0 + h + 36);
    });
  });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  add(g, box, M("#5a3a22"), 3.3, 1.85, 0.08, 0, 0, -0.08);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 1.7), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  face.position.z = 0.06;
  g.add(face);
  parent.add(g);
  return g;
}

export function addSpinningGlobe(parent: THREE.Object3D, x: number, y: number, z: number, ticks: Array<(t: number, dt?: number) => void>, radius = 0.38) {
  const tex = canvasTex(256, 128, (c) => {
    c.fillStyle = "#1a4a8a";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#2e8a4a";
    c.beginPath(); c.ellipse(70, 60, 28, 34, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(140, 50, 18, 22, 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(200, 70, 22, 18, -0.2, 0, Math.PI * 2); c.fill();
  });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
  ball.position.y = radius + 0.16;
  g.add(ball);
  add(g, cyl, M("#c9a227", { metal: 0.7, rough: 0.3 }), 0.03, 0.32, 0.03, 0, 0.16, 0);
  add(g, box, M("#3a2a18"), 0.36, 0.05, 0.36, 0, 0.025, 0);
  parent.add(g);
  ticks.push((t) => { ball.rotation.y = t * 0.55; });
  return g;
}

export function addToyTrain(parent: THREE.Object3D, cx: number, cy: number, cz: number, ticks: Array<(t: number, dt?: number) => void>) {
  const track = new THREE.Group();
  track.position.set(cx, cy, cz);
  const rail = M("#5a5a5c", { metal: 0.5, rough: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.025, 6, 40), rail);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  track.add(ring);
  parent.add(track);
  const train = new THREE.Group();
  const red = M("#b71c1c");
  const blk = M("#222");
  add(train, box, red, 0.28, 0.16, 0.16, 0, 0.12, 0);
  add(train, box, red, 0.12, 0.12, 0.16, 0.18, 0.1, 0);
  add(train, cyl, blk, 0.04, 0.05, 0.04, 0.12, 0.04, 0.08, [Math.PI / 2, 0, 0]);
  add(train, cyl, blk, 0.04, 0.05, 0.04, -0.08, 0.04, 0.08, [Math.PI / 2, 0, 0]);
  add(train, cyl, blk, 0.04, 0.05, 0.04, 0.12, 0.04, -0.08, [Math.PI / 2, 0, 0]);
  add(train, cyl, blk, 0.04, 0.05, 0.04, -0.08, 0.04, -0.08, [Math.PI / 2, 0, 0]);
  parent.add(train);
  ticks.push((t) => {
    const a = t * 0.7;
    train.position.set(cx + Math.cos(a) * 1.35, cy + 0.02, cz + Math.sin(a) * 1.35);
    train.rotation.y = -a + Math.PI / 2;
  });
  return train;
}

export function addFloorAirplane(parent: THREE.Object3D, cx: number, cy: number, cz: number, ticks: Array<(t: number, dt?: number) => void>) {
  const g = new THREE.Group();
  const white = M("#f4f0e6");
  const blue = M("#2a4a7a");
  const body = add(g, cyl, white, 0.05, 0.36, 0.05, 0, 0.08, 0, [0, 0, Math.PI / 2]);
  add(g, box, blue, 0.1, 0.02, 0.36, 0, 0.08, 0);
  add(g, box, blue, 0.06, 0.1, 0.02, -0.14, 0.14, 0);
  void body;
  parent.add(g);
  ticks.push((t) => {
    const a = t * 0.85 + 1.2;
    g.position.set(cx + Math.cos(a) * 1.9, cy + 0.16, cz + Math.sin(a) * 1.9);
    g.rotation.y = -a + Math.PI / 2;
    g.scale.setScalar(1.85);
  });
  return g;
}

function jerseyMesh(colors: [string, string], number: string, kind: "nfl" | "nba") {
  const tex = canvasTex(128, 160, (c) => {
    c.fillStyle = colors[0];
    c.fillRect(0, 0, 128, 160);
    c.fillStyle = colors[1];
    if (kind === "nfl") {
      c.fillRect(0, 0, 128, 22);
      c.fillRect(0, 138, 128, 22);
    } else {
      c.fillRect(0, 14, 128, 10);
    }
    c.fillStyle = colors[1];
    c.font = "700 64px system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(number, 64, 88);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  return m;
}

export function addJerseyWall(parent: THREE.Object3D, x: number, y: number, z: number, rotY: number, kind: "nfl" | "nba") {
  const palettes: Array<[string, string]> = kind === "nfl"
    ? [["#1a2a4a", "#f0c14a"], ["#6b1d2a", "#f4f0e6"], ["#1e3a2a", "#f4f0e6"], ["#111", "#c62828"], ["#2a4a7a", "#f4f0e6"]]
    : [["#d35400", "#f4f0e6"], ["#0e1a33", "#e8a317"], ["#1a1a1a", "#e10600"], ["#1e4a8a", "#f4f0e6"], ["#2e8a4a", "#f4f0e6"]];
  const nums = kind === "nfl" ? ["12", "7", "24", "88", "3"] : ["23", "30", "11", "8", "15"];
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  add(g, box, M("#5a3a22"), 2.6, 0.05, 0.08, 0, 0.55, -0.02);
  palettes.forEach((col, i) => {
    const j = jerseyMesh(col, nums[i], kind);
    j.position.set(-1.0 + i * 0.5, 0.2, 0);
    g.add(j);
  });
  parent.add(g);
  return g;
}

export function addTrophy(parent: THREE.Object3D, x: number, y: number, z: number, kind: "nfl" | "nba") {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const gold = M("#d4af37", { metal: 0.85, rough: 0.25 });
  add(g, cyl, M("#3a2a18"), 0.16, 0.06, 0.16, 0, 0.03, 0);
  add(g, cyl, gold, 0.05, 0.28, 0.05, 0, 0.2, 0);
  add(g, sph, gold, 0.14, 0.12, 0.14, 0, 0.42, 0);
  if (kind === "nfl") add(g, sphLo, M("#6b3a1f"), 0.08, 0.05, 0.08, 0, 0.56, 0);
  else add(g, sphLo, M("#d35400"), 0.07, 0.07, 0.07, 0, 0.56, 0);
  parent.add(g);
  return g;
}

export function addFilmScreen(
  parent: THREE.Object3D,
  x: number, y: number, z: number, rotY: number,
  kind: "nfl" | "nba",
  ticks: Array<(t: number, dt?: number) => void>,
  w = 2.6, h = 1.5,
) {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 288;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  add(g, box, M("#111"), w + 0.12, h + 0.12, 0.06, 0, 0, -0.03);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  g.add(face);
  parent.add(g);
  let last = -1;
  ticks.push((t) => {
    const frame = Math.floor(t * 8);
    if (frame === last) return;
    last = frame;
    const c = cv.getContext("2d")!;
    c.fillStyle = "#0b1220";
    c.fillRect(0, 0, 512, 288);
    c.fillStyle = "#7dff9a";
    c.font = "700 16px ui-monospace, monospace";
    c.fillText(kind === "nfl" ? "GAME FILM  ·  PLAY DIAGRAM" : "GAME FILM  ·  COURT DIAGRAM", 16, 24);
    c.strokeStyle = "#3a6a4a";
    c.lineWidth = 2;
    if (kind === "nfl") {
      // field
      c.fillStyle = "#1a4a22";
      c.fillRect(40, 48, 432, 220);
      c.strokeStyle = "#e8f0e0";
      for (let i = 0; i <= 8; i++) {
        c.beginPath();
        c.moveTo(40 + i * 54, 48);
        c.lineTo(40 + i * 54, 268);
        c.stroke();
      }
      const ph = (t * 0.35) % 1;
      const players = [
        { g: "O", x: 80, y: 160 },
        { g: "O", x: 120, y: 120 },
        { g: "O", x: 120, y: 200 },
        { g: "O", x: 160, y: 160 },
        { g: "X", x: 300, y: 140 },
        { g: "X", x: 340, y: 180 },
        { g: "X", x: 380, y: 120 },
        { g: "X", x: 400, y: 200 },
      ];
      c.font = "700 28px system-ui, sans-serif";
      c.textAlign = "center";
      players.forEach((p, i) => {
        const wob = Math.sin(t * 2 + i) * 6;
        c.fillStyle = p.g === "O" ? "#f0c14a" : "#9ad0ff";
        c.fillText(p.g, p.x + wob, p.y);
      });
      // ball path
      c.strokeStyle = "#f4f0e6";
      c.setLineDash([6, 6]);
      c.beginPath();
      c.moveTo(170, 160);
      c.quadraticCurveTo(260, 80, 360 + ph * 40, 150);
      c.stroke();
      c.setLineDash([]);
    } else {
      c.fillStyle = "#c68642";
      c.fillRect(40, 48, 432, 220);
      c.strokeStyle = "#f4f0e6";
      c.strokeRect(50, 58, 412, 200);
      c.beginPath();
      c.arc(256, 158, 40, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(256, 58);
      c.lineTo(256, 258);
      c.stroke();
      const dots = [
        { x: 120, y: 140 }, { x: 180, y: 200 }, { x: 256, y: 120 },
        { x: 320, y: 200 }, { x: 380, y: 140 }, { x: 200, y: 160 },
      ];
      dots.forEach((d, i) => {
        c.fillStyle = i % 2 ? "#0e1a33" : "#d35400";
        const wobx = Math.sin(t * 1.6 + i) * 18;
        const woby = Math.cos(t * 1.4 + i * 0.7) * 12;
        c.beginPath();
        c.arc(d.x + wobx, d.y + woby, 8, 0, Math.PI * 2);
        c.fill();
      });
    }
    tex.needsUpdate = true;
  });
  return g;
}

export function addMiniFootballGame(parent: THREE.Object3D, x: number, y: number, z: number, ticks: Array<(t: number, dt?: number) => void>) {
  const a = makeMiniPlayer("#1e3a2a", 0.5);
  const b = makeMiniPlayer("#6b1d2a", 0.5);
  a.group.position.set(x - 1.1, y, z);
  b.group.position.set(x + 1.1, y, z);
  a.group.rotation.y = Math.PI / 2;
  b.group.rotation.y = -Math.PI / 2;
  parent.add(a.group);
  parent.add(b.group);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M("#6b3a1f"));
  ball.scale.set(1, 0.7, 1);
  parent.add(ball);
  ticks.push((t) => {
    a.tick(t, "idle");
    b.tick(t, "idle");
    const u = (t * 0.45) % 1;
    const going = u < 0.5;
    const p = going ? u * 2 : (u - 0.5) * 2;
    const x0 = going ? x - 0.9 : x + 0.9;
    const x1 = going ? x + 0.9 : x - 0.9;
    const px = x0 + (x1 - x0) * p;
    const py = y + 0.35 + Math.sin(p * Math.PI) * 0.85;
    ball.position.set(px, py, z);
    ball.rotation.z = t * 6;
  });
}
