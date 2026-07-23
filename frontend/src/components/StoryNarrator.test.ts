import { describe, expect, it } from "vitest";
import { pickNarratorVoice } from "./StoryNarrator";

function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe("StoryNarrator voice selection", () => {
  const voices = [
    voice("Microsoft Elena Online (Natural) - Spanish (Argentina)", "es-AR"),
    voice("Microsoft Tomas Online (Natural) - Spanish (Argentina)", "es-AR"),
    voice("Microsoft Sabina - Spanish (Mexico)", "es-MX"),
    voice("Microsoft Aria - English (United States)", "en-US"),
    voice("Microsoft Andrew - English (United States)", "en-US"),
  ];

  it("selects Tomas for the Argentine male narrator", () => {
    expect(pickNarratorVoice(voices, "es", "man")?.name).toContain("Tomas");
  });

  it("selects Elena for the Argentine female narrator", () => {
    expect(pickNarratorVoice(voices, "es", "woman")?.name).toContain("Elena");
  });

  it("keeps English personas in English", () => {
    expect(pickNarratorVoice(voices, "en", "man")?.name).toContain("Andrew");
    expect(pickNarratorVoice(voices, "en", "woman")?.name).toContain("Aria");
  });
});
