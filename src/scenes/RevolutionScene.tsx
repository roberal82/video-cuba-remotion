// Escena 2 — 390 frames (13s) — 0:08–0:21
// Visual: Sierra Maestra, Fidel y Che avanzando
// Texto: "1959 – El triunfo de la Revolución"
// Narración: "En 1959, la Revolución transformó Cuba en un símbolo global."
// Transición: humo + fade cinematográfico

import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const RevolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns inverso: zoom out dramático
  const scale = interpolate(frame, [0, 390], [1.2, 1.0], {
    extrapolateRight: "clamp",
  });

  // Pan horizontal lento (de derecha a izquierda)
  const translateX = interpolate(frame, [0, 390], [2, -2], {
    extrapolateRight: "clamp",
  });

  // Fade in/out crossfade
  const sceneOpacity = interpolate(frame, [0, 20, 370, 390], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Año "1959" — entrada con spring
  const yearSpring = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const yearOpacity = interpolate(frame, [20, 50, 340, 375], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yearScale = interpolate(yearSpring, [0, 1], [0.7, 1.0]);

  // Subtítulo — aparece después del año
  const subtitleOpacity = interpolate(frame, [70, 110, 340, 375], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Línea dorada
  const lineWidth = interpolate(frame, [90, 140], [0, 340], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Narración
  const narrationOpacity = interpolate(frame, [110, 150, 340, 375], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="scene-container">
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        {/* Fondo: guerrilla Sierra Maestra */}
        <Img
          src={staticFile("revolution.png")}
          className="bg-image"
          style={{
            transform: `scale(${scale}) translateX(${translateX}%)`,
            filter: "grayscale(80%) contrast(1.25) brightness(0.85)",
          }}
        />

        {/* Overlay con viñeta lateral */}
        <div
          className="overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(20,5,0,0.1) 50%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Año + Título centrados */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Año grande */}
          <div style={{ opacity: yearOpacity, transform: `scale(${yearScale})` }}>
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 130,
                fontWeight: 900,
                color: "#d4a030",
                textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 0 80px rgba(200,120,0,0.5)",
                letterSpacing: 6,
                margin: 0,
                lineHeight: 1,
              }}
            >
              1959
            </h1>
          </div>

          {/* Línea dorada */}
          <div
            style={{
              height: 2,
              width: lineWidth,
              background:
                "linear-gradient(90deg, transparent, rgba(200,160,80,0.9), transparent)",
              margin: "18px 0",
            }}
          />

          {/* Subtítulo */}
          <div style={{ opacity: subtitleOpacity }}>
            <h2
              className="subtitle"
              style={{
                fontSize: 54,
                color: "#f0f0f0",
                letterSpacing: 3,
              }}
            >
              EL TRIUNFO DE LA REVOLUCIÓN
            </h2>
          </div>
        </AbsoluteFill>

        {/* Narración */}
        <AbsoluteFill style={{ opacity: narrationOpacity }}>
          <p className="narration">
            "En 1959, la Revolución transformó Cuba en un símbolo global."
          </p>
        </AbsoluteFill>
      </AbsoluteFill>
    </div>
  );
};
