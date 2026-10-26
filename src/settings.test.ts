import { describe, expect, it } from "vitest";
import { DEFAULT_OLLAMA_BASE } from "@/src/capture/ollama";
import { normalizeSettings } from "@/src/settings";

describe("settings", () => {
  it("defaults the model to empty and Ollama to localhost", () => {
    expect(normalizeSettings(undefined)).toMatchObject({
      ollamaBaseUrl: DEFAULT_OLLAMA_BASE,
      ollamaModel: "",
    });
  });

  it("keeps a saved empty backend instead of inventing one", () => {
    expect(
      normalizeSettings({
        ollamaBaseUrl: "http://localhost:11434",
        ollamaModel: "llama3.2",
        backendBaseUrl: "",
      }).backendBaseUrl,
    ).toBe("");
  });
});
