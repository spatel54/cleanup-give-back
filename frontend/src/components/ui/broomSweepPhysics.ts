/** Plant, stroke-and-step, recover. Dots scatter on the hit and sleep when they land. */

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  /** -1..1, used for a one-shot scatter when the broom first hits this dot. */
  spread: number;
  struck: boolean;
};

export type SweepPhase = 'plant' | 'stroke' | 'recover' | 'walk';

export type SweepWorld = {
  w: number;
  h: number;
  floorY: number;
  broomX: number;
  broomY: number;
  broomBaseY: number;
  broomScale: number;
  broomDraw: number;
  broomAngle: number;
  broomVx: number;
  prevBroomX: number;
  prevBroomAngle: number;
  stationX: number;
  stepFromX: number;
  stepToX: number;
  phase: SweepPhase;
  phaseT: number;
  recoverFromAngle: number;
  strokeCount: number;
  particles: Particle[];
};

export const BROOM_VIEWBOX = 72;
/** Collar, after the horizontal flip that faces bristles right. */
export const BROOM_PIVOT = { x: 38, y: 40 };
export const BROOM_FLOOR = 63.5;

export const BROOM_COLORS = {
  handle: '#835400',
  head: '#c2d832',
  collar: '#3e4a3d',
  stroke: '#1c1b1b',
} as const;

const PLANT_SEC = 0.16;
const STROKE_SEC = 0.32;
const RECOVER_SEC = 0.22;
const MIN_STROKE_SEC = 0.1;
const STROKE_ANGLE = -16;
const WALK_SPEED = 95;
const SCRAPE_SPEED = 72;
const CONTACT_SLACK = 6;
const MAX_STROKES_PER_PASS = 5;
const HIT_PUSH = 220;
const HIT_PUSH_SPREAD = 80;
const HIT_HOP = 220;
const HIT_HOP_SPREAD = 50;
const HIT_FOLLOW = 90;
const GRAVITY = 1680;
const FLOOR_FRICTION = 5;
const SUBSTEPS = 8;
const SLEEP_SPEED = 12;
const PARTICLE_COUNT = 8;
const DOT_COLORS = ['#3e4a3d', '#6e7a6c', '#3e4a3d', '#5c665b', '#6e7a6c'];
/** Outer bristle arc in flipped broom.svg space (right sweeping edge). */
const BRISTLE_ARC = [
  { x: 45.3, y: 44.5 },
  { x: 62.1, y: 47.8 },
  { x: 59.1, y: 52.6 },
  { x: 54.3, y: 57.6 },
  { x: 46.4, y: 62.6 },
] as const;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function easeOut(t: number) {
  return bezier(t, 0.23, 1, 0.32, 1);
}

function easeInOut(t: number) {
  return bezier(t, 0.77, 0, 0.175, 1);
}

function bezier(t: number, x1: number, y1: number, x2: number, y2: number) {
  let x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < 5; i += 1) {
    const u = 1 - x;
    const cx = 3 * u * u * x * x1 + 3 * u * x * x * x2 + x * x * x;
    const dx = 3 * u * u * x1 + 6 * u * x * (x2 - x1) + 3 * x * x * (1 - x2);
    if (Math.abs(dx) < 1e-6) {
      break;
    }
    x -= (cx - t) / dx;
  }
  const u = 1 - x;
  return 3 * u * u * x * y1 + 3 * u * x * x * y2 + x * x * x;
}

export function broomDrawSize(width: number, height = width) {
  return height > width * 1.15 ? width * 0.55 : width * 0.42;
}

function startX(world: Pick<SweepWorld, 'broomDraw'>) {
  return world.broomDraw * 0.02;
}

function offX(world: Pick<SweepWorld, 'w' | 'broomDraw'>) {
  return world.w + world.broomDraw * 0.35;
}

