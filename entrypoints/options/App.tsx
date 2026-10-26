import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { normalizeOllamaBase, OllamaError, testOllamaConnection } from "@/src/capture/ollama";
import { defaultSettings, type Settings } from "@/src/settings";
import { loadSettings, saveSettings } from "@/src/settings-store";

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void loadSettings()
      .then((stored) => {
        setSettings(stored);
        setPhase("ready");
      })
      .catch(() => {
        setPhase("error");
        setStatus("Saved options could not be read.");
      });
  }, []);

  function update(patch: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      const next = {
        ...settings,
        ollamaBaseUrl: normalizeOllamaBase(settings.ollamaBaseUrl),
        ollamaModel: settings.ollamaModel.trim(),
      };
      if (!next.ollamaModel) {
        setStatus("Enter the Ollama model name. The model step needs it.");
        return;
      }
      await saveSettings(next);
      setSettings(next);
      setStatus("Saved. The backend address is stored on this machine and is not used yet.");
    } catch (error) {
      setStatus(error instanceof OllamaError ? error.message : "The options could not be saved.");
    }
  }

  async function testConnection() {
    setTesting(true);
    setStatus("Checking the local Ollama service…");
    try {
      const result = await testOllamaConnection(settings.ollamaBaseUrl);
      const wanted = settings.ollamaModel.trim();
      const listed = result.models.some(
        (name) => name === wanted || name.startsWith(`${wanted}:`),
      );
      if (wanted && !listed) {
        setStatus(
          `Connected. ${result.models.length} models are installed, and “${wanted}” is not one of them.`,
        );
      } else if (result.models.length === 0) {
        setStatus("Connected, and no models are installed yet.");
      } else {
        setStatus(`Connected. ${result.models.length} models are installed.`);
      }
    } catch (error) {
      setStatus(error instanceof OllamaError ? error.message : "Could not reach Ollama.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6 sm:px-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Page capture
        </p>
        <h1 className="font-serif text-3xl">Options</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The model runs on this computer. A backend address can be saved for a later version. This
          version does not send captures there.
        </p>
      </header>

      {phase === "loading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading saved options…
        </p>
      ) : null}
      {phase === "error" ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-rose-50 px-3 py-2 text-sm text-destructive">
          {status}
        </p>
      ) : null}

      {phase === "ready" ? (
        <Card>
          <CardHeader>
            <CardTitle>Local model</CardTitle>
            <CardDescription>
              Test connection calls the tags endpoint. Extract still shows the page fields when
              Ollama is down.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={(event) => void save(event)}>
              <div className="grid gap-1.5">
                <Label htmlFor="ollama-base">Ollama address</Label>
                <Input
                  id="ollama-base"
                  value={settings.ollamaBaseUrl}
                  onChange={(event) => update({ ollamaBaseUrl: event.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ollama-model">Model name</Label>
                <Input
                  id="ollama-model"
                  value={settings.ollamaModel}
                  onChange={(event) => update({ ollamaModel: event.target.value })}
                  required
                  placeholder="llama3.2"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Required. Use the name shown by the local model list.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="backend">Backend URL</Label>
                <Input
                  id="backend"
                  value={settings.backendBaseUrl}
                  onChange={(event) => update({ backendBaseUrl: event.target.value })}
                  placeholder="https://backend.example"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Stored locally. Phase 1 does not call it.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Save options</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void testConnection()}
                  disabled={testing}
                >
                  {testing ? "Testing…" : "Test connection"}
                </Button>
              </div>
              {status && phase === "ready" ? (
                <p role="status" className="text-sm text-foreground">
                  {status}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
