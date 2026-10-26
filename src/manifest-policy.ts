export const extensionPermissions = [
  "activeTab",
  "scripting",
  "storage",
  "sidePanel",
  "tabs",
] as const;

export const extensionHostPermissions = [
  "http://127.0.0.1/*",
  "http://localhost/*",
  "http://*/*",
  "https://*/*",
] as const;
