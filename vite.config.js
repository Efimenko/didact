import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "Didact.createElement",
    jsxInject: `import {Didact, DidactDOM} from '/src'`,
  },
});
