import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#0B1020";
const CARD = "#151D33";
const BLUE = "#3B82F6";
const RED = "#EF4444";
const PURPLE = "#A855F7";
const GREEN = "#22C55E";
const YELLOW = "#EAB308";
const MUTED = "#94A3B8";

// ---------- helpers ----------
const TitleText: React.FC<{children: React.ReactNode; size?: number}> = ({
  children,
  size = 84,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        color: "white",
        textAlign: "center",
        lineHeight: 1.1,
        opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [0, 0.6 * fps], ["0px 30px", "0px 0px"], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </div>
  );
};

const Pill: React.FC<{children: React.ReactNode; color: string}> = ({
  children,
  color,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 28px",
        borderRadius: 999,
        backgroundColor: color,
        color: "white",
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 2,
        opacity: interpolate(frame, [5, 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(frame, [5, 25], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({damping: 200}),
          output: "perceptual-scale",
        }),
      }}
    >
      {children}
    </div>
  );
};

const EquationBadge: React.FC<{
  text: string;
  color: string;
  delay?: number;
}> = ({text, color, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = Math.max(0, frame - delay);
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 54,
        fontWeight: 700,
        color: "white",
        backgroundColor: "#1E293B",
        border: `3px solid ${color}`,
        borderRadius: 18,
        padding: "14px 34px",
        margin: 10,
        opacity: interpolate(local, [0, 0.5 * fps], [0, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        }),
        translate: interpolate(
          local,
          [0, 0.5 * fps],
          ["0px 24px", "0px 0px"],
          {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
      }}
    >
      {text}
    </div>
  );
};

// ---------- Cartesian plot ----------
type LineDef = {a: number; b: number; c: number; color: string; label: string};
// ax + by = c
const X_MIN = -1.5;
const X_MAX = 5.5;
const Y_MIN = -3.5;
const Y_MAX = 4.5;
const PW = 1000;
const PH = 600;

const wx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * PW;
const wy = (y: number) => PH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PH;

function lineEndpoints(a: number, b: number, c: number) {
  // sample two x extremes, compute y; clamp
  const pts: Array<[number, number]> = [];
  for (const x of [X_MIN, X_MAX]) {
    if (Math.abs(b) > 1e-9) {
      const y = (c - a * x) / b;
      pts.push([x, y]);
    }
  }
  if (Math.abs(a) > 1e-9 && Math.abs(b) < 1e-9) {
    const x = c / a;
    pts.push([x, Y_MIN], [x, Y_MAX]);
    return pts;
  }
  return pts;
}

