// Escena 6 — 300 frames (10s) — 1:05–1:15
// Visual: Mapa Cuba nuevamente, fade a negro
// Texto: "¿Cuál es el futuro estratégico de Cuba?"
// Presentadores: Mayor Benítez / Mayor Núñez
// Narración: "Cuba… entre la historia, el poder y la incertidumbre."

import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom lento de salida
  const scale = interpolate(frame, [0, 300], [1.15, 1.0], {
    extrapolateRight: "clamp",
  });

  // Fade in general
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade a negro total al final
  const blackFade = interpolate(frame, [240, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pregunta estratégica
  const questionSpring = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const questionOpacity = interpolate(frame, [20, 60, 210, 245], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const questionScale = interpolate(questionSpring, [0, 1], [0.88, 1.0]);

  // Narración
  const narrationOpacity = interpolate(frame, [60, 100, 200, 235], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Línea dorada
  const lineWidth = interpolate(frame, [70, 120], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bloque de presentadores
  const presentersOpacity = interpolate(frame, [130, 175, 210, 245], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="scene-container">
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        {/* Mapa de fondo muy desaturado */}
        <Img
          src={staticFile("map.png")}
          className="bg-image"
          style={{
            transform: `scale(${scale})`,
            filter: "grayscale(90%) brightness(0.35)",
          }}
        />

        {/* Overlay negro profundo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)",
            zIndex: 5,
          }}
        />

        {/* Pregunta + línea dorada + presentadores */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 0,
            zIndex: 10,
          }}
        >
          {/* Pregunta estratégica */}
          <div
            style={{
              opacity: questionOpacity,
              transform: `scale(${questionScale})`,
              textAlign: "center",
            }}
          >
            <h1
              className="title"
              style={{
                fontSize: 72,
                color: "#e8e8e8",
                maxWidth: "80%",
                margin: "0 auto",
                lineHeight: 1.25,
                textShadow: "0 4px 20px rgba(0,0,0,0.9), 0 0 60px rgba(200,160,80,0.3)",
              }}
            >
              ¿CUÁL ES EL FUTURO
              <br />
              ESTRATÉGICO DE CUBA?
            </h1>
          </div>

          {/* Línea dorada animada */}
          <div
            style={{
              height: 2,
              width: lineWidth,
              background:
                "linear-gradient(90deg, transparent, rgba(200,160,80,0.9), transparent)",
              margin: "32px 0 28px",
            }}
          />

          {/* Bloque presentadores */}
          <div style={{ opacity: presentersOpacity }}>
            <div className="presenters-block">
              <p className="presenters-label">Exponen</p>
              <div className="gold-line" />
              <p className="presenter-name">
                Mayor de Comunicaciones Robert Benítez
              </p>
              <p className="presenter-name">
                Mayor de Artillería Fredy Núñez
              </p>
            </div>
          </div>
        </AbsoluteFill>

        {/* Narración */}
        <AbsoluteFill style={{ opacity: narrationOpacity, zIndex: 15 }}>
          <p className="narration">
            "Cuba… entre la historia, el poder y la incertidumbre."
          </p>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Fade a negro final */}
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          opacity: blackFade,
          zIndex: 50,
        }}
      />
    </div>
  );
};
