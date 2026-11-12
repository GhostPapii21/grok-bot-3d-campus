// Themed room decor for the WebGL campus. Each builder adds meshes to the room group and returns an
// update(t) that animates them. Everything is built from the shared primitives, so it stays cheap.
import * as THREE from "three";
import type { RoomTheme } from "./themes";

export type Kit = {
  mesh: (g: THREE.BufferGeometry, m: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number, shadow?: boolean) => THREE.Mesh;
  geo: { box: THREE.BufferGeometry; sph: THREE.BufferGeometry; sphLo: THREE.BufferGeometry; cyl: THREE.BufferGeometry; cone: THREE.BufferGeometry; cap: THREE.BufferGeometry };
  own: <T extends THREE.Material>(m: T) => T;
  canvasTex: (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => THREE.Texture;
  blobColor: (i: number) => string;
  wallH: number;
};
export type Decor = { update: (t: number) => void; onWall: THREE.Object3D[] };
type Geo = { w: number; d: number };

const std = (k: Kit, color: string, o: any = {}) => k.own(new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o }));
const basic = (k: Kit, o: any) => k.own(new THREE.MeshBasicMaterial(o));
const plane = (k: Kit, w: number, h: number, tex: THREE.Texture, o: any = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(k, { map: tex, transparent: true, ...o }));

// a small blob bot (one sphere body, two eyes) for the practice field / court
function miniBot(k: Kit, color: string, s = 1) {
  const g = new THREE.Group();
  const body = k.mesh(k.geo.sph, std(k, color, { roughness: 0.35 }), 0.085 * s, 0.1 * s, 0.085 * s, 0, 0.1 * s, 0);
  const eye = basic(k, { color: "#111111" });
  g.add(body, k.mesh(k.geo.sphLo, eye, 0.014 * s, 0.02 * s, 0.01 * s, -0.03 * s, 0.125 * s, 0.075 * s, false), k.mesh(k.geo.sphLo, eye, 0.014 * s, 0.02 * s, 0.01 * s, 0.03 * s, 0.125 * s, 0.075 * s, false));
  return { g, body };
}

function trophy(k: Kit, x: number, z: number, ball: "football" | "basketball") {
  const g = new THREE.Group(); g.position.set(x, 0.1, z);
  const gold = std(k, "#f5c542", { metalness: 0.75, roughness: 0.25 });
  g.add(k.mesh(k.geo.box, std(k, "#2a2a2c"), 0.2, 0.06, 0.2, 0, 0.03, 0), k.mesh(k.geo.cyl, gold, 0.03, 0.14, 0.03, 0, 0.13, 0), k.mesh(k.geo.cyl, gold, 0.09, 0.1, 0.09, 0, 0.25, 0));
  const top = ball === "football" ? k.mesh(k.geo.sph, std(k, "#8a4b22"), 0.06, 0.06, 0.1, 0, 0.38, 0) : k.mesh(k.geo.sph, std(k, "#e8792a"), 0.085, 0.085, 0.085, 0, 0.39, 0);
  if (ball === "football") top.rotation.x = Math.PI / 2.6;
  g.add(top);
  return { g, top };
}

