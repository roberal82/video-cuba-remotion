// Escena 4 — 480 frames (16s) — 0:35–0:51
// Visual: Retratos dramáticos de líderes — dos slides
//   Slide A (0-250): Fidel Castro + Che Guevara  → "EL LIDERAZGO REVOLUCIONARIO"
//   Slide B (220-480): Chávez, Maduro, Trump      → "LOS ACTORES CONTEMPORÁNEOS"
// Narración: "Líderes, ideologías y conflictos moldearon su destino."

import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// ─────────────────────────────────────────────
// Sub-componente: cada slide de líderes
// ─────────────────────────────────────────────
const LeaderSlide: React.FC<{
  image: string;
  sectionLabel: string;
  title: string;
  names: string[];
  totalFrames: number;
}> = ({ image, sectionLabel, title, names, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, totalFrames], [1.0, 1.15], {
    extrapolateRight: "clamp",
  });

  const sceneOpacity = interpolate(frame, [0, 20, totalFrames - 20, totalFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSpring = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [30, 70, totalFrames - 25, totalFrames - 5], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <Img
        src={staticFile(image)}
        className="bg-image"
        style={{
          transform: `scale(${scale})`,
          filter: "contrast(1.15) brightness(0.8)",
        }}
      />

      {/* Overlay degradado lateral + inferior */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.95) 100%)",
          zIndex: 5,
        }}
      />

      {/* Etiqueta superior */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 60,
          flexDirection: "column",
          opacity: labelOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "rgba(180, 20, 20, 0.85)",
            padding: "6px 30px",
          }}
        >
          <span
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            {sectionLabel}
          </span>
        </div>
      </AbsoluteFill>

      {/* Título + nombres (parte inferior) */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          flexDirection: "column",
          paddingBottom: 80,
          zIndex: 10,
          opacity: titleOpacity,
        }}
      >
        <h2
          className="subtitle"
          style={{
            fontSize: 52,
            color: "#f0f0f0",
            letterSpacing: 3,
            marginBottom: 18,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {title}
        </h2>

        {/* Línea dorada */}
        <div
          style={{
            height: 1,
            width: 300,
            background: "linear-gradient(90deg, transparent, rgba(200,160,80,0.8), transparent)",
            marginBottom: 16,
          }}
        />

        {/* Nombres de los líderes */}
        <div style={{ textAlign: "center" }}>
          {names.map((name, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 28,
                color: "rgba(220,200,150,0.95)",
                margin: "4px 0",
                letterSpacing: 2,
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {name}
            </p>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// Escena principal
// ─────────────────────────────────────────────
export const KeyActorsScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Narración — aparece en la segunda mitad
  const narrationOpacity = interpolate(frame, [260, 300, 440, 475], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Título "Actores que moldearon su destino" — overlay durante el crossfade entre slides
  const bridgeTitleOpacity = interpolate(frame, [195, 225, 250, 275], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="scene-container">
      {/* Slide A: Fidel + Che (frames 0-260) */}
      <Sequence from={0} durationInFrames={260}>
        <LeaderSlide
          image="fidel_che.png"
          sectionLabel="Liderazgo · 1959–2008"
          title="EL LIDERAZGO REVOLUCIONARIO"
          names={["Fidel Castro", "Ernesto 'Che' Guevara"]}
          totalFrames={260}
        />
      </Sequence>

      {/* Slide B: Modernos (frames 220-480) — overlap 40f para crossfade */}
      <Sequence from={220} durationInFrames={260}>
        <LeaderSlide
          image="modern_leaders.png"
          sectionLabel="Actores contemporáneos"
          title="LOS ACTORES CONTEMPORÁNEOS"
          names={["Hugo Chávez", "Nicolás Maduro", "Donald Trump"]}
          totalFrames={260}
        />
      </Sequence>

      {/* Título puente durante el crossfade */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: bridgeTitleOpacity,
          zIndex: 30,
        }}
      >
        <h2
          className="subtitle"
          style={{
            fontSize: 46,
            color: "#fff",
            background: "rgba(0,0,0,0.6)",
            padding: "14px 40px",
            letterSpacing: 3,
          }}
        >
          ACTORES QUE MOLDEARON SU DESTINO
        </h2>
      </AbsoluteFill>

      {/* Narración */}
      <AbsoluteFill style={{ opacity: narrationOpacity, zIndex: 25 }}>
        <p className="narration">
          "Líderes, ideologías y conflictos moldearon su destino."
        </p>
      </AbsoluteFill>
    </div>
  );
};
