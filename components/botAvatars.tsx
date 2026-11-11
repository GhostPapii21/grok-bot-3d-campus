// Cute, stylized, low-poly bot characters. Shared by the campus and room interiors.
"use client";
import * as THREE from "three";

export type BotKey =
  | "ghost6"
  | "travel"
  | "blitz"
  | "betguru"
  | "money"
  | "apextitan"
  | "einstein"
  | "dropout"
  | "topshotta";

export type AvatarAnim = "idle" | "walk" | "watch" | "work";

export type BotAvatar = {
  key: BotKey;
  name: string;
  group: THREE.Group;
  tick: (t: number, anim: AvatarAnim, moving?: boolean) => void;
  setBubble: (text: string | null) => void;
  dispose: () => void;
};

export const BOT_META: Record<BotKey, { name: string; color: string; accent: string }> = {
  ghost6: { name: "Ghost6", color: "#f4e7b0", accent: "#d4af37" },
  travel: { name: "Travel Agent", color: "#3db8c8", accent: "#f4d35e" },
  blitz: { name: "Blitz", color: "#1e3a2a", accent: "#f0c14a" },
  betguru: { name: "BetGuru", color: "#d35400", accent: "#0e1a33" },
  money: { name: "Money Maker Bot", color: "#1f6b3a", accent: "#d4af37" },
  apextitan: { name: "ApexTitan", color: "#1a1a1a", accent: "#e10600" },
  einstein: { name: "Einstein", color: "#f4f0e6", accent: "#3a3a3a" },
  dropout: { name: "College DropOut", color: "#6b1d2a", accent: "#d4af37" },
  topshotta: { name: "TopShotta", color: "#1a2a4a", accent: "#f4f0e6" },
};

export function botKeyFromName(name: string): BotKey | null {
  const n = name.toLowerCase();
  if (n.startsWith("ghost6")) return "ghost6";
  if (n.startsWith("travel")) return "travel";
  if (n.startsWith("blitz")) return "blitz";
  if (n.startsWith("betguru")) return "betguru";
  if (n.startsWith("money")) return "money";
  if (n.startsWith("apextitan")) return "apextitan";
  if (n.startsWith("einstein")) return "einstein";
  if (n.startsWith("college dropout")) return "dropout";
  if (n.startsWith("topshotta")) return "topshotta";
  return null;
}

const sph = new THREE.SphereGeometry(1, 10, 8);
const sphLo = new THREE.SphereGeometry(1, 8, 6);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 8);
const cone = new THREE.ConeGeometry(1, 1, 8);
const box = new THREE.BoxGeometry(1, 1, 1);
const cap = new THREE.CapsuleGeometry(0.16, 0.28, 4, 8);

function M(color: string, opts: { rough?: number; metal?: number; flat?: boolean } = {}) {
  if (opts.flat) return new THREE.MeshBasicMaterial({ color });
  return new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.55, metalness: opts.metal ?? 0.05 });
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

function nameSprite(label: string) {
  const tex = canvasTex(256, 64, (c) => {
    c.clearRect(0, 0, 256, 64);
    c.fillStyle = "rgba(20,20,20,0.78)";
    const w = Math.min(248, 20 + c.measureText(label).width * 2.2);
    // simple pill
    c.beginPath();
    c.roundRect(8, 14, 240, 36, 12);
    c.fill();
    c.fillStyle = "#fff";
    c.font = "700 22px system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, 128, 33, 220);
  });
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.9, 0.22, 1);
  s.position.y = 1.28;
  return s;
}

