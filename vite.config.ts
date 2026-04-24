import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "test") {
    // unit test build
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/test/main.test.ts"),
          name: "tests",
          fileName: "tests",
          formats: ["es"],
        },
        outDir: "dist",
        emptyOutDir: false,
        target: "node16",
      },
      plugins: [],
    };
  } else {
    // Browser build by default
    return {
      build: {
        outDir: "dist",
        emptyOutDir: false,
        assetsInlineLimit: 16384,
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: `assets/[name].[ext]`,
          },
        },
      },
      assetsInclude: ["**/*.svg"],
      plugins: [preact()],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    };
  }
});
