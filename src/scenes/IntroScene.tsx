// Escena 1 — 270 frames (9s) — 0:00–0:09
// Visual: Mapa del Caribe con Cuba, zoom lento épico
// Texto: "CUBA: REVOLUCIÓN, HISTORIA Y CRISIS ACTUAL"
// Narración: "En el corazón del Caribe, una isla marcó el rumbo de la historia."

import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns: zoom lento de 1.0 → 1.18
  const scale = interpolate(frame, [0, 270], [1.0, 1.18], {
    extrapolateRight: "clamp",
  });

  // Fade in/out de la escena completa (crossfade con escena anterior/siguiente)
  const sceneOpacity = interpolate(frame, [0, 20, 250, 270], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Título principal — aparece centrado
  const titleOpacity = interpolate(frame, [25, 60, 220, 255], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [25, 70], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Línea decorativa debajo del título
  const lineWidth = interpolate(frame, [60, 110], [0, 480], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Narración
  const narrationOpacity = interpolate(frame, [80, 120, 220, 255], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="scene-container">
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        {/* Fondo: mapa del Caribe */}
        <Img
          src={staticFile("map.png")}
          className="bg-image"
          style={{ transform: `scale(${scale})`, transformOrigin: "55% 48%" }}
        />

        {/* Overlay cinematográfico */}
        <div
          className="overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,10,0.1) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Título centrado */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 0,
            opacity: titleOpacity,
          }}
        >
          <h1
            className="title"
            style={{
              fontSize: 88,
              maxWidth: "85%",
              lineHeight: 1.15,
              transform: `scale(${titleScale})`,
              color: "#f0f0f0",
              textShadow:
                "0 4px 20px rgba(0,0,0,0.9), 0 0 60px rgba(180,30,30,0.4)",
            }}
          >
            CUBA: REVOLUCIÓN,
            <br />
            HISTORIA Y CRISIS ACTUAL
          </h1>

          {/* Línea dorada animada */}
          <div
            style={{
              height: 2,
              width: lineWidth,
              background:
                "linear-gradient(90deg, transparent, rgba(200,160,80,0.9), transparent)",
              marginTop: 28,
            }}
          />
        </AbsoluteFill>

        {/* Narración (voice-over visible) */}
        <AbsoluteFill style={{ opacity: narrationOpacity }}>
          <p className="narration">
            "En el corazón del Caribe, una isla marcó el rumbo de la historia."
          </p>
        </AbsoluteFill>
      </AbsoluteFill>
    </div>
  );
};