function bubbleSprite() {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 192;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(1.7, 0.64, 1);
  s.position.set(0, 1.62, 0);
  s.visible = false;
  const draw = (text: string | null) => {
    const c = cv.getContext("2d")!;
    c.clearRect(0, 0, 512, 192);
    if (!text) {
      s.visible = false;
      tex.needsUpdate = true;
      return;
    }
    s.visible = true;
    c.fillStyle = "rgba(255,255,255,0.95)";
    c.strokeStyle = "#222";
    c.lineWidth = 4;
    c.beginPath();
    c.roundRect(12, 8, 488, 140, 18);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(230, 148);
    c.lineTo(256, 180);
    c.lineTo(282, 148);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#1a1a1a";
    c.font = "700 28px system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (c.measureText(t).width > 450 && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    const show = lines.slice(0, 3);
    show.forEach((l, i) => c.fillText(l, 256, 40 + i * 36 + (3 - show.length) * 12, 450));
    tex.needsUpdate = true;
  };
  return { sprite: s, draw, tex, mat };
}

function dress(key: BotKey, head: THREE.Group, body: THREE.Group, mats: { skin: THREE.Material; accent: THREE.Material; dark: THREE.Material; white: THREE.Material }) {
  const { skin, accent, dark, white } = mats;
  if (key === "ghost6") {
    // gold visor + headset
    add(head, box, accent, 0.22, 0.05, 0.16, 0, 0.06, 0.1);
    add(head, cyl, dark, 0.02, 0.08, 0.02, 0.16, 0.02, 0);
    add(head, sphLo, accent, 0.04, 0.04, 0.04, 0.16, -0.04, 0.04);
    // tiny clipboard in the right-hand slot later
  } else if (key === "travel") {
    const hat = add(head, cyl, accent, 0.2, 0.06, 0.2, 0, 0.16, 0);
    add(head, cyl, accent, 0.28, 0.02, 0.28, 0, 0.13, 0);
    void hat;
  } else if (key === "blitz") {
    add(head, sph, M("#2a4a32"), 0.2, 0.14, 0.22, 0, 0.1, 0.02);
    add(head, box, accent, 0.22, 0.03, 0.08, 0, 0.04, 0.16);
  } else if (key === "betguru") {
    add(head, box, dark, 0.22, 0.04, 0.18, 0, 0.14, 0.02);
    add(head, box, dark, 0.22, 0.08, 0.04, 0, 0.1, 0.1);
  } else if (key === "money") {
    add(head, cyl, dark, 0.16, 0.08, 0.16, 0, 0.18, 0);
    add(head, cyl, dark, 0.24, 0.02, 0.24, 0, 0.14, 0);
    add(body, box, accent, 0.22, 0.06, 0.02, 0, 0.12, 0.15); // $ sash bar
  } else if (key === "apextitan") {
    add(head, box, M("#e10600"), 0.2, 0.04, 0.04, 0, 0.08, 0.12);
  } else if (key === "einstein") {
    // messy hair tufts + glasses
    add(head, sphLo, dark, 0.14, 0.1, 0.14, -0.06, 0.18, -0.02);
    add(head, sphLo, dark, 0.12, 0.12, 0.12, 0.07, 0.2, 0);
    add(head, sphLo, dark, 0.08, 0.1, 0.08, 0, 0.22, 0.06);
    const gL = add(head, cyl, dark, 0.06, 0.01, 0.06, -0.06, 0.02, 0.13, [Math.PI / 2, 0, 0]);
    const gR = add(head, cyl, dark, 0.06, 0.01, 0.06, 0.06, 0.02, 0.13, [Math.PI / 2, 0, 0]);
    add(head, box, dark, 0.05, 0.01, 0.01, 0, 0.02, 0.13);
    void gL; void gR;
  } else if (key === "dropout") {
    add(head, cyl, accent, 0.18, 0.06, 0.18, 0, 0.16, 0);
    add(head, box, accent, 0.08, 0.02, 0.1, 0, 0.15, 0.14);
  } else if (key === "topshotta") {
    add(head, cyl, white, 0.18, 0.06, 0.18, 0, 0.16, 0);
    add(head, box, white, 0.08, 0.02, 0.12, 0, 0.15, 0.14);
    add(head, box, M("#c62828"), 0.18, 0.02, 0.18, 0, 0.19, 0);
  }
}

