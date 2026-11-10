"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bots, botsByRoomId, type CampusBot } from "../lib/bots";
import { makeBoardTexture, type BoardStyle } from "../lib/boardDraw";
import { boardsForRoom, useCampusStatus, type BotBoard } from "../lib/status";
import { useGrokTheme } from "../lib/theme";
import { BotBoardView, ChatButton } from "./ChatAndStatus";

type TeamLike = { id: string; name: string; lead?: { name: string } };

export default function RoomInterior3D(props: {
  team: TeamLike;
  phone: boolean;
  prevName: string;
  nextName: string;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onFail?: () => void;
}) {
  const th = useGrokTheme();
  const host = useRef<HTMLDivElement>(null);
  const file = useCampusStatus();
  const [readBoard, setReadBoard] = useState(false);
  const [ready, setReady] = useState(false);
  const openBoardRef = useRef<() => void>(() => {});
  openBoardRef.current = () => setReadBoard(true);
  const { team, phone } = props;

  const boards = boardsForRoom(file, team.id, team.lead?.name);
  const owner: CampusBot | undefined = botsByRoomId[team.id] || bots.find((b) => b.roomId === team.id);
  const einstein = team.id === "hq" ? bots.find((b) => b.name === "Einstein") : undefined;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    const disposables: Array<{ dispose?: () => void }> = [];
    const own = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o);
      return o;
    };

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
      renderer = new THREE.WebGLRenderer({ antialias: !phone, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      el.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = team.id === "travel" ? 3 : 1.6;
      controls.maxDistance = team.id === "travel" ? 16 : 9;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI / 2 - 0.08;
      if (team.id === "travel") {
        controls.target.set(0.2, 1.5, -2);
        camera.position.set(0.3, 2.35, 9.0);
      } else if (team.id === "money") {
        controls.target.set(0, 1.4, -1.2);
        camera.position.set(1.6, 2.0, 6.2);
      } else if (team.id === "hq") {
        controls.target.set(0.15, 2.0, -5.8);
        camera.position.set(0.15, 2.05, -0.4);
      } else {
        // Face the back-wall board so its text is readable at the default view.
        controls.target.set(0, 2.05, -5.8);
        camera.position.set(0, 2.05, -1.5);
      }
      controls.update();

      const hemi = new THREE.HemisphereLight(0xf2f0ff, 0x3a3028, team.id === "travel" ? 1.15 : 0.7);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight(0xfff4e0, team.id === "travel" ? 0.7 : 0.85);
      dir.position.set(4, 8, 6);
      scene.add(dir);

      const clock = new THREE.Clock();
      const ticks: Array<(t: number, dt: number) => void> = [];

      buildRoom(scene, team.id, phone, boards, own, ticks);
      if (dead) return;

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer!.setSize(w, h, false);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const raycaster = new THREE.Raycaster();
      const ptr = new THREE.Vector2();
      let down: { x: number; y: number } | null = null;
      const canvas = renderer.domElement;
      const hitBoard = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ptr, camera);
        const hits = raycaster.intersectObjects(scene.children, true);
        return hits.some((h) => {
          let o: THREE.Object3D | null = h.object;
          while (o) {
            if (o.userData.boardClick) return true;
            o = o.parent;
          }
          return false;
        });
      };
      const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
      const onMove = (e: PointerEvent) => { canvas.style.cursor = hitBoard(e) ? "pointer" : ""; };
      const onUp = (e: PointerEvent) => {
        if (!down) return;
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        down = null;
        if (dx * dx + dy * dy > 36) return;
        if (hitBoard(e)) openBoardRef.current();
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointermove", onMove);

      const loop = () => {
        if (dead) return;
        raf = requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        const dt = clock.getDelta();
        ticks.forEach((fn) => fn(t, dt));
        controls.update();
        renderer!.render(scene, camera);
      };
      loop();
      setReady(true);

      return () => {
        dead = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointermove", onMove);
        controls.dispose();
        disposables.forEach((d) => d.dispose?.());
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry && (m.geometry as any).userData?.own) m.geometry.dispose();
          const mat = m.material as THREE.Material | THREE.Material[] | undefined;
          const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
          mats.forEach((mm) => {
            const map = (mm as THREE.MeshBasicMaterial).map;
            if (map) map.dispose();
            mm.dispose();
          });
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      if (!dead) props.onFail?.();
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id, phone, file]);

  const navBtn: CSSProperties = {
    font: "inherit",
    fontSize: phone ? 13 : 14,
    fontWeight: 700,
    padding: phone ? "8px 10px" : "8px 14px",
    borderRadius: 999,
    border: `1px solid ${th.border.subtle}`,
    background: th.fill.secondary,
    color: th.text.primary,
    cursor: "pointer",
    whiteSpace: "nowrap",
    maxWidth: phone ? 130 : 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#111", zIndex: 8 }}>
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      {!ready && <div style={{ position: "absolute", inset: 0, background: "#141414" }} />}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 10,
          padding: phone ? "10px 12px 8px" : "12px 16px 10px",
          background: "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.18) 70%, transparent)",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto", color: "#fff", minWidth: 0, flex: "1 1 180px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, opacity: 0.8 }}>INSIDE</div>
          <b style={{ fontSize: phone ? 18 : 22, display: "block", textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>{team.name}</b>
        </div>
        <div style={{ pointerEvents: "auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          {owner ? <ChatButton bot={owner} large={!phone} /> : null}
          {einstein ? <ChatButton bot={einstein} /> : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: phone ? "10px 10px 14px" : "12px 16px 16px",
          background: "linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.15) 80%, transparent)",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto", display: "flex", gap: 8, flexWrap: "wrap", width: "100%", alignItems: "center" }}>
          <button onClick={props.onExit} title="Exit to campus (Esc)" style={navBtn}>
            Exit to campus
          </button>
          <button onClick={props.onPrev} title="Previous room" style={navBtn}>
            ← {props.prevName}
          </button>
          <button onClick={props.onNext} title="Next room" style={{ ...navBtn, marginInlineEnd: "auto" }}>
            {props.nextName} →
          </button>
          {!readBoard && (
            <div style={{ color: "#fff", fontSize: phone ? 12 : 13, opacity: 0.85, marginInlineEnd: 8 }}>Tap a board to read it</div>
          )}
          <button
            onClick={() => setReadBoard((v) => !v)}
            style={{
              ...navBtn,
              background: readBoard ? th.fill.accent : th.fill.secondary,
              color: readBoard ? th.text.onColor : th.text.primary,
              border: "none",
            }}
          >
            {readBoard ? "Hide board" : "Read board"}
          </button>
        </div>
      </div>

      {readBoard && (
        <div
          style={{
            position: "absolute",
            top: phone ? 88 : 96,
            right: phone ? 10 : 18,
            left: phone ? 10 : "auto",
            width: phone ? "auto" : 420,
            bottom: phone ? 70 : 70,
            zIndex: 3,
            overflowY: "auto",
            padding: 8,
            borderRadius: 14,
            background: "rgba(20,20,20,0.88)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 12px 40px rgba(0,0,0,.45)",
          }}
        >
          {boards.length ? boards.map((b) => <BotBoardView key={b.id || b.bot} board={b} />) : <div style={{ color: "#ddd", padding: 12 }}>No board posted yet.</div>}
        </div>
      )}
    </div>
  );
}

function mat(color: string, opts: { rough?: number; metal?: number; flat?: boolean } = {}) {
  if (opts.flat) return new THREE.MeshBasicMaterial({ color });
  return new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.7, metalness: opts.metal ?? 0.05 });
}

function addBox(parent: THREE.Object3D, m: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
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

function boardMesh(board: BotBoard, style: BoardStyle, w: number, h: number) {
  const cv = makeBoardTexture(board, style);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const frame = new THREE.Group();
  const wood = mat(style === "monitor" ? "#1a1a1a" : "#6a4a28", { rough: 0.8, metal: 0.05 });
  addBox(frame, wood, w + 0.08, h + 0.08, 0.06, 0, 0, -0.02);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.z = 0.015;
  frame.add(face);
  frame.userData.boardClick = true;
  face.userData.boardClick = true;
  return frame;
}

function destBoardTex() {
  return canvasTex(512, 384, (c) => {
    c.fillStyle = "#2a3a28";
    c.fillRect(0, 0, 512, 384);
    c.strokeStyle = "#c4a574";
    c.lineWidth = 14;
    c.strokeRect(8, 8, 496, 368);
    c.fillStyle = "#f0ead0";
    c.font = "700 28px Georgia, serif";
    c.fillText("Destinations", 36, 58);
    c.font = "24px Georgia, serif";
    ;["Japan", "Italy", "Mexico", "Jamaica", "Greece", "France"].forEach((n, i) => {
      c.fillText(`•  ${n}`, 48, 110 + i * 40);
    });
  });
}

function buildRoom(
  scene: THREE.Scene,
  id: string,
  phone: boolean,
  boards: BotBoard[],
  own: <T extends { dispose: () => void }>(o: T) => T,
  ticks: Array<(t: number, dt: number) => void>,
) {
  const style: BoardStyle = id === "money" || id === "hq" ? "monitor" : "whiteboard";

  if (id === "travel") {
    buildTravel(scene, phone, boards, style, own, ticks);
    return;
  }
  if (id === "money") {
    buildMoney(scene, phone, boards, style, own, ticks);
    return;
  }

  // enclosed rooms: hq, nba, nfl, shop
  const pal =
    id === "hq"
      ? { wall: "#1a1610", floor: "#2a2418", ceil: "#120f0c", trim: "#d4af37" }
      : id === "nba"
        ? { wall: "#3a2a1c", floor: "#b87333", ceil: "#2a2218", trim: "#f4f0e6" }
        : id === "nfl"
          ? { wall: "#1c3a22", floor: "#2d7a32", ceil: "#142018", trim: "#f0c14a" }
          : { wall: "#222226", floor: "#161618", ceil: "#1a1a1c", trim: "#e10600" };

  scene.background = new THREE.Color(pal.wall);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 12), mat(pal.floor, { rough: 0.9 }));
  floor.position.y = -0.06;
  scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(14, 0.08, 12), mat(pal.ceil, { rough: 0.9 }));
  ceil.position.y = 4.2;
  scene.add(ceil);
  const back = new THREE.Mesh(new THREE.BoxGeometry(14, 4.3, 0.12), mat(pal.wall, { rough: 0.85 }));
  back.position.set(0, 2.15, -5.94);
  scene.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.3, 12), mat(pal.wall, { rough: 0.85 }));
  left.position.set(-6.94, 2.15, 0);
  scene.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.3, 12), mat(pal.wall, { rough: 0.85 }));
  right.position.set(6.94, 2.15, 0);
  scene.add(right);
  // trim rail
  addBox(scene, mat(pal.trim, { metal: 0.4, rough: 0.4 }), 14, 0.06, 0.06, 0, 3.4, -5.86);

  if (id === "hq") {
    // command desk
    addBox(scene, mat("#1c1a16", { rough: 0.7 }), 3.2, 0.08, 1.1, 0, 0.86, 1.6);
    addBox(scene, mat("#3a3428"), 0.1, 0.82, 1.05, -1.5, 0.41, 1.6);
    addBox(scene, mat("#3a3428"), 0.1, 0.82, 1.05, 1.5, 0.41, 1.6);
    const lamp = new THREE.PointLight(0xffd27a, phone ? 0.4 : 0.9, 8);
    lamp.position.set(0, 1.6, 1.5);
    scene.add(lamp);
  }
  if (id === "nba") {
    const court = canvasTex(512, 320, (c) => {
      c.fillStyle = "#c68642";
      c.fillRect(0, 0, 512, 320);
      for (let i = 0; i < 16; i++) {
        c.fillStyle = i % 2 ? "#b87333" : "#c68642";
        c.fillRect((i * 512) / 16, 0, 512 / 16, 320);
      }
      c.strokeStyle = "#f4f0e6";
      c.lineWidth = 6;
      c.strokeRect(20, 16, 472, 288);
      c.beginPath();
      c.arc(256, 160, 48, 0, Math.PI * 2);
      c.stroke();
    });
    const plank = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: court, roughness: 0.85 }));
    plank.rotation.x = -Math.PI / 2;
    plank.position.y = 0.01;
    scene.add(plank);
  }
  if (id === "nfl") {
    const turf = canvasTex(512, 320, (c) => {
      c.fillStyle = "#2d7a32";
      c.fillRect(0, 0, 512, 320);
      c.strokeStyle = "#f4f0e6";
      c.lineWidth = 4;
      for (let i = 1; i < 10; i++) {
        c.beginPath();
        c.moveTo((i * 512) / 10, 16);
        c.lineTo((i * 512) / 10, 304);
        c.stroke();
      }
    });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: turf, roughness: 0.95 }));
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0.01;
    scene.add(field);
  }

  placeBoards(scene, boards, style, id);
}

