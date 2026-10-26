import { browser } from "wxt/browser";

/** One dynamic rule. Replaced whenever the configured Ollama address changes. */
export const OLLAMA_ORIGIN_RULE_ID = 1;

const ERROR_BODY_LIMIT = 180;

export type OllamaOriginRule = {
  id: number;
  priority: number;
  action: {
    type: "modifyHeaders";
    requestHeaders: [{ header: "origin"; operation: "remove" }];
  };
  condition: {
    initiatorDomains: [string];
    requestDomains: [string];
    urlFilter: string;
    resourceTypes: ["xmlhttprequest"];
  };
};

/**
 * Chrome sends `Origin: chrome-extension://…` on a POST from the side panel.
 * Default Ollama allows localhost origins and answers 403 for an extension origin.
 * Removing Origin makes the call look like a non-browser client, which Ollama accepts.
 * The rule matches only this extension and the configured localhost address.
 */
export function ollamaOriginRule(baseUrl: string, extensionId: string): OllamaOriginRule {
  const origin = new URL(baseUrl);
  const port = origin.port || (origin.protocol === "https:" ? "443" : "80");
  return {
    id: OLLAMA_ORIGIN_RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [{ header: "origin", operation: "remove" }],
    },
    condition: {
      initiatorDomains: [extensionId],
      requestDomains: [origin.hostname],
      urlFilter: `${origin.protocol}//${origin.hostname}:${port}/`,
      resourceTypes: ["xmlhttprequest"],
    },
  };
}

export function formatOllamaHttpError(
  status: number,
  body: string,
): { panel: string; logBody: string } {
  const clipped = body.replace(/\s+/g, " ").trim();
  const logBody =
    clipped.length === 0
      ? "(empty)"
      : clipped.length <= ERROR_BODY_LIMIT
        ? clipped
        : `${clipped.slice(0, ERROR_BODY_LIMIT).trimEnd()}…`;
  const panel =
    logBody === "(empty)"
      ? `Ollama replied with HTTP ${status}. The response body was empty.`
      : `Ollama replied with HTTP ${status}. ${logBody}`;
  return { panel, logBody };
}

export async function ensureLocalOllamaOrigin(baseUrl: string): Promise<void> {
  const declarativeNetRequest = browser?.declarativeNetRequest;
  const extensionId = browser?.runtime?.id;
  if (!declarativeNetRequest || !extensionId) return;
  try {
    const rule = ollamaOriginRule(baseUrl, extensionId);
    await declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [rule.id],
      addRules: [rule],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The rule could not be saved.";
    console.error("Could not drop the Origin header for the local Ollama address.", message);
  }
}
