import type { BotBoard } from "./status"
import { formatLastRun, formatStatusTime, hasPostedBoard, waitingMessage } from "./status"

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

/** Draw one bot's three-section board onto a canvas. */
export function drawBotBoard(canvas: HTMLCanvasElement, board: BotBoard, style: BoardStyle = "whiteboard") {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const paper = style === "monitor" ? "#0e1410" : "#f4f1e6"
  const ink = style === "monitor" ? "#d8f5d0" : "#1a1a1a"
  const muted = style === "monitor" ? "#8fb89a" : "#555555"
  const rule = style === "monitor" ? "#1f3a28" : "#d4cbb0"
  const head = style === "monitor" ? "#7dff9a" : "#2a4a7a"
  const accent = style === "monitor" ? "#c8a84b" : "#8a3a2a"

  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)
  if (style === "whiteboard") {
    ctx.strokeStyle = "#cfc6aa"
    ctx.lineWidth = 16
    ctx.strokeRect(8, 8, W - 16, H - 16)
    // faint grid
    ctx.strokeStyle = "rgba(0,0,0,0.04)"
    ctx.lineWidth = 1
    for (let y = 90; y < H; y += 36) {
      ctx.beginPath()
      ctx.moveTo(36, y)
      ctx.lineTo(W - 36, y)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = "#142018"
    ctx.fillRect(0, 0, W, 8)
    ctx.fillRect(0, H - 8, W, 8)
  }

  const pad = 48
  let y = 56
  ctx.fillStyle = ink
  ctx.font = "700 44px system-ui, sans-serif"
  ctx.fillText(board.bot, pad, y)
  y += 28
  ctx.fillStyle = muted
  ctx.font = "600 22px system-ui, sans-serif"
  ctx.fillText("ROOM BOARD", pad, y)
  y += 36

  if (!hasPostedBoard(board)) {
    ctx.fillStyle = ink
    ctx.font = "italic 32px system-ui, sans-serif"
    const msg = waitingMessage(board.bot)
    for (const line of wrap(ctx, msg, W - pad * 2)) {
      ctx.fillText(line, pad, y)
      y += 40
    }
    return
  }

  const section = (title: string) => {
    y += 10
    ctx.fillStyle = head
    ctx.font = "800 24px system-ui, sans-serif"
    ctx.fillText(title, pad, y)
    y += 8
    ctx.strokeStyle = rule
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
    y += 28
  }

  const emptyLine = (text: string) => {
    ctx.fillStyle = muted
    ctx.font = "italic 24px system-ui, sans-serif"
    ctx.fillText(text, pad, y)
    y += 34
  }

  const itemBlock = (title: string, meta: string) => {
    ctx.fillStyle = ink
    ctx.font = "600 24px system-ui, sans-serif"
    const lines = wrap(ctx, title, W - pad * 2)
    for (const line of lines) {
      if (y > H - 70) return false
      ctx.fillText(line, pad, y)
      y += 28
    }
    ctx.fillStyle = accent
    ctx.font = "600 18px system-ui, sans-serif"
    if (y > H - 50) return false
    ctx.fillText(meta, pad, y)
    y += 30
    return true
  }

  section("WORKING ON NOW")
  if (!board.workingOn.length) emptyLine("Nothing running right now")
  else {
    for (const w of board.workingOn) {
      const when = formatStatusTime(w.updatedAt)
      if (!itemBlock(w.task, when ? `${w.state.toUpperCase()}  ·  ${when}` : w.state.toUpperCase())) return
    }
  }

  section("ROUTINES")
  if (!board.routines.length) emptyLine("No routines")
  else {
    for (const r of board.routines) {
      const meta = `${r.state.toUpperCase()}  ·  ${r.schedule}  ·  last run ${formatLastRun(r.lastRun)}`
      if (!itemBlock(r.name, meta)) {
        ctx.fillStyle = muted
        ctx.font = "italic 20px system-ui, sans-serif"
        ctx.fillText("More on the Read board panel →", pad, Math.min(y + 8, H - 28))
        return
      }
    }
  }

  section("OPEN TASKS")
  if (!board.openTasks.length) emptyLine("No open tasks")
  else {
    for (const t of board.openTasks) {
      const when = formatStatusTime(t.updatedAt)
      if (!itemBlock(t.task, when ? `${t.state.toUpperCase()}  ·  ${when}` : t.state.toUpperCase())) {
        ctx.fillStyle = muted
        ctx.font = "italic 20px system-ui, sans-serif"
        ctx.fillText("More on the Read board panel →", pad, Math.min(y + 8, H - 28))
        return
      }
    }
  }
}

export function makeBoardTexture(board: BotBoard, style: BoardStyle = "whiteboard") {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 1536
  drawBotBoard(canvas, board, style)
  return canvas
}
