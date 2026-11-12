// Themed decor for the inside-the-room view (CSS 3D). Pure drawing: given the room's helpers and the clock,
// returns the elements to place in the scene. The WebGL campus has its own version in lib/theme3d.ts.
import type { RoomTheme } from "../lib/themes";

type Ctx = {
  t: number; W2: number; D2: number; HH: number; portrait: boolean; colors: readonly string[];
  billboard: (k: string, x: number, y: number, z: number, w: number, h: number, children: any) => any;
  face: (w: number, h: number, tr: string, style: any, children?: any) => any;
  at: (x: number, y: number, z: number) => string;
  S3: any;
};
const shadow = (rx: number) => <ellipse cx={0} cy={-3} rx={rx} ry={rx * 0.2} fill="rgba(0,0,0,.4)" />;

function Jersey(p: { color: string; trim: string; num: string; sleeveless?: boolean }) {
  const d = p.sleeveless ? "M 30 6 Q 50 30 70 6 L 84 6 Q 78 36 88 48 L 88 114 L 12 114 L 12 48 Q 22 36 16 6 Z"
    : "M 26 8 L 4 22 L 14 46 L 24 39 L 24 114 L 76 114 L 76 39 L 86 46 L 96 22 L 74 8 Q 50 26 26 8 Z";
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 120">
      <path d={d} fill={p.color} stroke={p.trim} strokeWidth={4} strokeLinejoin="round" />
      <text x={50} y={82} textAnchor="middle" fontSize={40} fontWeight={800} fill={p.trim} fontFamily="system-ui, sans-serif">{p.num}</text>
    </svg>
  );
}
function Trophy(p: { ball: "football" | "basketball"; t: number }) {
  return (
    <svg width="100%" height="100%" viewBox="-50 -150 100 150" style={{ overflow: "visible" }}>
      {shadow(30)}
      <rect x={-26} y={-18} width={52} height={16} rx={3} fill="#2a2a2c" stroke="#3a3a3c" />
      <rect x={-6} y={-48} width={12} height={32} fill="#d9a62e" />
      <path d="M -26 -100 L 26 -100 Q 24 -52 0 -48 Q -24 -52 -26 -100 Z" fill="#f5c542" stroke="#b8891f" strokeWidth={2} />
      <path d="M -26 -92 Q -44 -88 -30 -66" fill="none" stroke="#f5c542" strokeWidth={5} /><path d="M 26 -92 Q 44 -88 30 -66" fill="none" stroke="#f5c542" strokeWidth={5} />
      <g transform={`translate(0 ${-122 + Math.sin(p.t * 2) * 3})`}>
        {p.ball === "football"
          ? <g transform="rotate(-25)"><ellipse rx={20} ry={12} fill="#8a4b22" stroke="#5a2f14" strokeWidth={2} /><path d="M -8 0 L 8 0 M -4 -4 L -4 4 M 0 -4 L 0 4 M 4 -4 L 4 4" stroke="#fff" strokeWidth={1.6} /></g>
          : <g><circle r={16} fill="#ff8a2a" stroke="#b8501a" strokeWidth={2} /><path d="M -16 0 L 16 0 M 0 -16 L 0 16 M -11 -11 Q 0 0 -11 11 M 11 -11 Q 0 0 11 11" stroke="#7a3410" strokeWidth={1.5} fill="none" /></g>}
      </g>
    </svg>
  );
}
function MiniBot(p: { color: string; hop: number; flip?: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="-40 -90 80 90" style={{ overflow: "visible" }}>
      {shadow(20)}
      <g transform={`translate(0 ${-p.hop}) scale(${p.flip ? -1 : 1} 1)`}>
        <ellipse cx={0} cy={-30} rx={24} ry={28} fill={p.color} />
        <ellipse cx={-7} cy={-40} rx={7} ry={9} fill="rgba(255,255,255,.28)" />
        <circle cx={4} cy={-34} r={3.6} fill="#111" /><circle cx={15} cy={-34} r={3.6} fill="#111" />
        <circle cx={26} cy={-24} r={6} fill={p.color} />
      </g>
    </svg>
  );
}
function FilmScreen(p: { kind: "nfl" | "nba"; t: number }) {
  const ph = (p.t * 0.35) % 1; const nfl = p.kind === "nfl";
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 150" style={{ overflow: "visible" }}>
      <ellipse cx={100} cy={147} rx={60} ry={6} fill="rgba(0,0,0,.4)" />
      <rect x={96} y={112} width={8} height={30} fill="#3a3a3c" /><rect x={60} y={140} width={80} height={6} rx={3} fill="#3a3a3c" />
      <rect x={2} y={2} width={196} height={112} rx={8} fill="#0d0d0f" stroke="#3a3a3c" strokeWidth={3} />
      <rect x={9} y={22} width={182} height={86} fill={nfl ? "#1f7a3a" : "#c98a4b"} />
      {nfl ? [0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={22 + i * 31} y1={22} x2={22 + i * 31} y2={108} stroke="rgba(255,255,255,.7)" strokeWidth={1.5} />)
        : <><rect x={13} y={26} width={174} height={78} fill="none" stroke="#fff" strokeWidth={1.5} /><circle cx={100} cy={65} r={15} fill="none" stroke="#fff" strokeWidth={1.5} /></>}
      {Array.from({ length: 10 }, (_, i) => {
        const home = i < 5; const x = (home ? 72 : 122) + (home ? 1 : -1) * ph * 24 + Math.sin(p.t * 2 + i) * 4, y = 38 + (i % 5) * 14 + Math.cos(p.t * 1.7 + i * 2) * 4;
        return <circle key={i} cx={x} cy={y} r={4} fill={home ? "#3b82f6" : "#ef4444"} />;
      })}
      <circle cx={74 + ph * 60} cy={66 - Math.sin(ph * Math.PI) * 26} r={3} fill={nfl ? "#5a2f14" : "#ff8a2a"} stroke="#fff" strokeWidth={0.6} />
      <rect x={9} y={8} width={182} height={14} fill="rgba(0,0,0,.75)" /><circle cx={17} cy={15} r={3.5} fill="#ff4d4d" opacity={0.5 + 0.5 * Math.sin(p.t * 5)} />
      <text x={25} y={19} fontSize={10} fontWeight={800} fill="#fff" fontFamily="system-ui, sans-serif">GAME FILM</text>
    </svg>
  );
}

