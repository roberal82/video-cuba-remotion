// Escena 5 — 480 frames (16s) — 0:50–1:06
// Visual: Crisis actual — apagones, protestas, deterioro urbano en La Habana
// Texto: "Crisis económica y social"
// Narración: "Hoy, enfrenta una crisis profunda que redefine su papel en el sistema internacional."

import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const CurrentCrisisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom lento dramático
  const scale = interpolate(frame, [0, 480], [1.05, 1.2], {
    extrapolateRight: "clamp",
  });

  // Efecto micro-shake (inestabilidad) — aumenta con el tiempo
  const shakeIntensity = interpolate(frame, [0, 240, 480], [0, 1, 2.5], {
    extrapolateRight: "clamp",
  });
  const shakeX = interpolate(random(`sx-${frame}`), [0, 1], [-1, 1]) * shakeIntensity;
  const shakeY = interpolate(random(`sy-${frame}`), [0, 1], [-1, 1]) * shakeIntensity;

  // Parpadeo ocasional (simula corte de luz)
  const flicker = frame % 47 < 2 ? 0.7 : 1.0;

  // Fade in/out
  const sceneOpacity = interpolate(frame, [0, 20, 460, 480], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Título
  const titleOpacity = interpolate(frame, [30, 70, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleTranslateY = interpolate(frame, [30, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtítulo / datos
  const subtitleOpacity = interpolate(frame, [90, 130, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Indicadores de crisis
  const statsOpacity = interpolate(frame, [150, 200, 400, 440], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Narración
  const narrationOpacity = interpolate(frame, [180, 220, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const crisisStats = [
    { label: "Inflación", value: "> 500%" },
    { label: "Éxodo", value: "700k+ emigrantes" },
    { label: "Energía", value: "Apagones 12h/día" },
  ];

  return (
    <div className="scene-container">
      <AbsoluteFill style={{ opacity: sceneOpacity * flicker }}>
        {/* Fondo: La Habana en crisis */}
        <Img
          src={staticFile("crisis.png")}
          className="bg-image"
          style={{
            transform: `scale(${scale}) translate(${shakeX}px, ${shakeY}px)`,
            filter: "saturate(0.35) contrast(1.4) brightness(0.7)",
          }}
        />

        {/* Overlay oscuro azul-negro */}
        <div
          className="overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,20,0.85) 0%, rgba(0,0,10,0.2) 50%, rgba(0,0,0,0.95) 100%)",
          }}
        />

        {/* Título y subtítulo */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ opacity: titleOpacity, transform: `translateY(${titleTranslateY}px)` }}>
            <h1
              className="title"
              style={{
                fontSize: 80,
                color: "#cccccc",
                textShadow: "0 4px 20px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.8)",
              }}
            >
              CRISIS ECONÓMICA Y SOCIAL
            </h1>
          </div>

          <div style={{ opacity: subtitleOpacity }}>
            <p
              className="subtitle"
              style={{
                fontSize: 34,
                color: "#aaaaaa",
                letterSpacing: 2,
              }}
            >
              Cuba enfrenta su peor crisis desde 1959
            </p>
          </div>

          {/* Indicadores */}
          <div
            style={{
              opacity: statsOpacity,
              display: "flex",
              gap: 40,
              marginTop: 20,
            }}
          >
            {crisisStats.map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "12px 28px",
                  borderLeft: "2px solid rgba(150,150,150,0.4)",
                  borderRight: "2px solid rgba(150,150,150,0.4)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#e0e0e0",
                    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 18,
                    color: "rgba(180,180,180,0.8)",
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </AbsoluteFill>

        {/* Narración */}
        <AbsoluteFill style={{ opacity: narrationOpacity }}>
          <p className="narration">
            "Hoy, enfrenta una crisis profunda que redefine su papel en el sistema internacional."
          </p>
        </AbsoluteFill>
      </AbsoluteFill>
    </div>
  );
};