function jerseyTex(k: Kit, color: string, trim: string, num: string) {
  return k.canvasTex(128, 144, (c) => {
    c.clearRect(0, 0, 128, 144);
    c.fillStyle = color; c.beginPath();
    c.moveTo(34, 10); c.lineTo(8, 26); c.lineTo(20, 54); c.lineTo(32, 46); c.lineTo(32, 136); c.lineTo(96, 136); c.lineTo(96, 46); c.lineTo(108, 54); c.lineTo(120, 26); c.lineTo(94, 10);
    c.quadraticCurveTo(64, 30, 34, 10); c.closePath(); c.fill();
    c.strokeStyle = trim; c.lineWidth = 5; c.stroke();
    c.fillStyle = trim; c.font = "bold 54px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(num, 64, 88);
  });
}
function jerseys(k: Kit, G: THREE.Group, g: Geo, sets: [string, string, string][], sleeveless: boolean): THREE.Object3D[] {
  // on the left side wall, facing into the room
  const out: THREE.Object3D[] = [];
  sets.forEach(([color, trim, num], i) => {
    const tex = sleeveless ? k.canvasTex(128, 144, (c) => {
      c.clearRect(0, 0, 128, 144); c.fillStyle = color; c.beginPath();
      c.moveTo(40, 8); c.quadraticCurveTo(64, 34, 88, 8); c.lineTo(104, 8); c.quadraticCurveTo(96, 44, 108, 58); c.lineTo(108, 136); c.lineTo(20, 136); c.lineTo(20, 58); c.quadraticCurveTo(32, 44, 24, 8); c.closePath(); c.fill();
      c.strokeStyle = trim; c.lineWidth = 5; c.stroke();
      c.fillStyle = trim; c.font = "bold 56px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(num, 64, 86);
    }) : jerseyTex(k, color, trim, num);
    const p = plane(k, 0.36, 0.4, tex);
    p.rotation.y = Math.PI / 2; p.position.set(-g.w / 2 + 0.09, 0.66, -g.d / 2 + 0.55 + i * 0.5);
    G.add(p); out.push(p);
  });
  return out;
}

