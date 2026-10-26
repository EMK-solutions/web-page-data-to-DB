import { browser } from "wxt/browser";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { jobFieldKeys, type JobFieldKey } from "@/src/capture/schema";
import { ExplainableTitle } from "@/src/panel/explain-title";
import { MarkdownView } from "@/src/panel/markdown-view";
import { useCapture, type CaptureRequest } from "@/src/panel/use-capture";

const labels: Record<JobFieldKey, string> = {
  jobTitle: "Job title",
  company: "Company",
  jobDescription: "Job description",
  jobPostedDate: "Posted date",
  location: "Location",
  salaryRange: "Salary range",
  companyJobReferenceId: "Company job reference",
};

export function App() {
  const capture = useCapture();
  const busy = capture.phase === "reading" || capture.phase === "modeling";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-3 py-4 sm:px-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Job post
          </p>
          <h1 className="font-serif text-2xl text-foreground">Page capture</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Extract data from open browser tab
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void browser.runtime.openOptionsPage()}
        >
          Options
        </Button>
      </header>

      <div className="grid gap-2">
        <Button
          type="button"
          className="h-auto min-h-9 w-full whitespace-normal"
          onClick={() => void capture.extract()}
          disabled={busy}
          aria-busy={capture.requestKind === "page" && busy}
        >
          {capture.phase === "modeling" && capture.requestKind === "page" ? <ButtonSpinner /> : null}
          Extract data from web page
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-9 w-full whitespace-normal"
          onClick={() => void capture.extractStructured()}
          disabled={busy}
          aria-busy={capture.requestKind === "structured" && busy}
        >
          {capture.phase === "reading" && capture.requestKind === "structured" ? (
            <ButtonSpinner />
          ) : null}
          Extract structured data
        </Button>
        <div className="flex items-start gap-2 rounded-md border px-3 py-3 text-sm">
          <input
            id="overwrite-existing"
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={capture.overwriteExisting}
            onChange={(event) => capture.setOverwriteExisting(event.target.checked)}
          />
          <ExplainableTitle
            label="Overwrite existing"
            title={
              <label htmlFor="overwrite-existing" className="font-medium">
                Overwrite existing
              </label>
            }
            explanation="Replaces values already in the form. Off, Extract data from web page and Extract structured data fill only empty fields, the same way Append does."
          />
        </div>
        <div className="grid gap-2 rounded-md border px-3 py-3">
          <ExplainableTitle
            label="Extract selected text"
            title={<p className="text-sm font-medium">Extract selected text</p>}
            explanation="The model reads the selection. It may be a title, a location, or a later part of the page. Nothing on the page is clicked. Replace writes the selection over the fields. Append fills only empty fields and keeps a value that is already there."
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => void capture.extractSelection("replace")}
              disabled={busy}
              aria-busy={capture.requestKind === "selection-replace" && busy}
            >
              {capture.phase === "modeling" && capture.requestKind === "selection-replace" ? (
                <ButtonSpinner />
              ) : null}
              Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => void capture.extractSelection("fill")}
              disabled={busy}
              aria-busy={capture.requestKind === "selection-fill" && busy}
            >
              {capture.phase === "modeling" && capture.requestKind === "selection-fill" ? (
                <ButtonSpinner />
              ) : null}
              Append
            </Button>
          </div>
        </div>
      </div>

      {capture.phase === "reading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {readingMessage(capture.requestKind)}
        </p>
      ) : null}
      {capture.phase === "modeling" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {modelingMessage(capture.requestKind)}
        </p>
      ) : null}

      {capture.tabError ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-rose-50 px-3 py-2 text-sm text-destructive">
          {capture.tabError}
        </p>
      ) : null}
      {capture.modelError ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-rose-50 px-3 py-2 text-sm text-destructive">
          {capture.modelError}{" "}
          {capture.requestKind === "page"
            ? "The fields already taken from the page are still here."
            : "The fields you already have are unchanged."}
        </p>
      ) : null}
      {capture.warnings.map((warning) => (
        <p
          key={warning}
          role="status"
          className="rounded-md border border-amber-800/20 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          {warning}
        </p>
      ))}
      {capture.notice ? (
        <p role="status" className="text-sm text-primary">
          {capture.notice}
        </p>
      ) : null}

      {capture.llmPrompt ? (
        <details className="rounded-md border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">LLM prompt</summary>
          <div className="mt-3 grid gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">System</p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs">
                {capture.llmPrompt.system}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">User</p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs">
                {capture.llmPrompt.user}
              </pre>
            </div>
          </div>
        </details>
      ) : null}

      {capture.phase === "idle" && !capture.meta ? (
        <Card>
          <CardHeader className="p-4">
            <CardTitle>No capture yet</CardTitle>
            <CardDescription className="leading-relaxed">
              Open a job page, then extract. You can correct every field before you copy or
              download the JSON.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {capture.meta ? (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Extracted data</CardTitle>
            {capture.meta.pageLanguage ? (
              <CardDescription className="leading-relaxed">
                Page language: {capture.meta.pageLanguage}. The text stays in that language.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0">
            {jobFieldKeys.map((key) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{labels[key]}</Label>
                {key === "jobDescription" ? (
                  <>
                    <MarkdownView markdown={capture.form[key]} />
                    <Textarea
                      id={key}
                      value={capture.form[key]}
                      className="min-h-40"
                      onChange={(event) => capture.onFieldChange(key, event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Headings, bold, lists, and paragraphs stay in the text as markdown.
                    </p>
                  </>
                ) : key === "jobPostedDate" ? (
                  <>
                    <Input
                      id={key}
                      type="date"
                      value={capture.form[key]}
                      onChange={(event) => capture.onFieldChange(key, event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      A calendar date, or empty when the page does not state one.
                    </p>
                  </>
                ) : (
                  <Input
                    id={key}
                    value={capture.form[key]}
                    onChange={(event) => capture.onFieldChange(key, event.target.value)}
                  />
                )}
                {key === "companyJobReferenceId" ? (
                  <p className="text-xs text-muted-foreground">
                    The hiring company’s own reference, when the posting states one. Leave this
                    empty when you only have the board’s id.
                  </p>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" onClick={() => void capture.copyJson()}>
                Copy JSON
              </Button>
              <Button type="button" variant="outline" onClick={() => void capture.downloadJson()}>
                Download JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <details className="rounded-md border px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Recent captures</summary>
        <div className="mt-3 grid gap-2">
          {capture.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Copies you extract are kept on this machine, up to the last few.
            </p>
          ) : (
            <ul className="grid gap-2">
              {capture.recent.map((item) => (
                <li key={item.extractedAt}>
                  <button
                    type="button"
                    className="w-full rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => capture.restore(item)}
                  >
                    <span className="block font-medium">
                      {item.jobTitle ?? "Untitled capture"}
                      {item.company ? ` · ${item.company}` : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.sourceUrl}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {capture.meta ? (
        <details className="rounded-md border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">Source</summary>
          <div className="mt-3 grid gap-2 text-sm">
            <p className="break-words">
              <span className="font-medium">Page URL</span>{" "}
              <span className="text-muted-foreground">{capture.meta.sourceUrl}</span>
            </p>
            {capture.meta.sourceJobId ? (
              <p className="break-all">
                <span className="font-medium">Board id</span>{" "}
                <span className="text-muted-foreground">{capture.meta.sourceJobId}</span>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </main>
  );
}

function ButtonSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function readingMessage(kind: CaptureRequest): string {
  if (kind === "structured") {
    return "Reading the schema.org JobPosting already in the page. The page is not clicked, and the model is not called.";
  }
  if (kind === "page") {
    return "Reading the open tab and collecting the fields that are already on the page.";
  }
  return "Reading the selection. The page is not clicked or scrolled.";
}

function modelingMessage(kind: CaptureRequest): string {
  if (kind === "selection-replace") {
    return "Asking the local model to read the selection and replace the fields. An edit you make while it runs is kept.";
  }
  if (kind === "selection-fill") {
    return "Asking the local model to fill only the fields that are still empty. A description you already have stays.";
  }
  return "Asking the local model to fill the gaps. You can edit the fields while it runs.";
}