function placeBoards(scene: THREE.Scene, boards: BotBoard[], style: BoardStyle, id: string) {
  if (!boards.length) return;
  if (id === "hq" && boards.length >= 2) {
    const a = boardMesh(boards[0], style, 2.7, 3.5);
    a.position.set(-1.7, 2.05, -5.8);
    scene.add(a);
    const b = boardMesh(boards[1], style, 2.5, 3.5);
    b.position.set(2.0, 2.05, -5.8);
    scene.add(b);
    return;
  }
  if (id === "money") {
    const a = boardMesh(boards[0], style, 2.4, 3.2);
    a.rotation.y = -Math.PI / 2;
    a.position.set(5.4, 2.0, 0.2);
    scene.add(a);
    return;
  }
  if (id === "travel") {
    const a = boardMesh(boards[0], "whiteboard", 2.3, 3.0);
    a.position.set(-3.5, 1.75, 1.8);
    a.rotation.y = 0.28;
    scene.add(a);
    return;
  }
  const a = boardMesh(boards[0], style, 3.5, 3.9);
  a.position.set(0, 2.15, -5.8);
  scene.add(a);
}

function buildMoney(
  scene: THREE.Scene,
  phone: boolean,
  boards: BotBoard[],
  style: BoardStyle,
  own: <T extends { dispose: () => void }>(o: T) => T,
  ticks: Array<(t: number, dt: number) => void>,
) {
  scene.background = new THREE.Color("#1a1612");
  const marble = canvasTex(512, 512, (c) => {
    c.fillStyle = "#d8d2c6";
    c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "rgba(80,70,60,0.18)";
    for (let i = 0; i < 18; i++) {
      c.beginPath();
      c.moveTo(Math.random() * 512, Math.random() * 512);
      c.bezierCurveTo(Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512);
      c.stroke();
    }
  });
  marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
  marble.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 14), new THREE.MeshStandardMaterial({ map: marble, roughness: 0.35, metalness: 0.1 }));
  floor.position.y = -0.06;
  scene.add(floor);
  const wallM = mat("#3a3228", { rough: 0.8 });
  addBox(scene, wallM, 16, 4.6, 0.16, 0, 2.3, -6.9);
  addBox(scene, wallM, 0.16, 4.6, 14, -7.92, 2.3, 0);
  addBox(scene, wallM, 0.16, 4.6, 14, 7.92, 2.3, 0);
  addBox(scene, mat("#2a241c"), 16, 0.1, 14, 0, 4.55, 0);
  addBox(scene, mat("#c9a227", { metal: 0.65, rough: 0.35 }), 16, 0.05, 0.05, 0, 3.6, -6.8);

  // vault recess on the back wall
  addBox(scene, mat("#1a1614"), 4.4, 4.2, 1.2, -2.4, 2.05, -6.2);
  const vault = makeVaultDoor();
  vault.position.set(-2.4, 1.7, -5.45);
  vault.rotation.y = 0.55;
  scene.add(vault);
  if (!phone) {
    const glow = new THREE.PointLight(0xffd27a, 1.1, 7);
    glow.position.set(-2.2, 1.8, -5.0);
    scene.add(glow);
  }

  // teller counter
  const wood = mat("#4a3020", { rough: 0.75 });
  const stone = mat("#cfc6b6", { rough: 0.45, metal: 0.05 });
  addBox(scene, wood, 5.4, 1.05, 0.9, 1.6, 0.52, 1.7);
  addBox(scene, stone, 5.5, 0.08, 1.05, 1.6, 1.08, 1.7);
  addBox(scene, mat("#1a1a1a", { rough: 0.4, metal: 0.3 }), 1.2, 0.7, 0.06, 1.6, 1.5, 1.28);

  addCashStacks(scene, 0.4, 1.16, 1.5);
  addCashStacks(scene, 2.4, 1.16, 1.55);
  addGoldBars(scene, -0.6, 1.16, 1.45);
  addMoneyBag(scene, -3.6, 0, 1.8);
  addMoneyBag(scene, -3.0, 0, 2.4);
  addMoneyBag(scene, 3.6, 0, 2.0);
  addGoldBars(scene, -4.2, 0.06, -2.2);

  placeBoards(scene, boards, style, "money");
  addBills(scene, phone, ticks);
}

