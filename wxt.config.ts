import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import { extensionHostPermissions, extensionPermissions } from "./src/manifest-policy";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
  outDir: "dist",
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Page capture",
    description:
      "Review job-post fields from the open tab, then copy or download JSON.",
    permissions: [...extensionPermissions],
    host_permissions: [...extensionHostPermissions],
    action: {
      default_title: "Capture this page",
    },
  },
});
