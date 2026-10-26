import { browser } from "wxt/browser";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { jobFieldKeys, type JobFieldKey } from "@/src/capture/schema";
import { useCapture } from "@/src/panel/use-capture";

const labels: Record<JobFieldKey, string> = {
  jobTitle: "Job title",
  company: "Company",
  jobDescription: "Job description",
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
            Review the fields from the open tab. Nothing is sent to a website. The local model, if
            it is running, only fills gaps.
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

      <Button type="button" onClick={() => void capture.extract()} disabled={busy}>
        {capture.phase === "reading" ? "Reading the tab…" : "Extract this job"}
      </Button>

      {capture.phase === "reading" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Reading the open tab and collecting the fields that are already on the page.
        </p>
      ) : null}
      {capture.phase === "modeling" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Asking the local model to fill the gaps. You can edit the fields while it runs.
        </p>
      ) : null}

      {capture.tabError ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-rose-50 px-3 py-2 text-sm text-destructive">
          {capture.tabError}
        </p>
      ) : null}
      {capture.modelError ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-rose-50 px-3 py-2 text-sm text-destructive">
          {capture.modelError} The fields already taken from the page are still here.
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
            <CardTitle className="text-base">Review</CardTitle>
            <CardDescription className="break-words leading-relaxed">
              {capture.meta.pageLanguage
                ? `Page language: ${capture.meta.pageLanguage}. The text stays in that language. `
                : ""}
              Source: {capture.meta.sourceUrl}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0">
            {capture.meta.sourceJobId ? (
              <p className="text-xs text-muted-foreground">
                Board id {capture.meta.sourceJobId}. This is not the company reference.
              </p>
            ) : null}
            {jobFieldKeys.map((key) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{labels[key]}</Label>
                {key === "jobDescription" ? (
                  <Textarea
                    id={key}
                    value={capture.form[key]}
                    className="min-h-40"
                    onChange={(event) => capture.onFieldChange(key, event.target.value)}
                  />
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

      <section className="grid gap-2">
        <h2 className="text-sm font-medium">Recent captures</h2>
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
      </section>
    </main>
  );
}