function makeVaultDoor() {
  const g = new THREE.Group();
  const steel = mat("#6a6e72", { metal: 0.85, rough: 0.3 });
  const dark = mat("#2a2c2e", { metal: 0.7, rough: 0.35 });
  const gold = mat("#d4af37", { metal: 0.8, rough: 0.3 });
  const door = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.22, 48), steel);
  door.rotation.x = Math.PI / 2;
  g.add(door);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.08, 10, 40), gold);
  g.add(rim);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 24), dark);
  wheel.position.z = 0.16;
  g.add(wheel);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.05), dark);
    spoke.position.set(Math.cos(a) * 0.0, Math.sin(a) * 0.0, 0.16);
    spoke.rotation.z = a;
    g.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), gold);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.2;
  g.add(hub);
  return g;
}

function addCashStacks(scene: THREE.Scene, x: number, y: number, z: number) {
  const green = mat("#1f6b3a", { rough: 0.7 });
  const band = mat("#d4af37", { rough: 0.5, metal: 0.3 });
  for (let i = 0; i < 3; i++) {
    addBox(scene, green, 0.34, 0.16, 0.16, x + i * 0.28, y + 0.08, z);
    addBox(scene, band, 0.36, 0.03, 0.17, x + i * 0.28, y + 0.08, z);
  }
}