export function roomDecor(theme: RoomTheme, c: Ctx): any[] {
  const { t, W2, D2, HH, portrait, billboard, face, at } = c;
  const out: any[] = [];
  const s = portrait ? 0.8 : 1;
  const bl = { x: -W2 * (portrait ? 0.56 : 0.52), z: -D2 * 0.72 };
  const fz = D2 * (portrait ? 0.84 : 0.86);
  // front-right floor spot (clear of the schedule board) and a standing rack on the left for things that would otherwise hang on a full wall
  const fr = { x: W2 * (portrait ? 0.78 : 0.97), z: D2 * (portrait ? 0.6 : 0.56) };
  const wallRow = (items: any[], w: number, h: number) => {
    const n = portrait ? 3 : 4; const gap = 10; const rw = n * w + (n - 1) * gap + 30, rh = h + 78;
    const rs = s * (portrait ? 0.9 : 0.8);
    out.push(billboard("rack", -W2 * (portrait ? 0.74 : 1.0), 0, -D2 * (portrait ? 0.3 : 0.16), rw * rs, rh * rs, (
      <svg width="100%" height="100%" viewBox={`0 0 ${rw} ${rh}`} style={{ overflow: "visible" }}>
        <ellipse cx={rw / 2} cy={rh - 3} rx={rw * 0.42} ry={7} fill="rgba(0,0,0,.4)" />
        <path d={`M 12 ${rh - 4} L 12 10 L ${rw - 12} 10 L ${rw - 12} ${rh - 4}`} fill="none" stroke="#6b6b70" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        {items.slice(0, n).map((el, i) => (
          <g key={i} transform={`translate(${15 + i * (w + gap)} 0)`}>
            <path d={`M ${w / 2} 10 L ${w / 2} 22`} stroke="#9a9aa0" strokeWidth={3} />
            <foreignObject x={0} y={20} width={w} height={h}>{el}</foreignObject>
          </g>
        ))}
      </svg>
    )));
  };

  if (theme === "money") {
    const drop = (t * 0.5) % 1;
    out.push(billboard("pig", bl.x, 0, bl.z, 210 * s, 190 * s, (
      <svg width="100%" height="100%" viewBox="-100 -180 200 180" style={{ overflow: "visible" }}>
        {shadow(70)}
        {drop < 0.6 && <g transform={`translate(-6 ${-176 + (drop / 0.6) * 46})`}><ellipse rx={13} ry={13 * Math.abs(Math.cos(t * 6)) + 2} fill="#f5c542" stroke="#b8891f" strokeWidth={2} /></g>}
        <g transform={`scale(1 ${1 + 0.02 * Math.sin(t * 2)})`}>
          <rect x={-58} y={-34} width={20} height={32} rx={8} fill="#f07aa2" /><rect x={30} y={-34} width={20} height={32} rx={8} fill="#f07aa2" />
          <ellipse cx={-4} cy={-74} rx={78} ry={56} fill="#ff8fb3" />
          <ellipse cx={-28} cy={-92} rx={28} ry={18} fill="rgba(255,255,255,.22)" />
          <path d="M 22 -122 L 40 -150 L 52 -116 Z" fill="#ff8fb3" /><path d="M -10 -128 L 2 -154 L 18 -126 Z" fill="#f07aa2" />
          <ellipse cx={68} cy={-72} rx={22} ry={18} fill="#f07aa2" /><circle cx={62} cy={-72} r={3.5} fill="#7a2d49" /><circle cx={74} cy={-72} r={3.5} fill="#7a2d49" />
          <circle cx={36} cy={-92} r={5} fill="#111" /><rect x={-24} y={-131} width={36} height={6} rx={3} fill="#7a2d49" />
          <path d="M -82 -78 q -18 -10 -8 -24" fill="none" stroke="#f07aa2" strokeWidth={6} strokeLinecap="round" />
        </g>
      </svg>
    )));
    [[fr.x, fr.z, 1], [fr.x - 105 * s, fr.z + 40, 0.78], [fr.x + 40 * s, fr.z + 120, 0.66]].forEach(([x, z, k], i) => out.push(billboard("bag" + i, x, 0, z, 130 * s * k, 150 * s * k, (
      <svg width="100%" height="100%" viewBox="-60 -140 120 140" style={{ overflow: "visible" }}>
        {shadow(40)}
        <g transform={`rotate(${Math.sin(t * 1.3 + i * 2) * 2.5})`}>
          <path d="M -16 -112 L -30 -132 L 30 -132 L 16 -112 Z" fill="#c9b27a" /><rect x={-18} y={-116} width={36} height={8} rx={3} fill="#8a6a2f" />
          <path d="M -16 -110 Q -66 -60 -44 -14 Q -30 0 0 0 Q 30 0 44 -14 Q 66 -60 16 -110 Z" fill="#c9b27a" stroke="#a48d55" strokeWidth={2} />
          <text x={0} y={-36} textAnchor="middle" fontSize={54} fontWeight={800} fill="#1f5d33" fontFamily="system-ui, sans-serif">$</text>
        </g>
      </svg>
    ))));
    out.push(billboard("coins", 0, 0, fz, 170 * s, 140 * s, (
      <svg width="100%" height="100%" viewBox="-55 -90 110 90" style={{ overflow: "visible" }}>
        {shadow(38)}
        {[[-26, 5], [4, 7], [30, 3]].map(([x, n], j) => Array.from({ length: n }, (_, i) => <ellipse key={j + "-" + i} cx={x} cy={-6 - i * 8} rx={16} ry={6} fill="#f5c542" stroke="#b8891f" strokeWidth={1.5} />))}
      </svg>
    )));
    wallRow([0, 1, 2, 3].map((i) => (
      <svg width="100%" height="100%" viewBox="0 0 120 80"><rect x={2} y={2} width={116} height={76} rx={8} fill="#101512" stroke="#2c3a31" strokeWidth={3} />
        {i % 2 === 0 ? <><polyline points="12,62 34,50 52,56 72,34 92,38 108,16" fill="none" stroke="#2ecc71" strokeWidth={4} /><text x={12} y={26} fontSize={18} fontWeight={800} fill="#2ecc71" fontFamily="system-ui, sans-serif">$ ▲</text></>
          : <><text x={60} y={52} textAnchor="middle" fontSize={40} fontWeight={800} fill="#f5c542" fontFamily="system-ui, sans-serif">$$$</text></>}
      </svg>
    )), 120, 80);
  }

  if (theme === "travel") {
    const sh = (t * 18) % 120;
    out.push(billboard("globe", bl.x, 0, bl.z, 180 * s, 230 * s, (
      <svg width="100%" height="100%" viewBox="-90 -230 180 230" style={{ overflow: "visible" }}>
        {shadow(52)}
        <rect x={-34} y={-12} width={68} height={10} rx={5} fill="#2a2a2c" /><rect x={-4} y={-70} width={8} height={60} fill="#b08d57" />
        <defs><clipPath id="globeClip"><circle cx={0} cy={-140} r={70} /></clipPath></defs>
        <circle cx={0} cy={-140} r={70} fill="#1d6fd1" />
        <g clipPath="url(#globeClip)">
          {[-120, 0, 120].map((o) => <g key={o} transform={`translate(${o + sh - 60} -140)`} fill="#3fbf6b">
            <ellipse cx={-30} cy={-22} rx={24} ry={16} /><ellipse cx={-18} cy={22} rx={12} ry={22} /><ellipse cx={30} cy={-28} rx={18} ry={11} /><ellipse cx={38} cy={8} rx={14} ry={20} /><ellipse cx={0} cy={48} rx={16} ry={8} />
          </g>)}
          <ellipse cx={-24} cy={-166} rx={30} ry={18} fill="rgba(255,255,255,.2)" />
        </g>
        <circle cx={0} cy={-140} r={70} fill="none" stroke="#b08d57" strokeWidth={4} />
        <path d="M 0 -216 A 76 76 0 0 1 0 -64" fill="none" stroke="#b08d57" strokeWidth={5} transform="rotate(18 0 -140)" />
      </svg>
    )));
    out.push(billboard("case", fr.x, 0, fr.z, 150 * s, 130 * s, (
      <svg width="100%" height="100%" viewBox="-75 -130 150 130" style={{ overflow: "visible" }}>
        {shadow(52)}
        <rect x={-22} y={-126} width={44} height={22} rx={8} fill="none" stroke="#333" strokeWidth={7} />
        <rect x={-60} y={-106} width={120} height={102} rx={12} fill="#c2552d" stroke="#8f3a1b" strokeWidth={3} />
        <rect x={-60} y={-62} width={120} height={12} fill="#f5c542" /><circle cx={-34} cy={-30} r={9} fill="#f2f4f8" /><rect x={10} y={-92} width={34} height={20} rx={3} fill="#1d6fd1" transform="rotate(-8 27 -82)" />
      </svg>
    )));
    const flags: any[] = [
      <><rect width={96} height={64} fill="#fff" /><circle cx={48} cy={32} r={18} fill="#d7263d" /></>,
      <><rect width={32} height={64} fill="#2156a5" /><rect x={32} width={32} height={64} fill="#fff" /><rect x={64} width={32} height={64} fill="#e23d3d" /></>,
      <><rect width={96} height={64} fill="#1f9d55" /><path d="M 48 6 L 90 32 L 48 58 L 6 32 Z" fill="#f5d142" /><circle cx={48} cy={32} r={13} fill="#1d4fa3" /></>,
      <><rect width={32} height={64} fill="#1f9d55" /><rect x={32} width={32} height={64} fill="#fff" /><rect x={64} width={32} height={64} fill="#d7263d" /></>,
    ];
    wallRow(flags.map((f, i) => <svg key={i} width="100%" height="100%" viewBox="-3 -3 102 70"><rect x={-3} y={-3} width={102} height={70} rx={4} fill="#3a3a3c" /><g>{f}</g></svg>), 116, 80);
    // airplane circling overhead, with a short trail
    const a = t * 0.55; const R = W2 * (portrait ? 0.62 : 0.6);
    const px = Math.cos(a) * R, pz = Math.sin(a) * D2 * 0.42 - D2 * 0.15; const right = -Math.sin(a) > 0;
    out.push(billboard("plane", px, -HH * 0.78 + Math.sin(t * 1.4) * 10, pz, 150 * s, 80 * s, (
      <svg width="100%" height="100%" viewBox="-75 -40 150 80" style={{ overflow: "visible" }}>
        <g transform={`scale(${right ? 1 : -1} 1) rotate(-6)`}>
          <path d="M -72 6 L -120 6" stroke="rgba(255,255,255,.35)" strokeWidth={4} strokeDasharray="10 9" />
          <path d="M -58 0 Q -58 -12 -40 -12 L 40 -12 Q 66 -10 70 2 Q 64 12 40 12 L -44 12 Q -58 12 -58 0 Z" fill="#f2f4f8" stroke="#c5cad3" strokeWidth={2} />
          <path d="M -8 8 L -34 38 L -16 38 L 20 8 Z" fill="#dfe3ea" /><path d="M -50 -10 L -66 -36 L -52 -36 L -36 -10 Z" fill="#e23d3d" />
          {[-18, -4, 10, 24, 38].map((x) => <circle key={x} cx={x} cy={-3} r={3} fill="#1d6fd1" />)}
        </g>
      </svg>
    )));
    // toy train looping on the floor at the front
    const rx = W2 * (portrait ? 0.7 : 0.62), rz = D2 * 0.07;
    out.push(<div key="track" style={{ ...c.S3, transform: at(0, -1, fz) }}>{face(rx * 2 + 30, rz * 2 + 30, "rotateX(90deg)", { borderRadius: "50%", border: "5px dashed #5b5b60", boxSizing: "border-box" })}</div>);
    ["#e23d3d", "#f5c542", "#3b82f6", "#2ecc71"].forEach((col, i) => {
      const b = t * 0.7 - i * 0.2; const fwd = -Math.sin(b) > 0;
      out.push(billboard("car" + i, Math.cos(b) * rx, 0, fz + Math.sin(b) * rz, 74 * s, 60 * s, (
        <svg width="100%" height="100%" viewBox="-37 -60 74 60" style={{ overflow: "visible" }}>
          <g transform={`scale(${fwd ? 1 : -1} 1)`}>
            <rect x={-32} y={-40} width={64} height={30} rx={6} fill={col} />
            {i === 0 && <><rect x={-30} y={-58} width={26} height={20} rx={4} fill={col} /><rect x={14} y={-56} width={10} height={18} fill="#222" /></>}
            {i > 0 && <rect x={-22} y={-34} width={44} height={12} rx={3} fill="rgba(255,255,255,.35)" />}
            <circle cx={-18} cy={-8} r={8} fill="#222" /><circle cx={18} cy={-8} r={8} fill="#222" />
          </g>
        </svg>
      )));
    });
  }

  if (theme === "nfl" || theme === "nba") {
    const nfl = theme === "nfl";
    const fw = W2 * (portrait ? 1.5 : 1.25), fd = portrait ? 150 : 170;
    out.push(<div key="field" style={{ ...c.S3, transform: at(0, -1, fz) }}>{face(fw, fd, "rotateX(90deg)", { borderRadius: 10, overflow: "hidden", boxShadow: "0 0 0 4px #fff inset" }, nfl ? (
      <svg width="100%" height="100%" viewBox="0 0 520 140" preserveAspectRatio="none">
        <rect width={520} height={140} fill="#1f7a3a" /><rect width={46} height={140} fill="#17608f" /><rect x={474} width={46} height={140} fill="#b3202a" />
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={46 + i * 42.8} y1={0} x2={46 + i * 42.8} y2={140} stroke="rgba(255,255,255,.85)" strokeWidth={3} />)}
        {["10", "20", "30", "40", "50", "40", "30", "20", "10"].map((n, i) => <text key={i} x={46 + (i + 1) * 42.8} y={122} textAnchor="middle" fontSize={20} fontWeight={800} fill="rgba(255,255,255,.85)" fontFamily="system-ui, sans-serif">{n}</text>)}
      </svg>
    ) : (
      <svg width="100%" height="100%" viewBox="0 0 520 160" preserveAspectRatio="none">
        <rect width={520} height={160} fill="#c98a4b" />
        {Array.from({ length: 15 }, (_, i) => <line key={i} x1={0} y1={10 + i * 10} x2={520} y2={10 + i * 10} stroke="rgba(120,70,30,.3)" strokeWidth={1} />)}
        <line x1={260} y1={0} x2={260} y2={160} stroke="#fff" strokeWidth={4} /><circle cx={260} cy={80} r={26} fill="none" stroke="#fff" strokeWidth={4} />
        <rect x={0} y={48} width={84} height={64} fill="rgba(180,60,30,.35)" stroke="#fff" strokeWidth={4} /><rect x={436} y={48} width={84} height={64} fill="rgba(180,60,30,.35)" stroke="#fff" strokeWidth={4} />
        <path d="M 0 18 A 70 70 0 0 1 0 142" fill="none" stroke="#fff" strokeWidth={4} transform="translate(22 0)" /><path d="M 520 18 A 70 70 0 0 0 520 142" fill="none" stroke="#fff" strokeWidth={4} transform="translate(-22 0)" />
      </svg>
    ))}</div>);
    // two mini bots throwing the ball back and forth
    const ax = -fw * (nfl ? 0.33 : 0.28), bx = -ax;
    const per = nfl ? 2.6 : 2.2; const ph = (t % (2 * per)) / per; const dir = ph < 1 ? 1 : -1; const u = ph < 1 ? ph : ph - 1; const fly = Math.min(1, u / 0.72);
    const x0 = dir > 0 ? ax : bx, x1 = dir > 0 ? bx : ax; const ballX = x0 + (x1 - x0) * fly;
    const ballY = nfl ? -70 - Math.sin(fly * Math.PI) * 150 : -34 - Math.abs(Math.sin(fly * Math.PI * 2)) * 70;
    const hopA = (dir > 0 ? (u < 0.12 ? Math.sin((u / 0.12) * Math.PI) : 0) : (u > 0.68 && u < 0.86 ? Math.sin(((u - 0.68) / 0.18) * Math.PI) : 0)) * 16;
    const hopB = (dir < 0 ? (u < 0.12 ? Math.sin((u / 0.12) * Math.PI) : 0) : (u > 0.68 && u < 0.86 ? Math.sin(((u - 0.68) / 0.18) * Math.PI) : 0)) * 16;
    out.push(billboard("mbA", ax - 26, 0, fz, 80 * s, 90 * s, <MiniBot color={c.colors[0]} hop={hopA} />));
    out.push(billboard("mbB", bx + 26, 0, fz, 80 * s, 90 * s, <MiniBot color={c.colors[3 % c.colors.length]} hop={hopB} flip />));
    out.push(billboard("ball", ballX, ballY, fz, 44, 44, (
      <svg width="100%" height="100%" viewBox="-22 -22 44 44" style={{ overflow: "visible" }}>
        {nfl ? <g transform={`rotate(${dir > 0 ? -20 : 200})`}><ellipse rx={17} ry={10} fill="#8a4b22" stroke="#5a2f14" strokeWidth={2} /><path d="M -7 0 L 7 0 M -3 -3 L -3 3 M 1 -3 L 1 3 M 5 -3 L 5 3" stroke="#fff" strokeWidth={1.4} /></g>
          : <g transform={`rotate(${t * 300 * dir})`}><circle r={15} fill="#ff8a2a" stroke="#b8501a" strokeWidth={2} /><path d="M -15 0 L 15 0 M 0 -15 L 0 15" stroke="#7a3410" strokeWidth={1.4} /></g>}
      </svg>
    )));
    if (!nfl) [-1, 1].forEach((sd) => out.push(billboard("hoop" + sd, sd * (fw / 2 + 6), 0, fz, 52 * s, 112 * s, (
      <svg width="100%" height="100%" viewBox="-35 -150 70 150" style={{ overflow: "visible" }}>
        <rect x={-3} y={-110} width={6} height={110} fill="#555" /><rect x={-28} y={-146} width={56} height={40} rx={3} fill="#f2f4f8" stroke="#c5cad3" strokeWidth={2} /><rect x={-10} y={-128} width={20} height={16} fill="none" stroke="#e23d3d" strokeWidth={2} />
        <ellipse cx={-sd * 16} cy={-104} rx={15} ry={5} fill="none" stroke="#ff5a1f" strokeWidth={3.5} /><path d={`M ${-sd * 16 - 14} -104 L ${-sd * 16 - 8} -84 L ${-sd * 16 + 8} -84 L ${-sd * 16 + 14} -104`} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.4} />
      </svg>
    ))));
    else [-1, 1].forEach((sd) => out.push(billboard("post" + sd, sd * (fw / 2 + 6), 0, fz, 44 * s, 88 * s, (
      <svg width="100%" height="100%" viewBox="-35 -140 70 140" style={{ overflow: "visible" }}>
        <path d="M 0 0 L 0 -62 M -26 -62 L 26 -62 M -26 -62 L -26 -136 M 26 -62 L 26 -136" fill="none" stroke="#f5d142" strokeWidth={5} strokeLinecap="round" />
      </svg>
    ))));
    out.push(billboard("trophy", fr.x, 0, fr.z, 120 * s, 180 * s, <Trophy ball={nfl ? "football" : "basketball"} t={t} />));
    out.push(billboard("film", bl.x, 0, bl.z, 230 * s, 172 * s, <FilmScreen kind={theme} t={t} />));
    const sets: [string, string, string][] = nfl ? [["#1d4fa3", "#ffffff", "12"], ["#b3202a", "#f5d142", "87"], ["#1f7a3a", "#ffffff", "21"], ["#222222", "#f5c542", "9"]]
      : [["#6a2fb8", "#f5d142", "23"], ["#d7263d", "#ffffff", "30"], ["#1d6fd1", "#ffffff", "7"], ["#111111", "#ff8a2a", "0"]];
    wallRow(sets.map(([color, trim, num], i) => <Jersey key={i} color={color} trim={trim} num={num} sleeveless={!nfl} />), 92, 110);
  }
  return out;
}