function heldProp(key: BotKey, rightHand: THREE.Group) {
  if (key === "ghost6") {
    add(rightHand, box, M("#f4f0e6"), 0.1, 0.14, 0.02, 0.05, 0, 0.08);
    add(rightHand, box, M("#d4af37"), 0.02, 0.14, 0.02, 0, 0, 0.08);
  } else if (key === "travel") {
    add(rightHand, box, M("#6a4320"), 0.1, 0.08, 0.14, 0.06, -0.02, 0.08);
    add(rightHand, box, M("#d4af37"), 0.12, 0.02, 0.04, 0.06, 0.03, 0.08);
  } else if (key === "blitz" || key === "dropout") {
    const ball = add(rightHand, sphLo, M("#6b3a1f"), 0.07, 0.05, 0.07, 0.06, 0, 0.1);
    add(ball, box, M("#f4f0e6"), 0.9, 0.08, 0.15, 0, 0, 0);
  } else if (key === "betguru") {
    add(rightHand, sphLo, M("#d35400"), 0.07, 0.07, 0.07, 0.06, 0, 0.1);
  } else if (key === "money") {
    add(rightHand, cyl, M("#d4af37", { metal: 0.7, rough: 0.3 }), 0.05, 0.02, 0.05, 0.05, 0, 0.1);
  } else if (key === "apextitan") {
    add(rightHand, cyl, M("#2a2a2a"), 0.03, 0.16, 0.03, 0.06, 0, 0.1, [0, 0, Math.PI / 2]);
    add(rightHand, sphLo, M("#2a2a2a"), 0.05, 0.05, 0.05, 0.14, 0, 0.1);
    add(rightHand, sphLo, M("#2a2a2a"), 0.05, 0.05, 0.05, -0.02, 0, 0.1);
  } else if (key === "einstein") {
    add(rightHand, box, M("#222"), 0.1, 0.07, 0.02, 0.05, 0, 0.08); // tiny notebook
  } else if (key === "topshotta") {
    add(rightHand, cyl, M("#8a5230"), 0.015, 0.22, 0.015, 0.05, 0.02, 0.12, [0, 0, 0.6]);
  }
}

