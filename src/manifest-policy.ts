export const extensionPermissions = [
  "activeTab",
  "scripting",
  "storage",
  "sidePanel",
] as const;

export const extensionHostPermissions = [
  "http://127.0.0.1/*",
  "http://localhost/*",
] as const;
