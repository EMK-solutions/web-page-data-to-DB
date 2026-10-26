import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

export function loadFixture(name: string): Document {
  const html = readFileSync(join(fixtureDir, name), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}