const GridPlot: React.FC<{
  lines: LineDef[];
  drawProgress: number[]; // 0..1 per line
  highlight?: {x: number; y: number; show: boolean; pulse?: boolean};
  extraDots?: Array<{x: number; y: number; label?: string}>;
  thickCoincident?: boolean;
}> = ({lines, drawProgress, highlight, extraDots = [], thickCoincident}) => {
  const frame = useCurrentFrame();
  const gridX: number[] = [];
  for (let x = Math.ceil(X_MIN); x <= X_MAX; x++) gridX.push(x);
  const gridY: number[] = [];
  for (let y = Math.ceil(Y_MIN); y <= Y_MAX; y++) gridY.push(y);

  return (
    <div
      style={{
        backgroundColor: "#0F172A",
        borderRadius: 24,
        border: "2px solid #26314F",
        padding: 18,
      }}
    >
      <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
        {gridX.map((x) => (
          <line
            key={`gx${x}`}
            x1={wx(x)}
            y1={0}
            x2={wx(x)}
            y2={PH}
            stroke="#1E293B"
            strokeWidth={x === 0 ? 3 : 1.5}
          />
        ))}
        {gridY.map((y) => (
          <line
            key={`gy${y}`}
            x1={0}
            y1={wy(y)}
            x2={PW}
            y2={wy(y)}
            stroke="#1E293B"
            strokeWidth={y === 0 ? 3 : 1.5}
          />
        ))}
        {/* axes */}
        <line
          x1={0}
          y1={wy(0)}
          x2={PW}
          y2={wy(0)}
          stroke="#475569"
          strokeWidth={3}
        />
        <line
          x1={wx(0)}
          y1={0}
          x2={wx(0)}
          y2={PH}
          stroke="#475569"
          strokeWidth={3}
        />
        {lines.map((ln, i) => {
          const [p1, p2] = lineEndpoints(ln.a, ln.b, ln.c);
          const x1 = wx(p1[0]);
          const y1 = wy(Math.max(Y_MIN - 1, Math.min(Y_MAX + 1, p1[1])));
          const x2 = wx(p2[0]);
          const y2 = wy(Math.max(Y_MIN - 1, Math.min(Y_MAX + 1, p2[1])));
          const len = Math.hypot(x2 - x1, y2 - y1);
          const prog = drawProgress[i] ?? 1;
          const dashOffset = len * (1 - prog);
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ln.color}
                strokeWidth={thickCoincident ? 10 : 7}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={dashOffset}
                opacity={0.95}
              />
              {prog > 0.9 && (
                <text
                  x={x2 - 10}
                  y={y2 - 14}
                  fill={ln.color}
                  fontSize={30}
                  fontWeight={800}
                  textAnchor="end"
                >
                  {ln.label}
                </text>
              )}
            </g>
          );
        })}
        {extraDots.map((d, i) => (
          <g key={`d${i}`}>
            <circle
              cx={wx(d.x)}
              cy={wy(d.y)}
              r={10}
              fill={GREEN}
              stroke="white"
              strokeWidth={3}
            />
          </g>
        ))}
        {highlight?.show && (
          <g>
            <circle
              cx={wx(highlight.x)}
              cy={wy(highlight.y)}
              r={
                highlight.pulse
                  ? 26 + 8 * Math.sin(frame * 0.25)
                  : 26
              }
              fill="none"
              stroke={YELLOW}
              strokeWidth={5}
            />
            <circle
              cx={wx(highlight.x)}
              cy={wy(highlight.y)}
              r={11}
              fill={YELLOW}
              stroke="white"
              strokeWidth={3}
            />
            <text
              x={wx(highlight.x) + 34}
              y={wy(highlight.y) - 22}
              fill="white"
              fontSize={32}
              fontWeight={800}
              stroke="#0B1020"
              strokeWidth={6}
              paintOrder="stroke"
            >
              ({highlight.x}, {highlight.y})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------- Vector plot ----------
const VectorPlot: React.FC<{
  v1: [number, number];
  v2: [number, number];
  target: [number, number];
  showCombination?: boolean;
  comboProgress?: number; // 0..1
  xv?: number;
  yv?: number;
}> = ({v1, v2, target, showCombination, comboProgress = 1, xv = 2, yv = 1}) => {
  const W = 1000;
  const H = 560;
  const S = 85; // px per unit
  const ox = W / 2 - 60;
  const oy = H / 2 + 20;
  const px = (x: number) => ox + x * S;
  const py = (y: number) => oy - y * S;

  const Arrow: React.FC<{
    from: [number, number];
    to: [number, number];
    color: string;
    width?: number;
    dashed?: boolean;
    label?: string;
  }> = ({from, to, color, width = 6, dashed, label}) => {
    const x1 = px(from[0]);
    const y1 = py(from[1]);
    const x2 = px(to[0]);
    const y2 = py(to[1]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const hx = 18;
    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={dashed ? "12 10" : undefined}
        />
        <polygon
          points={`0,0 ${-hx},8 ${-hx},-8`}
          fill={color}
          transform={`translate(${x2},${y2}) rotate(${(ang * 180) / Math.PI})`}
        />
        {label && (
          <text
            x={(x1 + x2) / 2 + 14}
            y={(y1 + y2) / 2 - 10}
            fill={color}
            fontSize={26}
            fontWeight={800}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  // combination: xv*v1 then yv*v2 head-to-tail
  const mid: [number, number] = [
    xv * v1[0] * comboProgress,
    xv * v1[1] * comboProgress,
  ];
  const end: [number, number] =
    comboProgress < 0.5
      ? mid
      : [
          xv * v1[0] + yv * v2[0] * (comboProgress - 0.5) * 2,
          xv * v1[1] + yv * v2[1] * (comboProgress - 0.5) * 2,
        ];

  return (
    <div
      style={{
        backgroundColor: "#0F172A",
        borderRadius: 24,
        border: "2px solid #26314F",
        padding: 12,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* grid */}
        {Array.from({length: 13}, (_, i) => i - 6).map((gx) => (
          <line
            key={`vx${gx}`}
            x1={px(gx)}
            y1={0}
            x2={px(gx)}
            y2={H}
            stroke="#1E293B"
            strokeWidth={1.2}
          />
        ))}
        {Array.from({length: 11}, (_, i) => i - 5).map((gy) => (
          <line
            key={`vy${gy}`}
            x1={0}
            y1={py(gy)}
            x2={W}
            y2={py(gy)}
            stroke="#1E293B"
            strokeWidth={1.2}
          />
        ))}
        <line x1={0} y1={py(0)} x2={W} y2={py(0)} stroke="#475569" strokeWidth={2.5} />
        <line x1={px(0)} y1={0} x2={px(0)} y2={H} stroke="#475569" strokeWidth={2.5} />

        {/* base vectors */}
        <Arrow from={[0, 0]} to={v1} color={BLUE} label={`v1 (${v1[0]},${v1[1]})`} />
        <Arrow from={[0, 0]} to={v2} color={RED} label={`v2 (${v2[0]},${v2[1]})`} />

        {/* target flag */}
        <g>
          <line
            x1={px(target[0])}
            y1={py(target[1])}
            x2={px(target[0])}
            y2={py(target[1]) - 46}
            stroke={YELLOW}
            strokeWidth={5}
          />
          <polygon
            points={`0,0 44,12 0,24`}
            fill={YELLOW}
            transform={`translate(${px(target[0])},${py(target[1]) - 70})`}
          />
          <circle
            cx={px(target[0])}
            cy={py(target[1])}
            r={13}
            fill="none"
            stroke={YELLOW}
            strokeWidth={4}
          />
          <text
            x={px(target[0]) + 18}
            y={py(target[1]) + 44}
            fill={YELLOW}
            fontSize={28}
            fontWeight={800}
          >
            target ({target[0]},{target[1]})
          </text>
        </g>

        {showCombination && (
          <>
            <Arrow from={[0, 0]} to={mid} color={BLUE} width={9} />
            <Arrow from={mid} to={end} color={RED} width={9} />
            {comboProgress > 0.92 && (
              <circle
                cx={px(end[0])}
                cy={py(end[1])}
                r={16}
                fill={GREEN}
                stroke="white"
                strokeWidth={4}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
};

// ---------- Scenes ----------
const SceneShell: React.FC<{children: React.ReactNode; label?: string}> = ({
  children,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: BG,
      padding: 70,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 22,
      fontFamily: "Inter, system-ui, sans-serif",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const LinearSystems: React.FC = () => {
  const frame = useCurrentFrame();

  // draw progresses computed from global frame
  const p = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      {/* 0 Title */}
      <Sequence from={0} durationInFrames={150} name="Title">
        <SceneShell>
          <Pill color={BLUE}>LINEAR ALGEBRA • INTUITION</Pill>
          <TitleText size={88}>
            Systems of Linear Equations
          </TitleText>
          <div style={{fontSize: 46, color: GREEN, fontWeight: 700}}>
            Geometric &amp; Vector Meaning
          </div>
          <div style={{fontSize: 28, color: MUTED, marginTop: 12}}>
            What does it mean to “solve” — and what can go wrong?
          </div>
        </SceneShell>
      </Sequence>

      {/* 1 Intro equations */}
      <Sequence from={150} durationInFrames={180} name="IntroEquations">
        <SceneShell>
          <div style={{fontSize: 38, color: "white", fontWeight: 600, textAlign: "center", maxWidth: 1400}}>
            Solving means finding x and y that make{" "}
            <span style={{color: YELLOW}}>BOTH</span> equations true at once
          </div>
          <div style={{display: "flex"}}>
            <EquationBadge text="x + 2y = 4" color={BLUE} delay={150} />
            <EquationBadge text="x − y = 1" color={RED} delay={165} />
          </div>
        </SceneShell>
      </Sequence>

      {/* 2 Grid + L1 */}
      <Sequence from={330} durationInFrames={180} name="GridL1">
        <SceneShell>
          <div style={{fontSize: 40, color: "white", fontWeight: 700}}>
            Each equation is just… a <span style={{color: BLUE}}>straight line</span>
          </div>
          <GridPlot
            lines={[{a: 1, b: 2, c: 4, color: BLUE, label: "L1: x+2y=4"}]}
            drawProgress={[p(350, 450)]}
          />
        </SceneShell>
      </Sequence>

      {/* 3 L2 + intersection */}
      <Sequence from={510} durationInFrames={240} name="L2Intersect">
        <SceneShell>
          <div style={{fontSize: 36, color: "white", fontWeight: 600}}>
            Add the second line — where do <span style={{color: YELLOW}}>BOTH agree?</span>
          </div>
          <GridPlot
            lines={[
              {a: 1, b: 2, c: 4, color: BLUE, label: "L1"},
              {a: 1, b: -1, c: 1, color: RED, label: "L2: x−y=1"},
            ]}
            drawProgress={[1, p(530, 620)]}
            highlight={{
              x: 2,
              y: 1,
              show: frame > 630,
              pulse: true,
            }}
          />
          {frame > 660 && (
            <div
              style={{
                fontSize: 44,
                color: "white",
                fontWeight: 800,
                backgroundColor: "#14532D",
                border: `3px solid ${GREEN}`,
                padding: "10px 36px",
                borderRadius: 16,
                opacity: interpolate(frame, [660, 680], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Solution: x = 2, y = 1
            </div>
          )}
        </SceneShell>
      </Sequence>

      {/* 4 UNIQUE */}
      <Sequence from={750} durationInFrames={120} name="UniqueCard">
        <SceneShell>
          <Pill color={GREEN}>ONE CROSSING POINT</Pill>
          <TitleText>UNIQUE SOLUTION</TitleText>
          <div style={{fontSize: 34, color: MUTED}}>Two lines meet at exactly one point</div>
        </SceneShell>
      </Sequence>

      {/* 5 Parallel */}
      <Sequence from={870} durationInFrames={240} name="Parallel">
        <SceneShell>
          <div style={{display: "flex"}}>
            <EquationBadge text="x − y = 1" color={BLUE} delay={870} />
            <EquationBadge text="−x + y = 2" color={RED} delay={885} />
          </div>
          <div style={{fontSize: 34, color: "white"}}>
            Same tilt… <span style={{color: RED}}>parallel</span>
          </div>
          <GridPlot
            lines={[
              {a: 1, b: -1, c: 1, color: BLUE, label: "L1"},
              {a: -1, b: 1, c: 2, color: RED, label: "L2"},
            ]}
            drawProgress={[p(920, 1000), p(970, 1050)]}
          />
        </SceneShell>
      </Sequence>

      {/* 6 NEVER + NO */}
      <Sequence from={1110} durationInFrames={150} name="NoSolution">
        <SceneShell>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "white",
              backgroundColor: "#7F1D1D",
              padding: "12px 30px",
              borderRadius: 14,
              border: `3px solid ${RED}`,
              opacity: interpolate(frame, [1110, 1130], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            NEVER MEETS — the gap never closes
          </div>
          <GridPlot
            lines={[
              {a: 1, b: -1, c: 1, color: BLUE, label: "L1"},
              {a: -1, b: 1, c: 2, color: RED, label: "L2"},
            ]}
            drawProgress={[1, 1]}
          />
          <TitleText size={76}>NO SOLUTION</TitleText>
        </SceneShell>
      </Sequence>

      {/* 7 Train tracks */}
      <Sequence from={1260} durationInFrames={150} name="Tracks">
        <SceneShell>
          <div style={{fontSize: 90}}>🛤️</div>
          <TitleText size={62}>Like train tracks side-by-side</TitleText>
          <div style={{fontSize: 32, color: MUTED, textAlign: "center", maxWidth: 1300}}>
            A train on one track can never end up on the other — no point satisfies both
          </div>
        </SceneShell>
      </Sequence>

      {/* 8 Coincident morph */}
      <Sequence from={1410} durationInFrames={210} name="Coincident">
        <SceneShell>
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            <EquationBadge text="x − y = 2" color={BLUE} delay={1410} />
            <EquationBadge text="−x + y = −2  ×(−1) → x−y=2" color={PURPLE} delay={1450} />
          </div>
          <div style={{fontSize: 36, color: "white", fontWeight: 700}}>
            Same line in <span style={{color: PURPLE}}>disguise</span> — they lie on top of each other
          </div>
          <GridPlot
            lines={[
              {a: 1, b: -1, c: 2, color: BLUE, label: ""},
              {a: -1, b: 1, c: -2, color: PURPLE, label: "L1 = L2"},
            ]}
            drawProgress={[p(1450, 1530), p(1500, 1580)]}
            thickCoincident={frame > 1560}
          />
        </SceneShell>
      </Sequence>

      {/* 9 Infinite points */}
      <Sequence from={1620} durationInFrames={210} name="InfinitePts">
        <SceneShell>
          <div style={{fontSize: 38, color: "white", fontWeight: 700}}>
            <span style={{color: GREEN}}>This works! This works too! And this!</span>
          </div>
          <GridPlot
            lines={[{a: 1, b: -1, c: 2, color: PURPLE, label: "every point works"}]}
            drawProgress={[1]}
            extraDots={
              frame > 1650
                ? [
                    {x: 0, y: -2},
                    ...(frame > 1690 ? [{x: 2, y: 0}] : []),
                    ...(frame > 1730 ? [{x: 3, y: 1}] : []),
                    ...(frame > 1770 ? [{x: 4, y: 2}] : []),
                  ]
                : []
            }
            thickCoincident
          />
          <div style={{fontSize: 32, color: MUTED}}>
            EVERY point on the line satisfies both equations
          </div>
        </SceneShell>
      </Sequence>

      {/* 10 INFINITE card */}
      <Sequence from={1830} durationInFrames={90} name="InfiniteCard">
        <SceneShell>
          <Pill color={PURPLE}>OVERLAPPING LINES</Pill>
          <TitleText size={72}>INFINITELY MANY SOLUTIONS</TitleText>
        </SceneShell>
      </Sequence>

      {/* 11 3-panel summary */}
      <Sequence from={1920} durationInFrames={240} name="Summary3">
        <SceneShell>
          <TitleText size={58}>Two lines can only do 3 things</TitleText>
          <div style={{display: "flex", gap: 26}}>
            {[
              {t: "Unique", d: "cross once", c: GREEN, e: "✕", eq: "(2,1)"},
              {t: "No solution", d: "parallel", c: RED, e: "∥", eq: "never meets"},
              {t: "Infinite", d: "coincident", c: PURPLE, e: "≡", eq: "same line"},
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  width: 520,
                  backgroundColor: CARD,
                  border: `4px solid ${card.c}`,
                  borderRadius: 24,
                  padding: 30,
                  textAlign: "center",
                  opacity: interpolate(
                    frame,
                    [1920 + i * 30, 1950 + i * 30],
                    [0, 1],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  ),
                  scale: interpolate(
                    frame,
                    [1920 + i * 30, 1950 + i * 30],
                    [0.85, 1],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.spring({damping: 200}),
                      output: "perceptual-scale",
                    },
                  ),
                }}
              >
                <div style={{fontSize: 90, color: card.c}}>{card.e}</div>
                <div style={{fontSize: 42, fontWeight: 800, color: "white"}}>{card.t}</div>
                <div style={{fontSize: 30, color: MUTED}}>{card.d}</div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 30,
                    fontWeight: 700,
                    color: card.c,
                  }}
                >
                  {card.eq}
                </div>
              </div>
            ))}
          </div>
        </SceneShell>
      </Sequence>

      {/* 12 Vectors intro */}
      <Sequence from={2160} durationInFrames={180} name="VectorIntro">
        <SceneShell>
          <Pill color={YELLOW}>ANOTHER LENS: VECTORS ➶</Pill>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 56,
              fontWeight: 800,
              color: "white",
              backgroundColor: "#1E293B",
              padding: "16px 36px",
              borderRadius: 18,
              border: `3px solid ${YELLOW}`,
            }}
          >
            x(1,1) + y(2,−1) = (4,1)
          </div>
          <div style={{fontSize: 32, color: MUTED, textAlign: "center", maxWidth: 1400}}>
            x times one arrow + y times another arrow must land on the target arrow
          </div>
        </SceneShell>
      </Sequence>

      {/* 13 Vector unique */}
      <Sequence from={2340} durationInFrames={270} name="VectorUnique">
        <SceneShell>
          <div style={{fontSize: 36, color: "white", fontWeight: 700}}>
            Two ropes, different directions 🪢 → <span style={{color: GREEN}}>one way</span> to hit the flag 🚩
          </div>
          <VectorPlot
            v1={[1, 1]}
            v2={[2, -1]}
            target={[4, 1]}
            showCombination={frame > 2420}
            comboProgress={p(2430, 2560)}
          />
          {frame > 2570 && (
            <div style={{fontSize: 36, fontWeight: 800, color: GREEN}}>
              Stretch ×2, then ×1 — lands exactly! Unique again.
            </div>
          )}
        </SceneShell>
      </Sequence>

      {/* 14 Vector parallel no */}
      <Sequence from={2610} durationInFrames={150} name="VectorNo">
        <SceneShell>
          <div style={{fontSize: 38, color: "white", fontWeight: 700}}>
            Same-direction ropes — flag <span style={{color: RED}}>off the line</span> = unreachable
          </div>
          <VectorPlot v1={[1, 1]} v2={[2, 2]} target={[4, 1]} />
          <Pill color={RED}>NO SOLUTION</Pill>
        </SceneShell>
      </Sequence>

      {/* 15 Vector parallel infinite */}
      <Sequence from={2760} durationInFrames={120} name="VectorInf">
        <SceneShell>
          <div style={{fontSize: 38, color: "white", fontWeight: 700}}>
            Flag <span style={{color: PURPLE}}>ON</span> the line — countless pulls land on it
          </div>
          <VectorPlot v1={[1, 1]} v2={[2, 2]} target={[3, 3]} />
          <Pill color={PURPLE}>INFINITELY MANY</Pill>
        </SceneShell>
      </Sequence>

      {/* 16 Closing */}
      <Sequence from={2880} durationInFrames={240} name="Closing">
        <SceneShell>
          <TitleText size={56}>One system → 3 buckets</TitleText>
          <div style={{display: "flex", gap: 20}}>
            <div style={{flex: 1, backgroundColor: CARD, borderRadius: 20, padding: 26, border: "2px solid #334155"}}>
              <div style={{fontSize: 30, fontWeight: 800, color: BLUE}}>LINES lens</div>
              <div style={{fontSize: 28, color: "white", marginTop: 10}}>✕ cross → one<br/>∥ parallel → none<br/>≡ overlap → infinite</div>
            </div>
            <div style={{flex: 1, backgroundColor: CARD, borderRadius: 20, padding: 26, border: "2px solid #334155"}}>
              <div style={{fontSize: 30, fontWeight: 800, color: YELLOW}}>VECTORS lens</div>
              <div style={{fontSize: 28, color: "white", marginTop: 10}}>reach flag 1 way → one<br/>flag off-line → none<br/>flag on-line → infinite</div>
            </div>
          </div>
          <div style={{fontSize: 30, color: GREEN, fontWeight: 700, textAlign: "center", maxWidth: 1500}}>
            This intuition is the foundation for RANK — an exact test for which case you’re in.
          </div>
        </SceneShell>
      </Sequence>

      {/* 17 End card */}
      <Sequence from={3120} durationInFrames={150} name="EndCard">
        <SceneShell>
          <Pill color={BLUE}>NEXT UP</Pill>
          <TitleText>Rank of a Matrix</TitleText>
          <div style={{fontSize: 32, color: MUTED}}>See you in the next one.</div>
        </SceneShell>
      </Sequence>
    </AbsoluteFill>
  );
};
