import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const external = ["react"];

const createConfig = (format, minify = false) => ({
  input: "src/index.ts",
  external,
  output: {
    file: `dist/umd/index${minify ? ".min" : ""}.${
      format === "umd" ? "js" : format
    }`,
    format,
    name: format === "umd" ? "NextTinyRXStore" : undefined,
    globals: {
      react: "React",
    },
    sourcemap: true,
  },
  plugins: [
    resolve({
      browser: format === "umd",
      preferBuiltins: format !== "umd",
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.esm.json",
      declaration: false,
      declarationMap: false,
      outDir: undefined,
      sourceMap: true,
    }),
    ...(minify ? [terser()] : []),
  ],
});

export default [
  // UMD build
  createConfig("umd"),
  // UMD minified build
  createConfig("umd", true),
  // IIFE build for direct browser use
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/umd/index.iife.js",
      format: "iife",
      name: "NextTinyRXStore",
      globals: {
        react: "React",
      },
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.esm.json",
        declaration: false,
        declarationMap: false,
        outDir: undefined,
        sourceMap: true,
      }),
      terser(),
    ],
  },
];