export function makeBotAvatar(key: BotKey, opts?: { scale?: number; showName?: boolean }): BotAvatar {
  const meta = BOT_META[key];
  const scale = opts?.scale ?? 1;
  const group = new THREE.Group();
  group.scale.setScalar(scale);
  const skin = M(meta.color);
  const accent = M(meta.accent, { metal: key === "ghost6" || key === "money" ? 0.55 : 0.1, rough: 0.4 });
  const dark = M("#222226");
  const white = M("#f4f0e6");
  const mats = { skin, accent, dark, white };

  const body = new THREE.Group();
  body.position.y = 0.42;
  group.add(body);
  const torso = new THREE.Mesh(cap, skin);
  torso.position.y = 0;
  body.add(torso);

  const head = new THREE.Group();
  head.position.y = 0.42;
  body.add(head);
  add(head, sph, skin, 0.2, 0.2, 0.2, 0, 0, 0);
  // eyes
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.02, 0.15);
  head.add(eyes);
  const mkEye = (x: number) => {
    const e = new THREE.Group();
    e.position.x = x;
    add(e, sphLo, white, 0.045, 0.055, 0.03, 0, 0, 0);
    const pupil = add(e, sphLo, dark, 0.02, 0.025, 0.016, 0, 0, 0.018);
    e.userData.pupil = pupil;
    eyes.add(e);
    return e;
  };
  const eL = mkEye(-0.07);
  const eR = mkEye(0.07);
  dress(key, head, body, mats);

  const armL = new THREE.Group();
  armL.position.set(-0.2, 0.14, 0);
  body.add(armL);
  add(armL, cyl, skin, 0.05, 0.22, 0.05, 0, -0.1, 0);
  const handL = add(armL, sphLo, skin, 0.055, 0.055, 0.055, 0, -0.22, 0);
  const armR = new THREE.Group();
  armR.position.set(0.2, 0.14, 0);
  body.add(armR);
  add(armR, cyl, skin, 0.05, 0.22, 0.05, 0, -0.1, 0);
  const handR = new THREE.Group();
  handR.position.set(0, -0.22, 0);
  armR.add(handR);
  add(handR, sphLo, skin, 0.055, 0.055, 0.055, 0, 0, 0);
  heldProp(key, handR);

  const legL = new THREE.Group();
  legL.position.set(-0.09, 0.2, 0);
  group.add(legL);
  add(legL, cyl, skin, 0.055, 0.22, 0.055, 0, 0.0, 0);
  add(legL, sphLo, skin, 0.06, 0.04, 0.08, 0, -0.12, 0.02);
  const legR = new THREE.Group();
  legR.position.set(0.09, 0.2, 0);
  group.add(legR);
  add(legR, cyl, skin, 0.055, 0.22, 0.055, 0, 0.0, 0);
  add(legR, sphLo, skin, 0.06, 0.04, 0.08, 0, -0.12, 0.02);

  const name = nameSprite(meta.name);
  if (opts?.showName === false) name.visible = false;
  group.add(name);

  const bubble = bubbleSprite();
  group.add(bubble.sprite);

  const seed = key.length * 1.7;
  const tick = (t: number, anim: AvatarAnim, moving = anim === "walk") => {
    const blink = ((t + seed) % 4.2) < 0.1;
    eL.scale.y = eR.scale.y = blink ? 0.15 : 1;
    const br = 1 + 0.03 * Math.sin(t * 2.1 + seed);
    body.scale.set(1 / Math.sqrt(br), br, 1 / Math.sqrt(br));
    if (anim === "walk" && moving) {
      const sw = Math.sin(t * 9);
      armL.rotation.x = sw * 0.7;
      armR.rotation.x = -sw * 0.7;
      legL.rotation.x = -sw * 0.7;
      legR.rotation.x = sw * 0.7;
      body.position.y = 0.42 + Math.abs(sw) * 0.03;
    } else if (anim === "watch") {
      armL.rotation.x = -0.15;
      armR.rotation.x = -0.1;
      legL.rotation.x = 0;
      legR.rotation.x = 0;
      head.rotation.x = -0.15 + Math.sin(t * 0.6) * 0.04;
      body.position.y = 0.42;
    } else if (anim === "work") {
      armL.rotation.x = -0.8 + Math.sin(t * 10) * 0.15;
      armR.rotation.x = -0.8 + Math.sin(t * 10 + 1) * 0.15;
      head.rotation.x = 0.2;
      body.position.y = 0.42 + Math.abs(Math.sin(t * 8)) * 0.01;
      legL.rotation.x = 0;
      legR.rotation.x = 0;
    } else {
      armL.rotation.x = Math.sin(t * 1.2 + seed) * 0.08;
      armR.rotation.x = -Math.sin(t * 1.2 + seed) * 0.08;
      legL.rotation.x = 0;
      legR.rotation.x = 0;
      head.rotation.x = 0;
      body.position.y = 0.42 + Math.sin(t * 1.6 + seed) * 0.015;
    }
  };

  const dispose = () => {
    bubble.tex.dispose();
    bubble.mat.dispose();
    (name.material as THREE.SpriteMaterial).map?.dispose();
    (name.material as THREE.SpriteMaterial).dispose();
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      const matsArr = Array.isArray(mat) ? mat : mat ? [mat] : [];
      matsArr.forEach((mm) => {
        if (mm !== undefined && (mm as any).userData?.own) mm.dispose();
      });
    });
  };

  return {
    key,
    name: meta.name,
    group,
    tick,
    setBubble: (text) => bubble.draw(text),
    dispose,
  };
}

/** Generic miniature player (for the NFL catch game), not a named campus bot. */
export function makeMiniPlayer(color: string, scale = 0.45) {
  const av = makeBotAvatar("blitz", { scale, showName: false });
  // recolor torso-ish by overlaying a simple tint on the group userData
  av.group.traverse((o) => {
    const m = o as THREE.Mesh;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (mat && mat.color && mat.type === "MeshStandardMaterial") {
      // leave as-is; scale already makes them mini
    }
  });
  void color;
  return av;
}