// ------------------------------------------------------------------ money
function money(k: Kit, G: THREE.Group, g: Geo): Decor {
  const gold = std(k, "#f5c542", { metalness: 0.7, roughness: 0.3 });
  const pink = std(k, "#ff8fb3", { roughness: 0.4 });
  // piggy bank, back-left corner
  const pig = new THREE.Group(); pig.position.set(-g.w / 2 + 0.5, 0.1, -g.d / 2 + 0.55); G.add(pig);
  pig.add(k.mesh(k.geo.sph, pink, 0.26, 0.21, 0.2, 0, 0.27, 0), k.mesh(k.geo.cyl, pink, 0.07, 0.07, 0.07, 0.27, 0.27, 0));
  (pig.children[1] as THREE.Mesh).rotation.z = Math.PI / 2;
  [[-0.13, -0.1], [-0.13, 0.1], [0.12, -0.1], [0.12, 0.1]].forEach(([x, z]) => pig.add(k.mesh(k.geo.cyl, pink, 0.04, 0.1, 0.04, x, 0.05, z)));
  [[0.1, -0.09], [0.1, 0.09]].forEach(([x, z]) => pig.add(k.mesh(k.geo.cone, pink, 0.05, 0.08, 0.05, x, 0.48, z)));
  const eye = basic(k, { color: "#111111" });
  pig.add(k.mesh(k.geo.sphLo, eye, 0.018, 0.022, 0.012, 0.2, 0.34, -0.08, false), k.mesh(k.geo.sphLo, eye, 0.018, 0.022, 0.012, 0.2, 0.34, 0.08, false));
  pig.add(k.mesh(k.geo.box, std(k, "#3a1a26"), 0.1, 0.012, 0.03, -0.02, 0.48, 0, false));   // coin slot
  pig.rotation.y = -0.6;
  const coin = k.mesh(k.geo.cyl, gold, 0.055, 0.012, 0.055, -0.02, 0.8, 0, false); coin.rotation.x = Math.PI / 2; pig.add(coin);
  // money bags, back-right corner
  const bags: THREE.Group[] = [];
  const bagTex = k.canvasTex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.fillStyle = "#1f5d33"; c.font = "bold 50px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 32, 35); });
  [[g.w / 2 - 0.45, -g.d / 2 + 0.45, 1], [g.w / 2 - 0.82, -g.d / 2 + 0.36, 0.78], [g.w / 2 - 0.4, -g.d / 2 + 0.86, 0.66]].forEach(([x, z, s]) => {
    const b = new THREE.Group(); b.position.set(x, 0.1, z); b.scale.setScalar(s);
    const sack = std(k, "#c9b27a", { roughness: 0.85 });
    b.add(k.mesh(k.geo.sph, sack, 0.17, 0.17, 0.17, 0, 0.16, 0), k.mesh(k.geo.cyl, sack, 0.06, 0.09, 0.06, 0, 0.33, 0), k.mesh(k.geo.cyl, std(k, "#8a6a2f"), 0.066, 0.02, 0.066, 0, 0.3, 0));
    const tag = plane(k, 0.2, 0.2, bagTex); tag.position.set(0, 0.17, 0.172); b.add(tag);
    const tag2 = plane(k, 0.2, 0.2, bagTex); tag2.position.set(-0.172, 0.17, 0); tag2.rotation.y = -Math.PI / 2; b.add(tag2);
    G.add(b); bags.push(b);
  });
  // coin stacks by the lead's desk and a cash chart on the right wall
  const stacks: THREE.Mesh[] = [];
  [[-0.95, 0.42, 5], [-1.1, 0.5, 3], [-0.82, 0.55, 7]].forEach(([x, z, n]) => { for (let i = 0; i < n; i++) { const c = k.mesh(k.geo.cyl, gold, 0.06, 0.02, 0.06, x, 0.11 + i * 0.022, z, false); G.add(c); stacks.push(c); } });
  const chart = plane(k, 0.9, 0.5, k.canvasTex(256, 144, (c) => {
    c.fillStyle = "#101512"; c.fillRect(0, 0, 256, 144); c.strokeStyle = "#2ecc71"; c.lineWidth = 5; c.beginPath();
    [[14, 120], [58, 100], [96, 108], [140, 70], [184, 78], [240, 24]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.fillStyle = "#2ecc71"; c.font = "bold 30px system-ui, sans-serif"; c.fillText("$ ▲", 14, 36);
  }), { transparent: false });
  chart.rotation.y = -Math.PI / 2; chart.position.set(g.w / 2 - 0.09, 0.66, -0.2); G.add(chart);
  return { onWall: [chart], update: (t) => {
    coin.position.y = 0.62 + ((t * 0.5) % 1 < 0.6 ? 0.28 * (1 - ((t * 0.5) % 1) / 0.6) : 0.28); coin.rotation.z = t * 6;
    coin.visible = (t * 0.5) % 1 < 0.6;
    pig.scale.y = 1 + 0.03 * Math.sin(t * 2);
    bags.forEach((b, i) => { b.rotation.z = 0.04 * Math.sin(t * 1.3 + i * 2); });
  } };
}

// ------------------------------------------------------------------ travel
function travel(k: Kit, G: THREE.Group, g: Geo): Decor {
  // spinning globe on a stand, back-left corner
  const globeTex = k.canvasTex(512, 256, (c) => {
    c.fillStyle = "#1d6fd1"; c.fillRect(0, 0, 512, 256); c.fillStyle = "#3fbf6b";
    const land: [number, number, number, number][] = [[90, 80, 60, 40], [120, 150, 30, 50], [250, 70, 45, 30], [270, 130, 35, 50], [350, 80, 80, 40], [420, 170, 35, 22], [60, 50, 30, 18]];
    land.forEach(([x, y, rx, ry]) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = "#e8f1f8"; c.fillRect(0, 0, 512, 12); c.fillRect(0, 244, 512, 12);
  });
  const gp = new THREE.Group(); gp.position.set(-g.w / 2 + 0.5, 0.1, -g.d / 2 + 0.55); G.add(gp);
  gp.add(k.mesh(k.geo.cyl, std(k, "#2a2a2c"), 0.16, 0.03, 0.16, 0, 0.015, 0), k.mesh(k.geo.cyl, std(k, "#b08d57", { metalness: 0.6, roughness: 0.35 }), 0.018, 0.3, 0.018, 0, 0.18, 0));
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 20), k.own(new THREE.MeshStandardMaterial({ map: globeTex, roughness: 0.5 })));
  globe.position.y = 0.56; globe.rotation.z = 0.41; gp.add(globe);
  // country flags on the left wall
  const flags: [string, (c: CanvasRenderingContext2D) => void][] = [
    ["JP", (c) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, 96, 64); c.fillStyle = "#d7263d"; c.beginPath(); c.arc(48, 32, 18, 0, 7); c.fill(); }],
    ["FR", (c) => { c.fillStyle = "#2156a5"; c.fillRect(0, 0, 32, 64); c.fillStyle = "#ffffff"; c.fillRect(32, 0, 32, 64); c.fillStyle = "#e23d3d"; c.fillRect(64, 0, 32, 64); }],
    ["IT", (c) => { c.fillStyle = "#1f9d55"; c.fillRect(0, 0, 32, 64); c.fillStyle = "#ffffff"; c.fillRect(32, 0, 32, 64); c.fillStyle = "#d7263d"; c.fillRect(64, 0, 32, 64); }],
    ["BR", (c) => { c.fillStyle = "#1f9d55"; c.fillRect(0, 0, 96, 64); c.fillStyle = "#f5d142"; c.beginPath(); c.moveTo(48, 6); c.lineTo(90, 32); c.lineTo(48, 58); c.lineTo(6, 32); c.closePath(); c.fill(); c.fillStyle = "#1d4fa3"; c.beginPath(); c.arc(48, 32, 13, 0, 7); c.fill(); }],
    ["DE", (c) => { c.fillStyle = "#111111"; c.fillRect(0, 0, 96, 22); c.fillStyle = "#d7263d"; c.fillRect(0, 22, 96, 21); c.fillStyle = "#f5c542"; c.fillRect(0, 43, 96, 21); }],
  ];
  const onWall: THREE.Object3D[] = [];
  flags.forEach(([, draw], i) => {
    const f = plane(k, 0.34, 0.23, k.canvasTex(96, 64, draw), { transparent: false });
    f.rotation.y = Math.PI / 2; f.position.set(-g.w / 2 + 0.09, 0.8 - (i % 2) * 0.3, -g.d / 2 + 1.0 + Math.floor(i / 2) * 0.48 + (i % 2) * 0.24);
    G.add(f); onWall.push(f);
  });
  // world map with a route on the right wall
  const map = plane(k, 1.1, 0.56, k.canvasTex(320, 160, (c) => {
    c.fillStyle = "#0f1a2a"; c.fillRect(0, 0, 320, 160); c.fillStyle = "#28507a";
    [[60, 60, 34, 24], [78, 110, 16, 30], [160, 54, 26, 18], [172, 100, 20, 30], [230, 60, 46, 26], [272, 122, 20, 12]].forEach(([x, y, rx, ry]) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0.2, 0, 7); c.fill(); });
    c.strokeStyle = "#ffd166"; c.setLineDash([7, 6]); c.lineWidth = 3; c.beginPath(); c.moveTo(62, 62); c.quadraticCurveTo(150, 6, 244, 60); c.stroke();
    c.setLineDash([]); c.fillStyle = "#ff5d73"; [[62, 62], [244, 60], [160, 54]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); });
  }), { transparent: false });
  map.rotation.y = -Math.PI / 2; map.position.set(g.w / 2 - 0.09, 0.68, -0.2); G.add(map); onWall.push(map);
  // airplane circling overhead
  const plane3 = new THREE.Group(); G.add(plane3);
  const white = std(k, "#f2f4f8", { roughness: 0.35 }); const red = std(k, "#e23d3d");
  const fus = k.mesh(k.geo.cap, white, 0.36, 0.5, 0.36, 0, 0, 0); fus.rotation.z = Math.PI / 2; plane3.add(fus);
  plane3.add(k.mesh(k.geo.box, white, 0.1, 0.012, 0.5, 0, 0, 0), k.mesh(k.geo.box, red, 0.06, 0.1, 0.012, -0.15, 0.06, 0), k.mesh(k.geo.box, white, 0.05, 0.01, 0.2, -0.15, 0.01, 0));
  // toy train looping on the floor at the front of the room
  const train = new THREE.Group(); G.add(train);
  const cars: THREE.Group[] = [];
  const colors = ["#e23d3d", "#f5c542", "#3b82f6", "#2ecc71"];
  colors.forEach((col, i) => {
    const car = new THREE.Group();
    car.add(k.mesh(k.geo.box, std(k, col), 0.2, 0.1, 0.1, 0, 0.08, 0), k.mesh(k.geo.cyl, std(k, "#222222"), 0.028, 0.11, 0.028, -0.06, 0.03, 0, false), k.mesh(k.geo.cyl, std(k, "#222222"), 0.028, 0.11, 0.028, 0.06, 0.03, 0, false));
    (car.children[1] as THREE.Mesh).rotation.x = Math.PI / 2; (car.children[2] as THREE.Mesh).rotation.x = Math.PI / 2;
    if (i === 0) car.add(k.mesh(k.geo.cyl, std(k, "#222222"), 0.022, 0.07, 0.022, 0.05, 0.16, 0, false), k.mesh(k.geo.box, std(k, col), 0.08, 0.08, 0.1, -0.05, 0.17, 0));
    train.add(car); cars.push(car);
  });
  const rx = Math.min(1.9, g.w / 2 - 0.5), rz = 0.2, cz = g.d / 2 - 0.36;
  const track = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), k.own(new THREE.MeshStandardMaterial({ color: "#6b6b70", roughness: 0.6 })));
  track.rotation.x = Math.PI / 2; track.scale.set(rx, rz, 1); track.position.set(0, 0.108, cz); G.add(track);
  // suitcase
  const sc = new THREE.Group(); sc.position.set(g.w / 2 - 0.45, 0.1, -g.d / 2 + 0.45); G.add(sc);
  sc.add(k.mesh(k.geo.box, std(k, "#c2552d"), 0.34, 0.24, 0.14, 0, 0.14, 0), k.mesh(k.geo.box, std(k, "#333333"), 0.12, 0.03, 0.03, 0, 0.28, 0), k.mesh(k.geo.box, std(k, "#f5c542"), 0.36, 0.03, 0.15, 0, 0.18, 0));
  return { onWall, update: (t) => {
    globe.rotation.y = t * 0.6;
    const a = t * 0.55; const R = Math.min(1.7, g.w / 2 - 0.7);
    plane3.position.set(Math.cos(a) * R, k.wallH + 0.28 + 0.05 * Math.sin(t * 1.4), Math.sin(a) * R * 0.5 - 0.2);
    plane3.rotation.y = -a - Math.PI / 2; plane3.rotation.z = 0.25;
    cars.forEach((car, i) => { const b = t * 0.7 - i * 0.16; car.position.set(Math.cos(b) * rx, 0.1, cz + Math.sin(b) * rz); car.rotation.y = -b - Math.PI / 2; });
  } };
}

