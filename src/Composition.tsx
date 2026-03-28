import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { RevolutionScene } from "./scenes/RevolutionScene";
import { ColdWarScene } from "./scenes/ColdWarScene";
import { KeyActorsScene } from "./scenes/KeyActorsScene";
import { CurrentCrisisScene } from "./scenes/CurrentCrisisScene";
import { FinalScene } from "./scenes/FinalScene";

// Timing (30fps) — scenes overlap 30 frames for crossfade:
// Scene 1 IntroScene:       0   → 270   (9s)
// Scene 2 RevolutionScene:  240 → 630   (8–21s)
// Scene 3 ColdWarScene:     600 → 1080  (20–36s)
// Scene 4 KeyActorsScene:   1050→ 1530  (35–51s)
// Scene 5 CurrentCrisisScene:1500→1980  (50–66s)
// Scene 6 FinalScene:       1950→ 2250  (65–75s)
// Total composition: 2250 frames = 75s

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/*
        BANDA SONORA ÉPICA (Hans Zimmer style):
        Coloca tu archivo "audio_epico.mp3" en la carpeta public/
        y descomenta la línea de abajo.
      */}
      {/* <Audio src={staticFile("audio_epico.mp3")} volume={0.7} /> */}

      <Sequence from={0} durationInFrames={270}>
        <IntroScene />
      </Sequence>

      <Sequence from={240} durationInFrames={390}>
        <RevolutionScene />
      </Sequence>

      <Sequence from={600} durationInFrames={480}>
        <ColdWarScene />
      </Sequence>

      <Sequence from={1050} durationInFrames={480}>
        <KeyActorsScene />
      </Sequence>

      <Sequence from={1500} durationInFrames={480}>
        <CurrentCrisisScene />
      </Sequence>

      <Sequence from={1950} durationInFrames={300}>
        <FinalScene />
      </Sequence>
    </AbsoluteFill>
  );
};