function rotateAround(
  px: number,
  py: number,
  ox: number,
  oy: number,
  deg: number,
) {
  const a = (deg * Math.PI) / 180;
  const dx = px - ox;
  const dy = py - oy;
  return {
    x: ox + dx * Math.cos(a) - dy * Math.sin(a),
    y: oy + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

function worldBristlePoint(
  world: Pick<SweepWorld, 'broomX' | 'broomY' | 'broomScale' | 'broomAngle'>,
  origX: number,
  origY: number,
) {
  const local = rotateAround(origX, origY, BROOM_PIVOT.x, BROOM_PIVOT.y, world.broomAngle);
  return {
    x: world.broomX + world.broomScale * local.x,
    y: world.broomY + world.broomScale * local.y,
  };
}

function bristleFaceX(
  world: Pick<SweepWorld, 'broomX' | 'broomY' | 'broomScale' | 'broomAngle'>,
  py: number,
) {
  const pts = BRISTLE_ARC.map((p) => worldBristlePoint(world, p.x, p.y));
  if (py <= pts[0].y) {
    return pts[0].x;
  }
  const last = pts[pts.length - 1];
  if (py >= last.y) {
    return last.x;
  }
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    if (py < minY || py > maxY) {
      continue;
    }
    const span = b.y - a.y;
    const t = Math.abs(span) < 1e-6 ? 0 : (py - a.y) / span;
    return a.x + t * (b.x - a.x);
  }
  return last.x;
}

function pileParticles(world: SweepWorld, seed: number) {
  const rng = mulberry32(seed);
  const unit = world.broomDraw / 112;
  const front = bristleFaceX(world, world.floorY - 3);
  const cx = front + 5 * unit;
  world.particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const r = (3.6 + rng() * 1.4) * unit;
    const rad = 7.2 * Math.sqrt(rng()) * unit;
    const ang = rng() * Math.PI - 0.2;
    const x = Math.max(front + r + 0.4, cx + Math.cos(ang) * rad * 0.9);
    world.particles.push({
      x,
      y: world.floorY - r,
      vx: 0,
      vy: 0,
      r,
      spread: rng() * 2 - 1,
      struck: false,
      color: DOT_COLORS[i % DOT_COLORS.length],
    });
  }
}

export function createSweepWorld(width: number, height = width, seed = 1): SweepWorld {
  const broomDraw = broomDrawSize(width, height);
  const broomScale = broomDraw / BROOM_VIEWBOX;
  const floorY = height * 0.55;
  const broomBaseY = Math.max(4, floorY - BROOM_FLOOR * broomScale);
  const station = startX({ broomDraw });
  const world: SweepWorld = {
    w: width,
    h: height,
    floorY,
    broomX: station,
    broomY: broomBaseY,
    broomBaseY,
    broomScale,
    broomDraw,
    broomAngle: 0,
    broomVx: 0,
    prevBroomX: station,
    prevBroomAngle: 0,
    stationX: station,
    stepFromX: station,
    stepToX: station,
    phase: 'plant',
    phaseT: 0,
    recoverFromAngle: STROKE_ANGLE,
    strokeCount: 0,
    particles: [],
  };
  pileParticles(world, seed);
  return world;
}

function asleep(p: Particle, floorY: number) {
  return p.y + p.r >= floorY - 0.6 && Math.abs(p.vx) < SLEEP_SPEED && Math.abs(p.vy) < SLEEP_SPEED;
}

function stepParticles(world: SweepWorld, dt: number) {
  for (const p of world.particles) {
    if (asleep(p, world.floorY)) {
      p.vx = 0;
      p.vy = 0;
      p.y = world.floorY - p.r;
      continue;
    }

    const drag = Math.exp(-(0.55 + 0.06 * p.r) * dt);
    p.vy += GRAVITY * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.y + p.r > world.floorY) {
      p.y = world.floorY - p.r;
      p.vy = 0;
      const grip = Math.exp(-(FLOOR_FRICTION + p.r * 0.35) * dt);
      p.vx *= grip;
      if (Math.abs(p.vx) < SLEEP_SPEED) {
        p.vx = 0;
      }
    }

    if (p.x < p.r) {
      p.x = p.r;
      p.vx = Math.abs(p.vx) * 0.15;
    }
  }
}

function brushDots(world: SweepWorld) {
  if (world.phase !== 'stroke') {
    return;
  }
  for (const p of world.particles) {
    const face = bristleFaceX(world, p.y);
    const behind = p.x + p.r < face;
    const overlapping = p.x - p.r < face;
    if (!overlapping) {
      continue;
    }
    if (p.struck && !behind) {
      continue;
    }
    p.x = face + p.r;
    if (!p.struck) {
      p.struck = true;
      const s = speedScale(world);
      p.vx = world.broomVx + (HIT_PUSH + p.spread * HIT_PUSH_SPREAD) * s;
      p.vy = -(HIT_HOP + Math.abs(p.spread) * HIT_HOP_SPREAD) * s;
      continue;
    }
    p.vx = Math.max(p.vx, world.broomVx + HIT_FOLLOW * speedScale(world));
  }
}

function speedScale(world: Pick<SweepWorld, 'w'>) {
  return world.w / 280;
}

