import { useEffect, useRef, useState } from "react";
import {
  applyModelGaps,
  applySelectionModel,
  blankFields,
  blankForm,
  buildCapture,
  captureToJson,
  fieldsFromForm,
  fieldsToForm,
  jobFieldKeys,
  ModelOutputError,
  type FieldForm,
  type JobCapture,
  type JobFieldKey,
  type JobFields,
} from "@/src/capture/schema";
import { OllamaError, completeJobFields, type ModelPurpose } from "@/src/capture/ollama";
import { emptySelectionMessage } from "@/src/capture/selection";
import { type PageRead } from "@/src/capture/types";
import { readActiveSelection, readActiveTab, TabReadError } from "@/src/read-tab";
import { loadSettings } from "@/src/settings-store";
import { type Settings } from "@/src/settings";
import { listRecentCaptures, rememberCapture } from "@/src/storage";

export type CaptureMeta = {
  sourceUrl: string;
  extractedAt: string;
  sourceJobId?: string;
  pageLanguage: string | null;
};

type Phase = "idle" | "reading" | "modeling" | "ready";

export type CaptureRequest = "page" | "selection-replace" | "selection-fill";

export function useCapture() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [requestKind, setRequestKind] = useState<CaptureRequest>("page");
  const [tabError, setTabError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [form, setForm] = useState<FieldForm>(blankForm());
  const [meta, setMeta] = useState<CaptureMeta | null>(null);
  const [recent, setRecent] = useState<JobCapture[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty = useRef(new Set<JobFieldKey>());
  const formRef = useRef(form);
  const requestId = useRef(0);

  useEffect(() => {
    void listRecentCaptures()
      .then(setRecent)
      .catch(() => setTabError("Recent captures could not be read from this browser."));
  }, []);

  function updateForm(next: FieldForm) {
    formRef.current = next;
    setForm(next);
  }

  function onFieldChange(key: JobFieldKey, value: string) {
    dirty.current.add(key);
    updateForm({ ...formRef.current, [key]: value });
  }

  async function persist(nextForm: FieldForm, nextMeta: CaptureMeta) {
    try {
      const capture = buildCapture({
        fields: fieldsFromForm(nextForm),
        sourceUrl: nextMeta.sourceUrl,
        extractedAt: nextMeta.extractedAt,
        ...(nextMeta.sourceJobId ? { sourceJobId: nextMeta.sourceJobId } : {}),
      });
      setRecent(await rememberCapture(capture));
    } catch {
      setTabError("The capture could not be stored in this browser.");
    }
  }

  function startRequest(kind: CaptureRequest): number {
    const id = requestId.current + 1;
    requestId.current = id;
    setRequestKind(kind);
    setPhase("reading");
    setTabError(null);
    setModelError(null);
    setNotice(null);
    dirty.current.clear();
    return id;
  }

  function failTab(id: number, error: unknown) {
    if (id !== requestId.current) return;
    setTabError(error instanceof TabReadError ? error.message : "This tab could not be read.");
    setPhase(meta ? "ready" : "idle");
  }

  async function extract() {
    const id = startRequest("page");
    let page: PageRead;
    try {
      page = await readActiveTab();
    } catch (error) {
      failTab(id, error);
      return;
    }
    await continueCapture(id, page);
  }

  async function extractSelection(mode: "replace" | "fill") {
    const id = startRequest(mode === "replace" ? "selection-replace" : "selection-fill");
    const baseline = fieldsFromForm(formRef.current);
    let selected: Awaited<ReturnType<typeof readActiveSelection>>;
    try {
      selected = await readActiveSelection();
    } catch (error) {
      failTab(id, error);
      return;
    }
    if (id !== requestId.current) return;
    if (selected.empty) {
      setTabError(emptySelectionMessage);
      setPhase(meta ? "ready" : "idle");
      return;
    }

    const purpose: ModelPurpose = mode === "replace" ? "selection-replace" : "selection-fill";
    const page: PageRead = {
      fields: mode === "replace" ? blankFields() : baseline,
      sourceUrl: selected.sourceUrl,
      pageLanguage: selected.pageLanguage,
      visibleText: selected.markdown,
      structuredDescription: null,
      warnings: [],
      adapter: "visible-text",
      ...(selected.sourceJobId ? { sourceJobId: selected.sourceJobId } : {}),
    };
    setPhase("modeling");

    const model = await askModel(id, page, purpose);
    if (model == null || id !== requestId.current) return;

    const nextFields = keepDirty(
      applySelectionModel(baseline, model, mode, selected.sourceJobId),
    );
    const nextMeta: CaptureMeta = {
      sourceUrl: selected.sourceUrl,
      extractedAt: new Date().toISOString(),
      pageLanguage: selected.pageLanguage,
      ...(selected.sourceJobId ? { sourceJobId: selected.sourceJobId } : {}),
    };
    const nextForm = fieldsToForm(nextFields);
    setMeta(nextMeta);
    updateForm(nextForm);
    setWarnings([]);
    await persist(nextForm, nextMeta);
    if (id !== requestId.current) return;
    setPhase("ready");
  }

  async function continueCapture(id: number, page: PageRead) {
    if (id !== requestId.current) return;

    const nextMeta: CaptureMeta = {
      sourceUrl: page.sourceUrl,
      extractedAt: new Date().toISOString(),
      pageLanguage: page.pageLanguage,
      ...(page.sourceJobId ? { sourceJobId: page.sourceJobId } : {}),
    };
    const nextForm = fieldsToForm(page.fields);
    setMeta(nextMeta);
    updateForm(nextForm);
    setWarnings(page.warnings);
    setPhase("modeling");
    await persist(nextForm, nextMeta);
    if (id !== requestId.current) return;

    const model = await askModel(id, page, "page");
    if (model == null || id !== requestId.current) return;
    const merged = fieldsToForm(
      keepDirty(applyModelGaps(page.fields, model, page.sourceJobId)),
    );
    updateForm(merged);
    await persist(merged, nextMeta);
    if (id !== requestId.current) return;
    setPhase("ready");
  }

  async function askModel(
    id: number,
    page: PageRead,
    purpose: ModelPurpose,
  ): Promise<JobFields | null> {
    let settings: Settings;
    try {
      settings = await loadSettings();
    } catch {
      if (id !== requestId.current) return null;
      setModelError("Saved options could not be read, so the model step was skipped.");
      setPhase(purpose === "page" || meta ? "ready" : "idle");
      return null;
    }

    try {
      return await completeJobFields({
        baseUrl: settings.ollamaBaseUrl,
        model: settings.ollamaModel,
        page,
        purpose,
      });
    } catch (error) {
      if (id !== requestId.current) return null;
      setModelError(modelMessage(error, purpose));
      setPhase(purpose === "page" || meta ? "ready" : "idle");
      return null;
    }
  }

  function keepDirty(fields: JobFields): JobFields {
    const next = { ...fields };
    for (const key of jobFieldKeys) {
      if (!dirty.current.has(key)) continue;
      const edited = formRef.current[key].trim();
      next[key] = edited.length > 0 ? edited : null;
    }
    return next;
  }

  function currentCapture(): JobCapture | null {
    if (!meta) return null;
    try {
      return buildCapture({
        fields: fieldsFromForm(formRef.current),
        sourceUrl: meta.sourceUrl,
        extractedAt: meta.extractedAt,
        ...(meta.sourceJobId ? { sourceJobId: meta.sourceJobId } : {}),
      });
    } catch {
      return null;
    }
  }

  async function copyJson() {
    const capture = currentCapture();
    if (!capture) return;
    try {
      await navigator.clipboard.writeText(captureToJson(capture));
      await persist(formRef.current, metaFrom(capture));
      setNotice("Copied the JSON.");
    } catch {
      setNotice("The JSON could not be copied. Download it instead.");
    }
  }

  async function downloadJson() {
    const capture = currentCapture();
    if (!capture) return;
    const json = captureToJson(capture);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName(capture);
    anchor.click();
    URL.revokeObjectURL(url);
    await persist(formRef.current, metaFrom(capture));
    setNotice("Downloaded the JSON.");
  }

  function restore(capture: JobCapture) {
    const nextMeta = metaFrom(capture);
    setMeta(nextMeta);
    updateForm(fieldsToForm(capture));
    dirty.current.clear();
    setWarnings([]);
    setTabError(null);
    setModelError(null);
    setNotice(null);
    setPhase("ready");
  }

  return {
    phase,
    tabError,
    modelError,
    warnings,
    form,
    meta,
    recent,
    notice,
    onFieldChange,
    requestKind,
    extract,
    extractSelection,
    copyJson,
    downloadJson,
    restore,
  };
}

function metaFrom(capture: JobCapture): CaptureMeta {
  return {
    sourceUrl: capture.sourceUrl,
    extractedAt: capture.extractedAt,
    pageLanguage: null,
    ...(capture.sourceJobId ? { sourceJobId: capture.sourceJobId } : {}),
  };
}

function modelMessage(error: unknown, purpose: ModelPurpose): string {
  if (error instanceof OllamaError || error instanceof ModelOutputError) return error.message;
  return purpose === "page"
    ? "The local model could not fill the gaps."
    : "The local model could not read the selection.";
}

function downloadName(capture: JobCapture): string {
  const company = (capture.company ?? "job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `job-post-${company || "capture"}.json`;
}
