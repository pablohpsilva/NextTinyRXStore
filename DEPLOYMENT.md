# Deployment Guide

## 🚀 **GitHub Pages Deployment**

This repository is configured to automatically deploy the `apps/web` Next.js application to GitHub Pages using GitHub Actions.

### 📋 **Setup Instructions**

#### 1. **Enable GitHub Pages**

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy on pushes to `main` or `master` branch

#### 2. **Repository Settings**

Ensure your repository has these settings:

- **Actions permissions**: Allow GitHub Actions to run
- **Pages**: Source set to "GitHub Actions"
- **Environment protection rules**: Optional, but recommended for production

#### 3. **Automatic Deployment**

The deployment happens automatically when:

- Code is pushed to `main` or `master` branch
- You manually trigger the workflow from the Actions tab

### 🔧 **Configuration Details**

#### **Next.js Configuration**

The `apps/web/next.config.js` is configured for static export:

```javascript
const nextConfig = {
  // Enable static export for GitHub Pages
  output: "export",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages (auto-configured)
  basePath:
    process.env.NODE_ENV === "production" ? process.env.BASE_PATH || "" : "",

  // Ensure compatibility
  trailingSlash: false,
};
```

#### **GitHub Actions Workflow**

The `.github/workflows/deploy-pages.yml` workflow:

1. **Build Phase**:

   - Installs Node.js 18 and pnpm
   - Caches dependencies for faster builds
   - Builds the NextTinyRXStore package
   - Builds the Next.js web app with static export
   - Uploads the build artifacts

2. **Deploy Phase**:
   - Deploys the static files to GitHub Pages
   - Provides the deployment URL

### 📱 **Live Demo**

Once deployed, your app will be available at:

```
https://[username].github.io/[repository-name]/
```

For example:

- `https://pablohpsilva.github.io/NextTinyRXStore/`

### 🛠 **Local Development**

To test the build locally:

```bash
# Install dependencies
pnpm install

# Build the package
pnpm --filter next-tiny-rx-store build

# Build and serve the web app
pnpm --filter web build
pnpm --filter web start
```

Or for static export testing:

```bash
# Build for static export
pnpm --filter web build

# Serve the static files (using any static server)
npx serve apps/web/out
```

### 🔍 **Troubleshooting**

#### **Common Issues**

1. **Build Failures**

   - Check that all dependencies are properly installed
   - Ensure the NextTinyRXStore package builds successfully first
   - Verify there are no TypeScript errors

2. **404 Errors on GitHub Pages**

   - Ensure `output: 'export'` is set in `next.config.js`
   - Check that the `basePath` configuration is correct
   - Verify the `.nojekyll` file exists in `public/`

3. **CSS/JS Not Loading**

   - Confirm `images.unoptimized: true` is set
   - Check the browser console for path-related errors
   - Ensure no absolute paths are used in the code

4. **Workflow Permissions**
   - Verify repository has Pages enabled
   - Check that Actions have write permissions to Pages
   - Ensure the `GITHUB_TOKEN` has sufficient permissions

#### **Monitoring Deployments**

1. **Actions Tab**: View build and deployment logs
2. **Pages Settings**: See deployment history and status
3. **Repository Insights**: Monitor deployment frequency and success rates

### 🚀 **Advanced Configuration**

#### **Custom Domain**

To use a custom domain:

1. Add a `CNAME` file to `apps/web/public/`:

   ```
   your-domain.com
   ```

2. Configure DNS settings with your domain provider
3. Enable HTTPS in repository Pages settings

#### **Environment Variables**

For environment-specific builds, add secrets in repository settings:

```yaml
# In the workflow file
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

#### **Deployment Branches**

To deploy from different branches, modify the workflow:

```yaml
on:
  push:
    branches: ["main", "develop", "staging"]
```

### 📊 **Performance Optimization**

The deployment includes several optimizations:

1. **Caching**: Dependencies and Next.js build cache
2. **Static Export**: No server-side rendering for maximum performance
3. **Image Optimization**: Disabled for compatibility but can be re-enabled with custom loader
4. **Bundle Optimization**: Automatic code splitting and tree shaking

### 🔐 **Security Considerations**

1. **No Secrets in Client Code**: Only use `NEXT_PUBLIC_*` environment variables
2. **Static Assets**: All code is publicly visible in the deployed site
3. **HTTPS**: Automatically enabled for `*.github.io` domains
4. **Content Security Policy**: Consider adding CSP headers via middleware

---

## 📚 **Additional Resources**

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

---

**🎉 Your NextTinyRXStore demo is now ready for the world to see!**
