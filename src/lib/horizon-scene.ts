// Browser only: the drawing behind the home hero. Ink lines from both sides (many
// voices) flow into one sun on the horizon (آفاق).

type Point = { x: number; y: number };
type Curve = readonly [Point, Point, Point, Point];
type Drop = Point & { age: number; word: string };

/** Survives pausing, so resuming continues where it stopped. */
export type SceneState = {
  time: number;
  /** Sun position as a fraction of the width. */
  sun: number;
  target: number;
  pointer: Point | null;
  drops: Drop[];
  wordIndex: number;
};

export const createSceneState = (): SceneState => ({
  time: 0,
  sun: 0.5,
  target: 0.5,
  pointer: null,
  drops: [],
  wordIndex: 0,
});

const LINES_PER_SIDE = 6;
const DROP_SECONDS = 2.2;

function pointOn([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  const at = (k: "x" | "y") =>
    u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k];
  return { x: at("x"), y: at("y") };
}

function readPalette(canvas: HTMLCanvasElement) {
  const root = getComputedStyle(document.documentElement);
  return {
    brand: root.getPropertyValue("--brand").trim(),
    soft: root.getPropertyValue("--brand-soft").trim(),
    font: getComputedStyle(canvas).fontFamily,
  };
}

/** Starts drawing; returns a function that stops it. When not running it draws a still frame. */
export function startHorizon(
  canvas: HTMLCanvasElement,
  area: HTMLElement,
  state: SceneState,
  words: readonly string[],
  running: boolean,
): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const ctx = context;

  let width = 0;
  let height = 0;
  let palette = readPalette(canvas);
  let frame = 0;
  let last = 0;
  let visible = true;

  function curveFor(side: 1 | -1, index: number, sunX: number, horizon: number): Curve {
    const depth = index / (LINES_PER_SIDE - 1);
    const edge = side === 1 ? width + 10 : -10;
    const wave = Math.sin(state.time * 0.8 + index * 1.3 + side) * 14;
    const startY = horizon * (0.22 + depth * 0.62);
    const first = { x: edge - side * width * 0.16, y: startY + 70 + wave };
    const second = { x: sunX + side * width * 0.22, y: horizon - 8 - depth * 12 - wave };

    // Lines lean towards the pointer, more when it is close
    if (state.pointer) {
      for (const point of [first, second]) {
        const dx = state.pointer.x - point.x;
        const dy = state.pointer.y - point.y;
        const pull = 0.38 * Math.exp(-(dx * dx + dy * dy) / (280 * 280));
        point.x += dx * pull;
        point.y += dy * pull;
      }
    }
    return [{ x: edge, y: startY }, first, second, { x: sunX, y: horizon }];
  }

  function drawSun(x: number, horizon: number) {
    const radius = Math.max(44, Math.min(82, width * 0.11));

    const glow = ctx.createRadialGradient(x, horizon, radius / 2, x, horizon, radius * 2.4);
    glow.addColorStop(0, palette.soft);
    // Same colour at zero alpha; plain "transparent" would fade through grey
    glow.addColorStop(1, `${palette.soft}00`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 2.4, horizon - radius * 2.4, radius * 4.8, radius * 2.4);

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 1; i < 16; i++) {
      const angle = Math.PI + (i / 16) * Math.PI;
      const pulse = Math.sin(state.time * 1.6 + i * 0.9);
      const from = radius * 1.25;
      const to = radius * ((i % 2 ? 1.55 : 1.8) + pulse * 0.1);
      ctx.globalAlpha = 0.32 + pulse * 0.1;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * from, horizon + Math.sin(angle) * from);
      ctx.lineTo(x + Math.cos(angle) * to, horizon + Math.sin(angle) * to);
      ctx.stroke();
    }

    ctx.fillStyle = palette.brand;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, horizon, radius, Math.PI, 0);
    ctx.fill();
  }

  function draw() {
    if (!width || !height) return;
    const horizon = height - 28;
    const sunX = state.sun * width;
    const narrow = width < 640;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = palette.brand;
    drawSun(sunX, horizon);

    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(width, horizon);
    ctx.stroke();

    ctx.fillStyle = palette.brand;
    ctx.direction = "rtl";
    ctx.textAlign = "center";

    for (const side of [1, -1] as const) {
      for (let i = 0; i < LINES_PER_SIDE; i++) {
        if (narrow && i < 3) continue; // keep clear of the text on phones
        const curve = curveFor(side, i, sunX, horizon);
        const [a, b, c, d] = curve;
        ctx.globalAlpha = 0.12 + (i % 3) * 0.06;
        ctx.lineWidth = 1 + (i % 3) * 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
        ctx.stroke();

        // A drop of ink travelling to the sun
        const progress = (state.time * 0.11 + i * 0.37 + (side === 1 ? 0.2 : 0.7)) % 1;
        const dot = pointOn(curve, progress);
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.8;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Category names ride some lines and fade before they reach the middle
        if (!narrow && i % 2 === 0 && words.length) {
          const phase = (state.time * 0.07 + i * 0.19 + (side === 1 ? 0.22 : 0.4)) % 1;
          const at = pointOn(curve, 0.05 + phase * 0.22);
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.85;
          ctx.font = `500 17px ${palette.font}`;
          ctx.fillText(words[(i / 2 + (side === 1 ? 0 : 3)) % words.length], at.x, at.y - 9);
        }
      }
    }

    for (const drop of state.drops) {
      const progress = drop.age / DROP_SECONDS;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = (1 - progress) * 0.5;
      for (const scale of [1, 0.6]) {
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 4 + Math.sqrt(progress) * 70 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1 - progress * progress;
      ctx.font = `700 24px ${palette.font}`;
      ctx.fillText(drop.word, drop.x, drop.y - 14 - progress * 60);
    }
    ctx.globalAlpha = 1;
  }

  function tick(now: number) {
    const seconds = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    state.time += seconds;
    state.sun += (state.target - state.sun) * (1 - Math.exp(-seconds * 4));
    for (const drop of state.drops) drop.age += seconds;
    state.drops = state.drops.filter((drop) => drop.age < DROP_SECONDS);
    draw();
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    last = 0;
    if (running && visible) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function locate(event: MouseEvent): Point {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function follow(event: PointerEvent) {
    state.pointer = locate(event);
    state.target = Math.min(0.85, Math.max(0.15, state.pointer.x / width));
  }

  function release() {
    state.pointer = null;
    state.target = 0.5;
  }

  function addDrop(event: MouseEvent) {
    if ((event.target as Element).closest("a, button") || !words.length) return;
    state.drops.push({ ...locate(event), age: 0, word: words[state.wordIndex++ % words.length] });
    if (state.drops.length > 8) state.drops.shift();
  }

  const sizes = new ResizeObserver(resize);
  sizes.observe(canvas);
  const screen = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    schedule();
  });
  screen.observe(canvas);
  const theme = new MutationObserver(() => {
    palette = readPalette(canvas);
    draw();
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  if (running) {
    area.addEventListener("pointermove", follow, { passive: true });
    area.addEventListener("pointerleave", release);
    area.addEventListener("click", addDrop);
  }

  resize();
  schedule();

  return () => {
    cancelAnimationFrame(frame);
    sizes.disconnect();
    screen.disconnect();
    theme.disconnect();
    area.removeEventListener("pointermove", follow);
    area.removeEventListener("pointerleave", release);
    area.removeEventListener("click", addDrop);
  };
}