// ------------------------------------------------------------------ football / basketball
function fieldTex(k: Kit) {
  return k.canvasTex(512, 128, (c) => {
    c.fillStyle = "#1f7a3a"; c.fillRect(0, 0, 512, 128);
    c.fillStyle = "#17608f"; c.fillRect(0, 0, 44, 128); c.fillStyle = "#b3202a"; c.fillRect(468, 0, 44, 128);
    c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3; c.strokeRect(2, 2, 508, 124);
    for (let i = 0; i <= 10; i++) { const x = 44 + i * 42.4; c.beginPath(); c.moveTo(x, 4); c.lineTo(x, 124); c.stroke(); }
    c.fillStyle = "rgba(255,255,255,.85)"; c.font = "bold 20px system-ui, sans-serif"; c.textAlign = "center";
    ["10", "20", "30", "40", "50", "40", "30", "20", "10"].forEach((n, i) => c.fillText(n, 44 + (i + 1) * 42.4, 112));
  });
}
function courtTex(k: Kit) {
  return k.canvasTex(512, 160, (c) => {
    c.fillStyle = "#c98a4b"; c.fillRect(0, 0, 512, 160);
    c.strokeStyle = "rgba(120,70,30,.35)"; c.lineWidth = 1; for (let y = 10; y < 160; y += 10) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
    c.strokeStyle = "#ffffff"; c.lineWidth = 4; c.strokeRect(4, 4, 504, 152);
    c.beginPath(); c.moveTo(256, 4); c.lineTo(256, 156); c.stroke(); c.beginPath(); c.arc(256, 80, 26, 0, 7); c.stroke();
    [[4, 1], [508, -1]].forEach(([x, s]) => { c.strokeRect(s > 0 ? x : x - 84, 48, 84, 64); c.beginPath(); c.arc(x + s * 20, 80, 62, -Math.PI / 2 * s, Math.PI / 2 * s, s < 0); c.stroke(); });
  });
}
function filmScreen(k: Kit, G: THREE.Group, g: Geo, kind: "nfl" | "nba") {
  // game film on the right wall: the dots move, redrawn a few times a second
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 144;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), k.own(new THREE.MeshBasicMaterial({ map: tex })));
  scr.rotation.y = -Math.PI / 2; scr.position.set(g.w / 2 - 0.09, 0.68, -0.2); G.add(scr);
  const c = cv.getContext("2d")!;
  let last = -1;
  const draw = (t: number) => {
    const f = Math.floor(t * 8); if (f === last) return; last = f;
    c.fillStyle = kind === "nfl" ? "#1f7a3a" : "#c98a4b"; c.fillRect(0, 0, 256, 144);
    c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2;
    if (kind === "nfl") for (let x = 16; x < 256; x += 32) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x, 144); c.stroke(); }
    else { c.strokeRect(6, 24, 244, 114); c.beginPath(); c.arc(128, 81, 22, 0, 7); c.stroke(); }
    const ph = (t * 0.35) % 1;
    for (let i = 0; i < 10; i++) {
      const home = i < 5; const bx = home ? 96 : 150; const by = 40 + (i % 5) * 20;
      const x = bx + (home ? 1 : -1) * ph * 36 + Math.sin(t * 2 + i) * 6, y = by + Math.cos(t * 1.7 + i * 2) * 6;
      c.fillStyle = home ? "#3b82f6" : "#ef4444"; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
    }
    c.fillStyle = kind === "nfl" ? "#8a4b22" : "#ff8a2a"; c.beginPath(); c.arc(100 + ph * 90, 80 - Math.sin(ph * Math.PI) * 34, 4, 0, 7); c.fill();
    c.fillStyle = "rgba(0,0,0,.72)"; c.fillRect(0, 0, 256, 20); c.fillStyle = "#ff4d4d"; c.beginPath(); c.arc(11, 10, 4, 0, 7); c.fill();
    c.fillStyle = "#ffffff"; c.font = "bold 12px system-ui, sans-serif"; c.textBaseline = "middle"; c.fillText("GAME FILM", 20, 11);
    tex.needsUpdate = true;
  };
  draw(0);
  return { scr, draw };
}