function touchingDots(world: SweepWorld) {
  for (const p of world.particles) {
    const face = bristleFaceX(world, p.y);
    if (p.x - p.r <= face + CONTACT_SLACK * (world.broomDraw / 112) && p.x + p.r >= face - 4) {
      return true;
    }
  }
  return false;
}

function canStroke(world: SweepWorld) {
  return world.strokeCount < MAX_STROKES_PER_PASS;
}

function afterRest(world: SweepWorld) {
  world.broomAngle = 0;
  world.broomVx = 0;
  if (world.stationX >= offX(world) - 0.5) {
    resetLoop(world);
    return;
  }
  if (canStroke(world) && touchingDots(world)) {
    world.phase = 'plant';
    world.phaseT = 0;
    return;
  }
  world.phase = 'walk';
  world.phaseT = 0;
}

function beginStroke(world: SweepWorld) {
  world.phase = 'stroke';
  world.phaseT = 0;
  world.strokeCount += 1;
  for (const p of world.particles) {
    p.struck = false;
  }
}

function beginRecover(world: SweepWorld) {
  world.recoverFromAngle = world.broomAngle;
  world.phase = 'recover';
  world.phaseT = 0;
  world.broomVx = 0;
}

function resetLoop(world: SweepWorld) {
  const x = startX(world);
  world.stationX = x;
  world.broomX = x;
  world.prevBroomX = x;
  world.broomAngle = 0;
  world.prevBroomAngle = 0;
  world.broomVx = 0;
  world.phase = 'plant';
  world.phaseT = 0;
  world.recoverFromAngle = STROKE_ANGLE;
  world.strokeCount = 0;
  pileParticles(world, (Math.random() * 1000) | 0);
}

function advancePhase(world: SweepWorld) {
  switch (world.phase) {
    case 'plant':
      if (canStroke(world) && touchingDots(world)) {
        beginStroke(world);
      } else {
        world.phase = 'walk';
        world.phaseT = 0;
      }
      return;
    case 'stroke':
      beginRecover(world);
      return;
    case 'recover':
      afterRest(world);
      return;
    case 'walk':
      return;
    default: {
      const _never: never = world.phase;
      return _never;
    }
  }
}

function updateBroom(world: SweepWorld, dt: number) {
  world.prevBroomX = world.broomX;
  world.prevBroomAngle = world.broomAngle;
  world.phaseT += dt;
  const durations: Record<SweepPhase, number> = {
    plant: PLANT_SEC,
    stroke: STROKE_SEC,
    recover: RECOVER_SEC,
    walk: Number.POSITIVE_INFINITY,
  };
  const dur = durations[world.phase];
  const u = Math.min(1, world.phaseT / Math.max(dur, 1e-5));

  switch (world.phase) {
    case 'plant':
      world.broomAngle = 0;
      world.broomX = world.stationX;
      world.broomVx = 0;
      break;
    case 'stroke': {
      const e = easeOut(u);
      world.broomAngle = STROKE_ANGLE * e;
      if (touchingDots(world)) {
        world.broomX += SCRAPE_SPEED * speedScale(world) * dt;
        world.stationX = world.broomX;
        world.broomVx = SCRAPE_SPEED * speedScale(world);
      } else {
        world.broomVx = 0;
        if (world.phaseT >= MIN_STROKE_SEC) {
          beginRecover(world);
          return;
        }
      }
      break;
    }
    case 'recover':
      world.broomAngle = world.recoverFromAngle * (1 - easeInOut(u));
      world.broomX = world.stationX;
      world.broomVx = 0;
      break;
    case 'walk':
      world.broomAngle = 0;
      world.broomX += WALK_SPEED * speedScale(world) * dt;
      world.stationX = world.broomX;
      world.broomVx = WALK_SPEED * speedScale(world);
      if (world.broomX >= offX(world) - 0.5) {
        resetLoop(world);
        return;
      }
      if (canStroke(world) && touchingDots(world)) {
        beginStroke(world);
        return;
      }
      break;
    default: {
      const _never: never = world.phase;
      return _never;
    }
  }

  if (world.phase !== 'walk' && world.phaseT >= dur) {
    advancePhase(world);
  }
}

export function stepSweepWorld(world: SweepWorld, dt: number) {
  const clamped = Math.min(Math.max(dt, 0), 1 / 30);
  const h = clamped / SUBSTEPS;
  for (let i = 0; i < SUBSTEPS; i += 1) {
    updateBroom(world, h);
    stepParticles(world, h);
    brushDots(world);
  }
}
