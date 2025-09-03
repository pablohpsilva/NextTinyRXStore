# NextTinyRXStore Build Commands

This document contains all the build commands needed to create NextTinyRXStore for all JavaScript environments.

## 🚀 Quick Build (All Formats)

```bash
npm run build
```

This runs the complete build pipeline and creates all output formats.

## 📦 Individual Build Commands

### 1. TypeScript Declarations

```bash
npm run build:types
```

**Output**: `dist/types/` - TypeScript definition files (.d.ts)
**Usage**: Type safety for all environments

### 2. ES Modules (ESM)

```bash
npm run build:esm
```

**Output**: `dist/esm/` - Modern ES modules
**Usage**: Modern bundlers (Vite, Webpack 5, Rollup), Node.js with `"type": "module"`

### 3. CommonJS (CJS)

```bash
npm run build:cjs
```

**Output**: `dist/cjs/` - CommonJS modules
**Usage**: Node.js, older bundlers, Jest testing

### 4. Universal Module Definition (UMD)

```bash
npm run build:umd
```

**Output**: `dist/umd/` - Browser-compatible bundles
**Usage**: Direct browser usage via `<script>` tags, AMD loaders

### 5. Bundle Analysis

```bash
npm run build:bundle-analysis
```

**Output**: `dist/analysis/` - Minified analysis builds
**Usage**: Bundle size analysis and optimization

## 🛠️ Development Commands

### Watch Mode (Types)

```bash
npm run dev
```

**Usage**: Development with TypeScript watching

### Watch Mode (ESM)

```bash
npm run dev:esm
```

**Usage**: Development with ESM watching

### Watch Mode (CJS)

```bash
npm run dev:cjs
```

**Usage**: Development with CJS watching

## 📊 Analysis Commands

### Bundle Size Check

```bash
npm run size
```

**Output**: Complete size analysis of all builds

### Size Check Only

```bash
npm run size:check
```

**Output**: Size report of existing builds

## 🧹 Utility Commands

### Clean Build Directory

```bash
npm run clean
```

**Usage**: Remove all build artifacts

### Pre-publish Build

```bash
npm run prepublishOnly
```

**Usage**: Automatic build before npm publish

## 📁 Output Structure

After running `npm run build`, your `dist/` folder will contain:

```
dist/
├── types/           # TypeScript definitions
│   ├── index.d.ts
│   ├── store.d.ts
│   ├── utils.d.ts
│   └── factories.d.ts
├── esm/             # ES Modules
│   ├── index.js
│   ├── store.js
│   ├── utils.js
│   └── factories.js
├── cjs/             # CommonJS
│   ├── package.json
│   ├── index.js
│   ├── store.js
│   ├── utils.js
│   └── factories.js
├── umd/             # Universal builds
│   ├── index.js
│   ├── index.min.js
│   └── index.iife.js
└── analysis/        # Bundle analysis
    ├── esm.min.js
    └── cjs.min.js
```

## 🌍 Environment Support

### ✅ Supported Environments

| Environment           | Format  | Entry Point              |
| --------------------- | ------- | ------------------------ |
| **Node.js (Modern)**  | ESM     | `dist/esm/index.js`      |
| **Node.js (Legacy)**  | CJS     | `dist/cjs/index.js`      |
| **Webpack 5**         | ESM     | `dist/esm/index.js`      |
| **Webpack 4**         | CJS     | `dist/cjs/index.js`      |
| **Vite**              | ESM     | `dist/esm/index.js`      |
| **Rollup**            | ESM     | `dist/esm/index.js`      |
| **esbuild**           | ESM/CJS | Auto-detected            |
| **Parcel**            | ESM     | `dist/esm/index.js`      |
| **Browser (Modern)**  | UMD     | `dist/umd/index.js`      |
| **Browser (Legacy)**  | UMD     | `dist/umd/index.min.js`  |
| **Direct Script Tag** | IIFE    | `dist/umd/index.iife.js` |
| **AMD/RequireJS**     | UMD     | `dist/umd/index.js`      |
| **Jest**              | CJS     | `dist/cjs/index.js`      |
| **Vitest**            | ESM     | `dist/esm/index.js`      |
| **Storybook**         | Auto    | Auto-detected            |
| **Next.js**           | ESM/CJS | Auto-detected            |
| **React Native**      | CJS     | `dist/cjs/index.js`      |
| **Expo**              | ESM     | `dist/esm/index.js`      |

### 🎯 Tree-Shaking Support

All builds support tree-shaking through multiple entry points:

```javascript
// Import everything
import { FieldStore, createFieldStore } from "next-tiny-rx-store";

// Import specific modules (better tree-shaking)
import { FieldStore } from "next-tiny-rx-store/store";
import { createFieldStore } from "next-tiny-rx-store/factories";
import { shallowEqual } from "next-tiny-rx-store/utils";
```

## 🔧 Advanced Usage

### Custom Build Configuration

To customize builds, modify these files:

- `tsconfig.types.json` - TypeScript declarations
- `tsconfig.esm.json` - ES Modules
- `tsconfig.cjs.json` - CommonJS
- `rollup.config.js` - UMD/IIFE builds

### CI/CD Pipeline

```bash
# Install dependencies
npm install

# Run full build and tests
npm run build
npm run type-check
npm run lint

# Check bundle sizes
npm run size
```

### Package.json Configuration

The `exports` field provides modern module resolution:

```json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    },
    "./store": {
      "import": "./dist/esm/store.js",
      "require": "./dist/cjs/store.js"
    }
  }
}
```

This ensures optimal loading for all environments while maintaining backward compatibility.
