import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import {
  BROOM_COLORS,
  BROOM_PIVOT,
  createSweepWorld,
  stepSweepWorld,
  type Particle,
} from '@/components/ui/broomSweepPhysics';
import { primitives } from '@/constants/tokens';

type Props = {
  size?: number;
  width?: number;
  height?: number;
};

const HEAD =
  'M20.6736,59.9844c1.2983-1.388,3.5826-3.6053,4.8424-4.9521-1.4537.886-4.2076,3.37-5.6142,4.2624A46.0024,46.0024,0,0,1,14.41,54.5235a23.6424,23.6424,0,0,0,9.05-4.15,29.78,29.78,0,0,1-10.084,2.9036,47.9434,47.9434,0,0,1-3.4267-5.45c7.1521,1.9446,14.9291-.92,19.73-5.92,1.2414.7174,2.835,1.59,4.1359,2.2474a3.2052,3.2052,0,0,1,1.6174,1.9094c1.7464,4.6657.728,8.7784-2.4318,12.475-1.3221,1.5467-3.2938,3.9123-5.0353,4.9607A33.9572,33.9572,0,0,1,20.6736,59.9844Z';
const HANDLE =
  'M36.41,39.1206l-2.5918-1.5c.684-1.1936,1.3464-2.3568,2.0156-3.516Q43.0888,21.5374,50.3463,8.9716c.0989-.1713.1948-.3449.3033-.51A1.4973,1.4973,0,0,1,53.234,9.9742c-.81,1.4511-1.6532,2.8832-2.484,4.3224Q44.3857,25.322,38.02,36.347C37.4975,37.2525,36.9705,38.1556,36.41,39.1206Z';
const COLLAR =
  'M35.17,44.2183,30.05,41.2608c.5348-.9183,1.0216-1.82,1.5756-2.6789a.9318.9318,0,0,1,1.31-.3181q1.7127.9444,3.3875,1.9568a.9384.9384,0,0,1,.377,1.2973C36.2334,42.4269,35.696,43.3,35.17,44.2183Z';

/** SVG Repo basic-cloud — matches `frontend/assets/animations/cloud.svg`. */
const CLOUD_D =
  'M396.007,191.19c-0.478,0-1.075,0-1.554,0c-6.693-54.147-52.833-96.103-108.773-96.103c-48.171,0-89.051,31.078-103.753,74.349c-16.734-8.128-35.381-12.67-55.224-12.67C56.658,156.765,0,213.542,0,283.707c0,67.416,52.594,122.64,118.934,126.703v0.239h277.91c60.244-0.358,108.893-49.366,108.893-109.729C505.617,240.317,456.609,191.19,396.007,191.19z';
const CLOUD_VIEWBOX_W = 505.736;
const CLOUD_VIEWBOX_Y = 90;
const CLOUD_VX = 16;
const REF_WIDTH = 390;
const CLOUD_SPECS = [
  { xRatio: 0.28, yRatio: 0.04, w: 32 },
  { xRatio: 0.72, yRatio: 0.06, w: 38 },
  { xRatio: 0.4, yRatio: 0.28, w: 24 },
  { xRatio: 0.05, yRatio: 0.1, w: 64 },
  { xRatio: 0.84, yRatio: 0.32, w: 52 },
  { xRatio: 0.52, yRatio: 0.14, w: 80 },
  { xRatio: 0.12, yRatio: 0.34, w: 44 },
] as const;

type Cloud = {
  x: number;
  y: number;
  w: number;
  vx: number;
};

function createClouds(width: number, skyHeight: number): Cloud[] {
  const scale = width / REF_WIDTH;
  return CLOUD_SPECS.map((spec) => ({
    x: spec.xRatio * width,
    y: spec.yRatio * skyHeight,
    w: spec.w * scale,
    vx: CLOUD_VX * scale,
  }));
}

function stepClouds(clouds: Cloud[], width: number, dt: number) {
  for (const cloud of clouds) {
    cloud.x += cloud.vx * dt;
    if (cloud.x > width) {
      cloud.x = -cloud.w;
    }
  }
}

type Snap = {
  w: number;
  h: number;
  broomX: number;
  broomY: number;
  broomScale: number;
  broomAngle: number;
  floorY: number;
  particles: Particle[];
  clouds: Cloud[];
};

function snapshotOf(
  world: ReturnType<typeof createSweepWorld>,
  clouds: Cloud[],
): Snap {
  return {
    w: world.w,
    h: world.h,
    broomX: world.broomX,
    broomY: world.broomY,
    broomScale: world.broomScale,
    broomAngle: world.broomAngle,
    floorY: world.floorY,
    particles: world.particles.map((p) => ({ ...p })),
    clouds: clouds.map((c) => ({ ...c })),
  };
}

/** Physics broom: plant, stroke on contact, walk at rest. */
export function BroomSweepLoader({ size = 160, width, height }: Props) {
  const w = width ?? size;
  const h = height ?? size;
  const worldRef = useRef(createSweepWorld(w, h));
  const cloudsRef = useRef<Cloud[]>(createClouds(w, worldRef.current.floorY));
  const [snap, setSnap] = useState<Snap>(() =>
    snapshotOf(worldRef.current, cloudsRef.current),
  );

  useEffect(() => {
    const world = createSweepWorld(w, h);
    const clouds = createClouds(w, world.floorY);
    worldRef.current = world;
    cloudsRef.current = clouds;
    setSnap(snapshotOf(world, clouds));

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      stepSweepWorld(world, dt);
      stepClouds(clouds, w, dt);
      setSnap(snapshotOf(world, clouds));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  return (
    <View style={[s.box, { width: w, height: h }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Rect x={0} y={0} width={w} height={snap.floorY} fill={primitives.cream50} />
        {snap.clouds.map((cloud, i) => {
          const scale = cloud.w / CLOUD_VIEWBOX_W;
          return (
            <G
              key={i}
              transform={`translate(${cloud.x}, ${cloud.y}) scale(${scale}) translate(0, ${-CLOUD_VIEWBOX_Y})`}
            >
              <Path d={CLOUD_D} fill={primitives.tourMint} />
            </G>
          );
        })}
        <Rect
          x={0}
          y={snap.floorY}
          width={w}
          height={Math.max(0, h - snap.floorY)}
          fill={primitives.green500}
        />
        {snap.particles.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} />
        ))}
        <G transform={`translate(${snap.broomX}, ${snap.broomY}) scale(${snap.broomScale})`}>
          <G transform={`rotate(${snap.broomAngle}, ${BROOM_PIVOT.x}, ${BROOM_PIVOT.y})`}>
            <G transform="translate(72 0) scale(-1 1)">
              <Path d={HEAD} fill={BROOM_COLORS.head} />
              <Path d={HANDLE} fill={BROOM_COLORS.handle} />
              <Path d={COLLAR} fill={BROOM_COLORS.collar} />
              <Path
                d={HEAD}
                fill="none"
                stroke={BROOM_COLORS.stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={HANDLE}
                fill="none"
                stroke={BROOM_COLORS.stroke}
                strokeWidth={2}
                strokeMiterlimit={10}
              />
              <Path
                d={COLLAR}
                fill="none"
                stroke={BROOM_COLORS.stroke}
                strokeWidth={2}
                strokeMiterlimit={10}
              />
            </G>
          </G>
        </G>
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
