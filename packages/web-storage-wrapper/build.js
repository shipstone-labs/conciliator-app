import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import { execSync } from "node:child_process";

async function build() {
  console.log("📦 Building web-storage-wrapper...");

  try {
    // Step 1: Compile TypeScript
    console.log("🔧 Compiling TypeScript...");
    execSync("npx tsc", { stdio: "inherit" });
    console.log("✅ TypeScript compilation successful");

    // Step 2: Bundle with Rollup
    console.log("📦 Bundling with Rollup...");
    const bundle = await rollup({
      input: "./dist/index.js",
      plugins: [
        resolve({
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
        json(),
        replace({
          "process.env.NODE_ENV": JSON.stringify("production"),
          preventAssignment: true,
        }),
        terser(),
      ],
      onwarn(warning, warn) {
        // Suppress circular dependency warnings
        if (warning.code === "CIRCULAR_DEPENDENCY") return;
        warn(warning);
      },
    });

    await bundle.write({
      file: "./dist/index.js",
      format: "esm",
      sourcemap: false,
    });

    // Step 3: Copy the TypeScript declarations
    console.log("📝 Copying TypeScript declarations...");

    console.log("✅ web-storage-wrapper built successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
