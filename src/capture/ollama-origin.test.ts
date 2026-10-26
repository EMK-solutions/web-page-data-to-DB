import { describe, expect, it } from "vitest";
import { formatOllamaHttpError, ollamaOriginRule } from "@/src/capture/ollama-origin";

describe("local Ollama origin", () => {
  it("drops Origin only for this extension and the configured address", () => {
    const rule = ollamaOriginRule("http://127.0.0.1:11434/", "extension-id");
    expect(rule.action).toEqual({
      type: "modifyHeaders",
      requestHeaders: [{ header: "origin", operation: "remove" }],
    });
    expect(rule.condition).toEqual({
      initiatorDomains: ["extension-id"],
      requestDomains: ["127.0.0.1"],
      urlFilter: "http://127.0.0.1:11434/",
      resourceTypes: ["xmlhttprequest"],
    });
    expect(rule.condition.urlFilter).not.toContain("localhost");

    const localhost = ollamaOriginRule("http://localhost:11435", "extension-id");
    expect(localhost.condition.requestDomains).toEqual(["localhost"]);
    expect(localhost.condition.urlFilter).toBe("http://localhost:11435/");
  });

  it("keeps a short response body and marks an empty one", () => {
    expect(formatOllamaHttpError(403, "")).toEqual({
      panel: "Ollama replied with HTTP 403. The response body was empty.",
      logBody: "(empty)",
    });
    expect(formatOllamaHttpError(403, ' \n{"error":"origin not allowed"}\n ')).toEqual({
      panel: 'Ollama replied with HTTP 403. {"error":"origin not allowed"}',
      logBody: '{"error":"origin not allowed"}',
    });
    const long = "x".repeat(200);
    expect(formatOllamaHttpError(500, long).logBody.endsWith("…")).toBe(true);
    expect(formatOllamaHttpError(500, long).logBody.length).toBeLessThan(long.length);
  });
});