function addGoldBars(scene: THREE.Scene, x: number, y: number, z: number) {
  const gold = mat("#d4af37", { metal: 0.85, rough: 0.25 });
  addBox(scene, gold, 0.38, 0.1, 0.16, x, y + 0.05, z);
  addBox(scene, gold, 0.38, 0.1, 0.16, x + 0.2, y + 0.05, z + 0.14);
  addBox(scene, gold, 0.38, 0.1, 0.16, x + 0.1, y + 0.15, z + 0.06);
}

function addMoneyBag(scene: THREE.Scene, x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const cloth = mat("#3d6b2e", { rough: 0.85 });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), cloth);
  bag.scale.set(1, 1.15, 1);
  bag.position.y = 0.3;
  g.add(bag);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.14, 10), cloth);
  neck.position.y = 0.6;
  g.add(neck);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), mat("#d4af37", { metal: 0.5, rough: 0.4 }));
  tie.rotation.x = Math.PI / 2;
  tie.position.y = 0.56;
  g.add(tie);
  const mark = canvasTex(128, 128, (c) => {
    c.fillStyle = "rgba(0,0,0,0)";
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = "#f4e7b0";
    c.font = "700 90px Georgia, serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("$", 64, 70);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: mark, transparent: true }));
  sign.position.set(0, 0.32, 0.29);
  g.add(sign);
  scene.add(g);
}

function addBills(scene: THREE.Scene, phone: boolean, ticks: Array<(t: number, dt: number) => void>) {
  const count = phone ? 28 : 80;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const billTex = canvasTex(64, 32, (c) => {
    c.fillStyle = "#2e8a4a";
    c.fillRect(0, 0, 64, 32);
    c.strokeStyle = "#0e3a1c";
    c.strokeRect(2, 2, 60, 28);
    c.fillStyle = "#e8f5e4";
    c.font = "700 16px Georgia, serif";
    c.textAlign = "center";
    c.fillText("$", 32, 22);
  });
  const m = new THREE.MeshStandardMaterial({ map: billTex, roughness: 0.7, metalness: 0.05 });
  const inst = new THREE.InstancedMesh(geo, m, count);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(inst);
  const dummy = new THREE.Object3D();
  const data = Array.from({ length: count }, () => ({
    ox: -2.5 + Math.random() * 0.7,
    oz: -5.1 + Math.random() * 0.5,
    phase: Math.random(),
    speed: 0.18 + Math.random() * 0.22,
    sway: 0.4 + Math.random() * 0.7,
    spin: 1.5 + Math.random() * 3,
    tilt: Math.random() * Math.PI,
  }));
  ticks.push((t) => {
    for (let i = 0; i < count; i++) {
      const d = data[i];
      const cycle = (t * d.speed + d.phase) % 1;
      const ease = cycle;
      dummy.position.set(
        d.ox + ease * 3.4 + Math.sin(t * 1.3 + d.phase * 8) * 0.15,
        1.35 + Math.sin(ease * Math.PI) * 1.55,
        d.oz + ease * 3.8 + Math.cos(t + d.phase * 6) * d.sway * 0.2,
      );
      dummy.rotation.set(d.tilt + t * d.spin * 0.4, ease * 4, t * d.spin * 0.2);
      dummy.scale.set(0.22, 0.006, 0.1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
}

function buildTravel(
  scene: THREE.Scene,
  phone: boolean,
  boards: BotBoard[],
  style: BoardStyle,
  own: <T extends { dispose: () => void }>(o: T) => T,
  ticks: Array<(t: number, dt: number) => void>,
) {
  const sky = canvasTex(8, 8, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 8);
    g.addColorStop(0, "#87c6ef");
    g.addColorStop(0.55, "#c8e6f7");
    g.addColorStop(1, "#f2e6c8");
    c.fillStyle = g;
    c.fillRect(0, 0, 8, 8);
  });
  scene.background = sky;
  scene.fog = new THREE.Fog(0xc8e6f7, 18, 55);

  const sandTex = canvasTex(256, 256, (c) => {
    c.fillStyle = "#e6c98a";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 800; i++) {
      c.fillStyle = Math.random() > 0.5 ? "#d8b56a" : "#f0d8a0";
      c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  });
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.set(8, 8);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(40, 28), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0, 2);
  scene.add(sand);

  // water
  const segs = phone ? 16 : 32;
  const waterGeo = new THREE.PlaneGeometry(44, 22, segs, Math.max(8, segs / 2));
  waterGeo.rotateX(-Math.PI / 2);
  const pos = waterGeo.attributes.position;
  const baseY = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) baseY[i] = 0;
  const waterMat = new THREE.MeshStandardMaterial({
    color: "#1d6a8a",
    roughness: 0.2,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(0, 0.02, -16);
  scene.add(water);
  // shoreline foam strip
  addBox(scene, mat("#e8f4f8", { rough: 1 }), 40, 0.02, 1.2, 0, 0.03, -5.4);

  ticks.push((t) => {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = Math.sin(x * 0.45 + t * 1.5) * 0.08 + Math.sin(z * 0.35 + t * 1.15) * 0.06;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    if (!phone) waterGeo.computeVertexNormals();
  });

  // sun — upper right of the default view
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffe566 }));
  sun.position.set(5.8, 8.6, -7.5);
  scene.add(sun);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(2.7, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  glow.position.copy(sun.position);
  scene.add(glow);
  const sunLight = new THREE.DirectionalLight(0xfff0c8, 1.05);
  sunLight.position.copy(sun.position);
  scene.add(sunLight);

  // palms in the default camera frustum (mid-foreground, not only at the frame edges)
  const palmSpots: Array<[number, number, number]> = [
    [-3.15, 0, 4.6],
    [-2.25, 0, 2.7],
    [3.05, 0, 4.8],
    [2.35, 0, 2.6],
    [-5.4, 0, 1.2],
    [5.2, 0, 1.4],
  ];
  (phone ? palmSpots.slice(0, 4) : palmSpots).forEach((p) => scene.add(makePalm(p[0], p[1], p[2])));

  // destinations chalkboard + desk globe as beach-side props
  const chalk = destBoardTex();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: chalk }));
  board.position.set(3.4, 1.15, 1.6);
  board.rotation.y = -0.5;
  scene.add(board);
  addBox(scene, mat("#5a3a22"), 0.08, 1.2, 0.08, 3.0, 0.6, 1.85);
  addBox(scene, mat("#5a3a22"), 0.08, 1.2, 0.08, 3.85, 0.6, 1.35);

  const globe = makeDeskGlobe();
  globe.position.set(2.3, 0.55, 2.4);
  scene.add(globe);
  ticks.push((t) => {
    globe.userData.spin.rotation.y = t * 0.6;
  });

  placeBoards(scene, boards, style, "travel");

  const plane = makeAirplane();
  scene.add(plane);
  const TRAIL = 42;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  scene.add(trail);
  const hist: Array<{ x: number; y: number; z: number }> = [];
  let lastU = 0;
  const pathAt = (u: number) => {
    const x = -9 + u * 18;
    const z = 0.5 - u * 3.0;
    const y = 5.7 + Math.sin(u * Math.PI) * 0.35;
    return { x, y, z };
  };
  ticks.push((t) => {
    // ~8s loop; start already in frame (offset 2s) so the plane is visible soon after entering.
    const period = 8;
    const u = ((t + 2.0) % period) / period;
    if (u < lastU) hist.length = 0;
    lastU = u;
    const p = pathAt(u);
    const n = pathAt(Math.min(u + 0.02, 0.999));
    plane.position.set(p.x, p.y, p.z);
    plane.lookAt(n.x, n.y, n.z);
    hist.unshift(p);
    if (hist.length > TRAIL) hist.pop();
    for (let i = 0; i < TRAIL; i++) {
      const q = hist[Math.min(i, hist.length - 1)] || p;
      trailPos[i * 3] = q.x;
      trailPos[i * 3 + 1] = q.y;
      trailPos[i * 3 + 2] = q.z;
    }
    trailGeo.attributes.position.needsUpdate = true;
  });
}

