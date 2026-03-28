// Escena 3 — 480 frames (16s) — 0:20–0:36
// Visual: Archivos Guerra Fría — misiles, mapas estratégicos, tensión EE.UU.–URSS
// Texto: "Cuba: epicentro del conflicto global"
// Narración: "Durante la Guerra Fría, fue epicentro de tensiones entre potencias."

import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const ColdWarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Movimiento vertical ascendente (tilt up)
  const translateY = interpolate(frame, [0, 480], [3, -3], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 480], [1.1, 1.22], {
    extrapolateRight: "clamp",
  });

  // Fade in/out
  const sceneOpacity = interpolate(frame, [0, 20, 460, 480], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Título principal
  const titleOpacity = interpolate(frame, [30, 70, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleTranslateY = interpolate(frame, [30, 80], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtítulo
  const subtitleOpacity = interpolate(frame, [80, 120, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Indicadores laterales (misiles/íconos de tensión)
  const badgeOpacity = interpolate(frame, [120, 160, 400, 440], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Narración
  const narrationOpacity = interpolate(frame, [140, 180, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="scene-container">
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        {/* Fondo: imágenes archivo Guerra Fría */}
        <Img
          src={staticFile("cold_war.png")}
          className="bg-image"
          style={{
            transform: `scale(${scale}) translateY(${translateY}%)`,
            filter: "sepia(40%) contrast(1.3) brightness(0.75)",
          }}
        />

        {/* Overlay rojo-oscuro: tensión */}
        <div
          className="overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(40,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Contenido central */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Etiqueta: GUERRA FRÍA */}
          <div
            style={{
              opacity: badgeOpacity,
              background: "rgba(180, 20, 20, 0.85)",
              padding: "8px 32px",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 5,
                textTransform: "uppercase",
              }}
            >
              1962 — Crisis de los Misiles
            </span>
          </div>

          {/* Título */}
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleTranslateY}px)`,
            }}
          >
            <h1
              className="title"
              style={{
                fontSize: 78,
                color: "#f0f0f0",
                textShadow: "0 4px 20px rgba(0,0,0,0.95), 0 0 60px rgba(180,20,20,0.5)",
                maxWidth: "80%",
                textAlign: "center",
                margin: "0 auto",
                lineHeight: 1.2,
              }}
            >
              CUBA: EPICENTRO
              <br />
              DEL CONFLICTO GLOBAL
            </h1>
          </div>

          {/* Subtítulo */}
          <div style={{ opacity: subtitleOpacity, marginTop: 10 }}>
            <p
              className="subtitle"
              style={{
                color: "#ff6060",
                fontSize: 36,
                letterSpacing: 2,
              }}
            >
              EE.UU. · URSS · CUBA — Al borde de la guerra nuclear
            </p>
          </div>
        </AbsoluteFill>

        {/* Narración */}
        <AbsoluteFill style={{ opacity: narrationOpacity }}>
          <p className="narration">
            "Durante la Guerra Fría, fue epicentro de tensiones entre potencias."
          </p>
        </AbsoluteFill>
      </AbsoluteFill>
    </div>
  );
};
