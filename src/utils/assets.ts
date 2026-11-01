// URL of a file in public/, relative to wherever the site is served from
// (e.g. GitHub Pages serves it under /<repo>/), set by `base` in vite.config.ts
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