function makePalm(x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const trunkM = mat("#6a4320", { rough: 0.95 });
  const leafM = mat("#1f6b32", { rough: 0.7 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 3.2, 8), trunkM);
  trunk.position.y = 1.6;
  trunk.rotation.z = 0.08;
  g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.35), leafM);
    leaf.position.set(0, 3.15, 0);
    leaf.rotation.set(0.35, (i / 6) * Math.PI * 2, 0.15);
    leaf.translateX(0.7);
    g.add(leaf);
  }
  return g;
}

function makeDeskGlobe() {
  const g = new THREE.Group();
  const tex = canvasTex(256, 128, (c) => {
    c.fillStyle = "#1a4a8a";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#2e8a4a";
    // rough continents
    c.beginPath();
    c.ellipse(70, 60, 28, 34, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(140, 50, 18, 22, 0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(200, 70, 22, 18, -0.2, 0, Math.PI * 2);
    c.fill();
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  ball.position.y = 0.34;
  g.add(ball);
  g.userData.spin = ball;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), mat("#c9a227", { metal: 0.7, rough: 0.3 }));
  stand.position.y = 0.14;
  g.add(stand);
  addBox(g, mat("#3a2a18"), 0.28, 0.04, 0.28, 0, 0.02, 0);
  return g;
}

function makeAirplane() {
  const g = new THREE.Group();
  const white = mat("#f4f0e6", { rough: 0.45 });
  const blue = mat("#2a4a7a", { rough: 0.45 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 1.85, 10), white);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 10), white);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.05;
  g.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 2.05), blue);
  g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.07), blue);
  tail.position.set(-0.82, 0.2, 0);
  g.add(tail);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.7), blue);
  stab.position.set(-0.82, 0.05, 0);
  g.add(stab);
  const bannerTex = canvasTex(256, 64, (c) => {
    c.fillStyle = "#f4f0e6";
    c.fillRect(0, 0, 256, 64);
    c.strokeStyle = "#2a4a7a";
    c.lineWidth = 8;
    c.strokeRect(3, 3, 250, 58);
    c.fillStyle = "#2a4a7a";
    c.font = "700 36px system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("TRAVEL", 128, 34);
  });
  const cord = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.02), mat("#2a2a2a"));
  cord.position.set(-1.45, -0.02, 0);
  g.add(cord);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.44), new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide }));
  banner.position.set(-2.4, -0.06, 0);
  g.add(banner);
  g.scale.setScalar(1.55);
  return g;
}
