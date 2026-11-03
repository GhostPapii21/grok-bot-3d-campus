// Grok Bot look for the web app. ALL colors live in PALETTE below — tweak here only.
// (Sampled from the Grok Bot app: page #141414, panels #1e1e1e, cards #202020, controls #2c2c2e, accent magenta #c22576.)
export const PALETTE = {
  page: "#141414",        // main background (campus floor, page)
  panel: "#1e1e1e",       // raised panels / floating windows
  card: "#202020",        // cards, bubbles, pods
  control: "#2c2c2e",     // round icon buttons, inputs, secondary pills
  selected: "#3b3b3d",    // selected tile / strong border
  divider: "#262626",     // hairlines
  text: "#ffffff",
  text2: "#9a9a9a",
  text3: "#6e6e6e",
  accent: "#c22576",      // magenta fill (primary buttons, counts, selection)
  accentText: "#ec5aa6",  // magenta for text on dark (readable)
  accentSoft: "#3a1a2c",
  success: "#2ecc71", successSoft: "#17301f",
  warning: "#f5a623", warningSoft: "#33270f",
  danger: "#ff4d5e", dangerSoft: "#3a1a1d",
  // bright flat blob colors (characters, team dots)
  blobs: ["#2f8cff", "#2ecc71", "#ff8a1f", "#ff2d9b", "#8f5bff", "#ff3b4f"],
  font: 'system-ui, -apple-system, "Segoe UI", Arial, "Noto Sans Hebrew", sans-serif',
};
const P = PALETTE;
const TH = {
  kind: "dark" as const,
  bg: { base: P.page, subtle: P.page, elevated: P.card },
  text: { primary: P.text, secondary: P.text2, tertiary: P.text3, onColor: "#ffffff", onPrimary: P.page, accent: P.accentText, success: P.success, warning: P.warning, danger: P.danger, accentDeep: P.accentText, successDeep: P.success, warningDeep: P.warning, dangerDeep: P.danger },
  fill: { primary: P.text, secondary: P.control, accent: P.accent, accentSubtle: P.accentSoft, successSubtle: P.successSoft, warningSubtle: P.warningSoft, dangerSubtle: P.dangerSoft },
  border: { subtle: P.divider, weak: P.divider, default: P.control, strong: P.selected, focus: P.accent },
  font: { family: P.font, mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  dataviz: { categorical: P.blobs, blueTint: P.selected },
};
export function useGrokTheme(): any { return TH; }
