# Publishing NextTinyRXStore to npm

## Prerequisites

1. **npm Account**: Make sure you have an npm account at [npmjs.com](https://npmjs.com)
2. **npm Login**: Run `npm login` to authenticate with npm
3. **Repository Setup**: Update repository URLs in package.json with your actual GitHub repository

## Publishing Commands

The package includes several convenience scripts for publishing:

### Pre-Publish Validation

```bash
# Full validation - build, test, and dry-run
npm run publish:check

# Just dry-run to see what would be published
npm run publish:dry-run
```

### Version Management

```bash
# Increment patch version (0.1.0 → 0.1.1)
npm run version:patch

# Increment minor version (0.1.0 → 0.2.0)
npm run version:minor

# Increment major version (0.1.0 → 1.0.0)
npm run version:major
```

### Publishing

```bash
# Basic publish (after manually updating version)
npm run publish:npm

# Automated release with version bump
npm run release:patch   # Bump patch + publish
npm run release:minor   # Bump minor + publish
npm run release:major   # Bump major + publish
```

## Step-by-Step Publishing Process

### 1. First-Time Setup

```bash
# 1. Update package.json repository URLs
# Replace "yourusername" with your actual GitHub username
# In package.json:
#   "repository": "https://github.com/YOURUSERNAME/NextTinyRXStore.git"
#   "homepage": "https://github.com/YOURUSERNAME/NextTinyRXStore#readme"
#   "bugs": "https://github.com/YOURUSERNAME/NextTinyRXStore/issues"

# 2. Login to npm
npm login

# 3. Validate everything works
npm run publish:check
```

### 2. Publishing a New Version

```bash
# Option A: Automated (recommended)
npm run release:patch  # For bug fixes
npm run release:minor  # For new features
npm run release:major  # For breaking changes

# Option B: Manual
npm run version:patch  # Or minor/major
npm run publish:npm
```

### 3. Verify Publication

```bash
# Check your package on npm
npm view next-tiny-rx-store

# Test installation
npm install next-tiny-rx-store
```

## Package Information

- **Package Name**: `next-tiny-rx-store`
- **Current Version**: `0.1.0`
- **License**: MIT
- **Bundle Size**: ~3.8KB (ESM minified)

## What Gets Published

The following files are included in the npm package:

- `dist/` - All compiled JS, types, and analysis files
- `README.md` - Documentation
- `LICENSE` - MIT license
- `build-commands.md` - Build documentation
- `package.json` - Package configuration

## Build Formats Included

- **ESM** (`dist/esm/`): Modern ES modules
- **CJS** (`dist/cjs/`): CommonJS for Node.js
- **UMD** (`dist/umd/`): Universal modules for browsers
- **Types** (`dist/types/`): TypeScript definitions
- **Analysis** (`dist/analysis/`): Minified bundles for size analysis

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `npm login` again
2. **Package Name Conflict**: Choose a different name in package.json
3. **Version Already Exists**: Bump version with `npm run version:patch`
4. **Build Errors**: Ensure all tests pass with `npm run test:run`

### Pre-publish Checklist

- [ ] All tests passing (`npm run test:run`)
- [ ] Repository URLs updated in package.json
- [ ] Logged into npm (`npm login`)
- [ ] Version number is correct
- [ ] README.md is up to date
- [ ] License is appropriate

## Scoped Packages (Optional)

If you want to publish under your own scope:

```json
{
  "name": "@yourusername/next-tiny-rx-store"
}
```

Then publish with:

```bash
npm publish --access public
```
