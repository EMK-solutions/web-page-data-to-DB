import { defineUnlistedScript } from "#imports";
import { readIndeedFromWindow } from "@/src/capture/indeed";

type IndeedWindow = typeof globalThis & {
  _rootProps?: unknown;
  __jobCaptureIndeed?: ReturnType<typeof readIndeedFromWindow>;
};

/** Main-world read of the Indeed page model. Content scripts cannot see it. */
export default defineUnlistedScript(() => {
  const host = globalThis as IndeedWindow;
  host.__jobCaptureIndeed = readIndeedFromWindow(host._rootProps);
});
