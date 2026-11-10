import type { BotBoard } from "./status"
import { formatLastRun, formatStatusTime, hasPostedBoard, lastRunFailed, stateTint, waitingMessage } from "./status"

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  return lines.length ? lines : [""]
}

export type BoardStyle = "whiteboard" | "monitor"

/** Draw one bot's three-section board onto a canvas, sized to read at the default camera. */
export function drawBotBoard(canvas: HTMLCanvasElement, board: BotBoard, style: BoardStyle = "whiteboard") {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const monitor = style === "monitor"

  const paper = monitor ? "#0e1410" : "#f4f1e6"
  const ink = monitor ? "#e8f8e4" : "#1a1a1a"
  const muted = monitor ? "#8fb89a" : "#555555"
  const rule = monitor ? "#1f3a28" : "#d4cbb0"
  const head = monitor ? "#7dff9a" : "#2a4a7a"

  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)
  if (!monitor) {
    ctx.strokeStyle = "#cfc6aa"
    ctx.lineWidth = 20
    ctx.strokeRect(10, 10, W - 20, H - 20)
  } else {
    ctx.fillStyle = "#142018"
    ctx.fillRect(0, 0, W, 10)
    ctx.fillRect(0, H - 10, W, 10)
  }

  const pad = 56
  let y = 72
  ctx.fillStyle = ink
  ctx.font = "700 64px system-ui, sans-serif"
  for (const line of wrap(ctx, board.bot, W - pad * 2)) {
    ctx.fillText(line, pad, y)
    y += 70
  }
  ctx.fillStyle = muted
  ctx.font = "700 28px system-ui, sans-serif"
  ctx.fillText("ROOM BOARD  ·  TAP TO READ THE FULL LIST", pad, y)
  y += 44

  if (!hasPostedBoard(board)) {
    ctx.fillStyle = ink
    ctx.font = "italic 44px system-ui, sans-serif"
    const msg = waitingMessage(board.bot)
    for (const line of wrap(ctx, msg, W - pad * 2)) {
      ctx.fillText(line, pad, y)
      y += 52
    }
    return
  }

  const section = (title: string) => {
    y += 14
    ctx.fillStyle = head
    ctx.font = "800 32px system-ui, sans-serif"
    ctx.fillText(title, pad, y)
    y += 10
    ctx.strokeStyle = rule
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
    y += 40
  }

  const emptyLine = (text: string) => {
    ctx.fillStyle = muted
    ctx.font = "italic 34px system-ui, sans-serif"
    ctx.fillText(text, pad, y)
    y += 42
  }

  const overflow = () => {
    ctx.fillStyle = muted
    ctx.font = "italic 30px system-ui, sans-serif"
    ctx.fillText("Tap the board to read the rest →", pad, Math.min(y + 10, H - 36))
  }

  const itemBlock = (title: string, meta: string, metaColor: string) => {
    ctx.fillStyle = ink
    ctx.font = "600 34px system-ui, sans-serif"
    const lines = wrap(ctx, title, W - pad * 2)
    for (const line of lines) {
      if (y > H - 90) return false
      ctx.fillText(line, pad, y)
      y += 40
    }
    ctx.fillStyle = metaColor
    ctx.font = "700 26px system-ui, sans-serif"
    if (y > H - 60) return false
    ctx.fillText(meta, pad, y)
    y += 36
    return true
  }

  section("WORKING ON NOW")
  if (!board.workingOn.length) emptyLine("Nothing running right now")
  else {
    for (const w of board.workingOn) {
      const when = formatStatusTime(w.updatedAt)
      const meta = when ? `${w.state.toUpperCase()}  ·  ${when}` : w.state.toUpperCase()
      if (!itemBlock(w.task, meta, stateTint(w.state, false, monitor))) {
        overflow()
        return
      }
    }
  }

  section("ROUTINES")
  if (!board.routines.length) emptyLine("No routines")
  else {
    for (const r of board.routines) {
      if (y > H - 90) {
        overflow()
        return
      }
      const failed = lastRunFailed(r.lastRun)
      ctx.fillStyle = ink
      ctx.font = "700 32px system-ui, sans-serif"
      const nameLines = wrap(ctx, r.name, W - pad * 2)
      for (const line of nameLines) {
        if (y > H - 90) {
          overflow()
          return
        }
        ctx.fillText(line, pad, y)
        y += 36
      }
      // color-coded state, red last-run if failed
      const st = r.state.toUpperCase()
      ctx.font = "700 26px system-ui, sans-serif"
      ctx.fillStyle = stateTint(r.state, false, monitor)
      ctx.fillText(st, pad, y)
      const stW = ctx.measureText(st).width
      ctx.fillStyle = muted
      ctx.font = "600 26px system-ui, sans-serif"
      const mid = `  ·  ${r.schedule}  ·  last run `
      ctx.fillText(mid, pad + stW, y)
      const midW = ctx.measureText(mid).width
      const run = formatLastRun(r.lastRun)
      ctx.fillStyle = failed ? (monitor ? "#ff6b6b" : "#c62828") : muted
      ctx.font = failed ? "700 26px system-ui, sans-serif" : "600 26px system-ui, sans-serif"
      ctx.fillText(run, pad + stW + midW, y)
      y += 38
    }
  }

  section("OPEN TASKS")
  if (!board.openTasks.length) emptyLine("No open tasks")
  else {
    for (const t of board.openTasks) {
      const when = formatStatusTime(t.updatedAt)
      const meta = when ? `${t.state.toUpperCase()}  ·  ${when}` : t.state.toUpperCase()
      if (!itemBlock(t.task, meta, stateTint(t.state, false, monitor))) {
        overflow()
        return
      }
    }
  }
}

export function makeBoardTexture(board: BotBoard, style: BoardStyle = "whiteboard") {
  const canvas = document.createElement("canvas")
  canvas.width = 1536
  canvas.height = 2048
  drawBotBoard(canvas, board, style)
  return canvas
}
