import { DEFAULT_OLLAMA_BASE } from "@/src/capture/ollama";
import { isRecord } from "@/src/capture/records";

export type Settings = {
  ollamaBaseUrl: string;
  ollamaModel: string;
  backendBaseUrl: string;
};

export function defaultSettings(): Settings {
  return {
    ollamaBaseUrl: DEFAULT_OLLAMA_BASE,
    ollamaModel: "",
    backendBaseUrl: backendDefaultFromEnv(),
  };
}

export function normalizeSettings(value: unknown): Settings {
  const defaults = defaultSettings();
  if (!isRecord(value)) return defaults;
  return {
    ollamaBaseUrl:
      typeof value.ollamaBaseUrl === "string" && value.ollamaBaseUrl.trim()
        ? value.ollamaBaseUrl.trim()
        : defaults.ollamaBaseUrl,
    ollamaModel: typeof value.ollamaModel === "string" ? value.ollamaModel.trim() : "",
    backendBaseUrl:
      typeof value.backendBaseUrl === "string"
        ? value.backendBaseUrl.trim()
        : defaults.backendBaseUrl,
  };
}

export function backendDefaultFromEnv(): string {
  const value = import.meta.env.WXT_BACKEND_BASE_URL;
  return typeof value === "string" ? value.trim() : "";
}
