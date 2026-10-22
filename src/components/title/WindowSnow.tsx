import { useEffect, useRef } from 'react'
import officeScene from '../../assets/images/prologue/splash_1962.jpeg'
import { createFlakes, stepFlakes, type Flake } from './snowfall'
import { buildGlassMask, WINDOW_RECT } from './glassMask'

const WINDOW_RADIUS = '45% 45% 0 0 / 18% 18% 0 0'
const WINDOW_CLIP = `inset(0 round ${WINDOW_RADIUS})`
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MS_PER_SEC = 1000
const TWO_PI = Math.PI * 2
const FLAKE_FILL = 'rgba(232,238,250,1)'
const NEAR_GLOW_MIN_RADIUS = 2.2
const NEAR_GLOW_BLUR_FACTOR = 3
const NEAR_GLOW_COLOR = 'rgba(235,242,255,0.8)'
const HAZE_START_OFFSET = 0.7
const HAZE_TOP = 'rgba(200,215,240,0)'
const HAZE_BOTTOM = 'rgba(200,215,240,0.10)'
const MASK_BLUR_FILTER = 'blur(1px)'

interface Size {
  width: number
  height: number
}

function sizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Size {
  const dpr = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { width, height }
}

function applyFlakeGlow(ctx: CanvasRenderingContext2D, flake: Flake): void {
  if (flake.r >= NEAR_GLOW_MIN_RADIUS) {
    ctx.shadowBlur = flake.r * NEAR_GLOW_BLUR_FACTOR
    ctx.shadowColor = NEAR_GLOW_COLOR
  } else {
    ctx.shadowBlur = 0
  }
}

function drawFlakes(ctx: CanvasRenderingContext2D, flakes: readonly Flake[]): void {
  ctx.fillStyle = FLAKE_FILL
  for (const flake of flakes) {
    ctx.globalAlpha = flake.alpha
    applyFlakeGlow(ctx, flake)
    ctx.beginPath()
    ctx.arc(flake.x, flake.y, flake.r, 0, TWO_PI)
    ctx.fill()
  }
}

function drawHaze(ctx: CanvasRenderingContext2D, { width, height }: Size): void {
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(HAZE_START_OFFSET, HAZE_TOP)
  gradient.addColorStop(1, HAZE_BOTTOM)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

/** Keeps only the pixels already drawn that fall inside the mask's glass coverage. */
function applyGlassMask(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mask, 0, 0)
  ctx.restore()
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  flakes: readonly Flake[],
  size: Size,
  mask: HTMLCanvasElement | null,
): void {
  ctx.clearRect(0, 0, size.width, size.height)
  drawFlakes(ctx, flakes)
  drawHaze(ctx, size)
  if (mask) applyGlassMask(ctx, mask)
}

/**
 * Builds a backing-store-sized mask that is opaque where the artwork shows glass
 * and transparent over the window frame. Returns null on any failure so the snow
 * simply draws unmasked.
 */
async function buildWindowMask(width: number, height: number): Promise<HTMLCanvasElement | null> {
  try {
    const img = new Image()
    img.src = officeScene
    await img.decode()

    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = width
    sourceCanvas.height = height
    const sourceCtx = sourceCanvas.getContext('2d')
    if (!sourceCtx) return null

    const { naturalWidth: iw, naturalHeight: ih } = img
    sourceCtx.drawImage(
      img,
      WINDOW_RECT.x * iw,
      WINDOW_RECT.y * ih,
      WINDOW_RECT.w * iw,
      WINDOW_RECT.h * ih,
      0,
      0,
      width,
      height,
    )
    const pixels = sourceCtx.getImageData(0, 0, width, height)
    pixels.data.set(buildGlassMask(pixels.data))
    sourceCtx.putImageData(pixels, 0, 0)

    const blurredCanvas = document.createElement('canvas')
    blurredCanvas.width = width
    blurredCanvas.height = height
    const blurredCtx = blurredCanvas.getContext('2d')
    if (!blurredCtx) return null
    blurredCtx.filter = MASK_BLUR_FILTER
    blurredCtx.drawImage(sourceCanvas, 0, 0)
    return blurredCanvas
  } catch {
    // Mask is an enhancement: any failure (no decode support, tainted or missing image) leaves snow unmasked.
    return null
  }
}

export default function WindowSnow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
    let size = sizeCanvas(canvas, ctx)
    let flakes = createFlakes(size.width, size.height)
    let mask: HTMLCanvasElement | null = null
    let maskRequestId = 0
    let frameId: number | null = null
    let lastTimestamp: number | null = null
    let timeSec = 0

    const rebuildMask = () => {
      const requestId = ++maskRequestId
      mask = null
      void buildWindowMask(canvas.width, canvas.height).then(built => {
        if (requestId !== maskRequestId) return
        mask = built
        if (reducedMotion) drawFrame(ctx, flakes, size, mask)
      })
    }

    const handleResize = () => {
      size = sizeCanvas(canvas, ctx)
      flakes = createFlakes(size.width, size.height)
      rebuildMask()
      if (reducedMotion) drawFrame(ctx, flakes, size, mask)
    }

    const tick = (timestamp: number) => {
      if (document.hidden) {
        lastTimestamp = null
      } else {
        const dtSec = lastTimestamp === null ? 0 : (timestamp - lastTimestamp) / MS_PER_SEC
        lastTimestamp = timestamp
        timeSec += dtSec
        flakes = stepFlakes(flakes, dtSec, timeSec, size.width, size.height)
      }
      drawFrame(ctx, flakes, size, mask)
      frameId = window.requestAnimationFrame(tick)
    }

    window.addEventListener('resize', handleResize)
    rebuildMask()
    drawFrame(ctx, flakes, size, mask)
    if (!reducedMotion) frameId = window.requestAnimationFrame(tick)

    return () => {
      maskRequestId++
      window.removeEventListener('resize', handleResize)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      data-testid="window-snow"
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '58%',
        top: '6%',
        width: '19%',
        height: '46%',
        pointerEvents: 'none',
        borderRadius: WINDOW_RADIUS,
        overflow: 'hidden',
        clipPath: WINDOW_CLIP,
      }}
    />
  )
}