function sport(kind: "nfl" | "nba") {
  return (k: Kit, G: THREE.Group, g: Geo): Decor => {
    const nfl = kind === "nfl";
    const fw = Math.min(3.0, g.w - 1.6), fd = nfl ? 0.5 : 0.56, fz = g.d / 2 - 0.4;
    const field = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), k.own(new THREE.MeshStandardMaterial({ map: nfl ? fieldTex(k) : courtTex(k), roughness: 0.85 })));
    field.rotation.x = -Math.PI / 2; field.position.set(0, 0.104, fz); field.receiveShadow = true; G.add(field);
    const A = miniBot(k, k.blobColor(0)), B = miniBot(k, k.blobColor(3));
    const ax = -fw / 2 + (nfl ? 0.5 : 0.75), bx = fw / 2 - (nfl ? 0.5 : 0.75);
    A.g.position.set(ax, 0.1, fz); A.g.rotation.y = Math.PI / 2; B.g.position.set(bx, 0.1, fz); B.g.rotation.y = -Math.PI / 2; G.add(A.g, B.g);
    const ball = nfl ? k.mesh(k.geo.sph, std(k, "#8a4b22"), 0.035, 0.035, 0.06, 0, 0.3, fz) : k.mesh(k.geo.sph, std(k, "#ff8a2a"), 0.045, 0.045, 0.045, 0, 0.3, fz);
    G.add(ball);
    const extra: THREE.Object3D[] = [];
    if (nfl) {
      const post = std(k, "#f5d142");
      [-1, 1].forEach((s) => { const x = s * (fw / 2 + 0.06); G.add(k.mesh(k.geo.cyl, post, 0.012, 0.22, 0.012, x, 0.21, fz), k.mesh(k.geo.box, post, 0.012, 0.012, 0.3, x, 0.32, fz), k.mesh(k.geo.cyl, post, 0.01, 0.2, 0.01, x, 0.42, fz - 0.15), k.mesh(k.geo.cyl, post, 0.01, 0.2, 0.01, x, 0.42, fz + 0.15)); });
    } else {
      [-1, 1].forEach((s) => {
        const x = s * (fw / 2 + 0.02);
        G.add(k.mesh(k.geo.cyl, std(k, "#444444"), 0.015, 0.5, 0.015, x + s * 0.04, 0.35, fz), k.mesh(k.geo.box, std(k, "#f2f4f8"), 0.015, 0.2, 0.28, x, 0.56, fz));
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 20), k.own(new THREE.MeshStandardMaterial({ color: "#ff5a1f" }))); rim.rotation.x = Math.PI / 2; rim.position.set(x - s * 0.075, 0.5, fz); G.add(rim);
      });
    }
    const tr = trophy(k, g.w / 2 - 0.45, -g.d / 2 + 0.45, nfl ? "football" : "basketball"); G.add(tr.g);
    const onWall = jerseys(k, G, g, nfl ? [["#1d4fa3", "#ffffff", "12"], ["#b3202a", "#f5d142", "87"], ["#1f7a3a", "#ffffff", "21"], ["#222222", "#f5c542", "9"]] : [["#6a2fb8", "#f5d142", "23"], ["#d7263d", "#ffffff", "30"], ["#1d6fd1", "#ffffff", "7"], ["#111111", "#ff8a2a", "0"]], !nfl);
    const film = filmScreen(k, G, g, kind); onWall.push(film.scr);
    return { onWall: onWall.concat(extra), update: (t) => {
      film.draw(t);
      tr.top.rotation.y = t * 0.8;
      const per = nfl ? 2.6 : 2.2; const ph = (t % (2 * per)) / per; const dir = ph < 1 ? 1 : -1; const u = ph < 1 ? ph : ph - 1;   // A -> B, then B -> A
      const fly = Math.min(1, u / 0.72);                                                                                          // ball in the air, then held
      const x0 = dir > 0 ? ax : bx, x1 = dir > 0 ? bx : ax;
      const bxp = x0 + (x1 - x0) * fly;
      if (nfl) { ball.position.set(bxp, 0.26 + Math.sin(fly * Math.PI) * 0.5, fz); ball.rotation.set(0, Math.PI / 2, t * 14); }
      else { const bounce = Math.abs(Math.sin(fly * Math.PI * 2)); ball.position.set(bxp, 0.15 + bounce * 0.22, fz); ball.rotation.z = -t * 8 * dir; }
      const thrower = dir > 0 ? A : B, catcher = dir > 0 ? B : A;
      thrower.g.position.y = 0.1 + (u < 0.12 ? Math.sin((u / 0.12) * Math.PI) * 0.07 : 0);
      catcher.g.position.y = 0.1 + (u > 0.68 && u < 0.86 ? Math.sin(((u - 0.68) / 0.18) * Math.PI) * 0.08 : 0);
      A.body.scale.y = 0.1 * (1 + 0.04 * Math.sin(t * 3)); B.body.scale.y = 0.1 * (1 + 0.04 * Math.sin(t * 3 + 1));
    } };
  };
}

const BUILDERS: Record<RoomTheme, (k: Kit, G: THREE.Group, g: Geo) => Decor> = { money, travel, nfl: sport("nfl"), nba: sport("nba") };
export function buildDecor(theme: RoomTheme, k: Kit, G: THREE.Group, g: Geo): Decor { return BUILDERS[theme](k, G, g); }
