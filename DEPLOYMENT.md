# Deployment Guide for FitTrack AI Frontend

This guide explains how to deploy the FitTrack AI Frontend to GitHub Pages using GitHub Actions.

## Prerequisites

- A GitHub repository containing this project
- GitHub Pages enabled for your repository
- The project should be in the `main` branch

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**

### 2. Configure Repository Settings

The GitHub Actions workflow is already configured in `.github/workflows/deploy.yml`. It will:
- Trigger on pushes to the `main` branch
- Build the React application using Vite
- Deploy the built files to GitHub Pages

### 3. Update Base Path (if needed)

If your repository name is different from `fittrack-ai-frontend`, you need to update the base path in two files:

**vite.config.ts:**
```typescript
base: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME/' : '/',
```

**src/App.tsx:**
```typescript
<BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME' : ''}>
```

**public/404.html:**
Update the `pathSegmentsToKeep` variable if needed (currently set to 1 for project pages).

### 4. Deploy

1. Push your changes to the `main` branch
2. The GitHub Action will automatically trigger
3. Check the **Actions** tab to monitor the deployment progress
4. Once complete, your site will be available at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Configuration Details

### GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy.yml`) includes:

- **Build Job**: Installs dependencies, builds the project, and uploads artifacts
- **Deploy Job**: Deploys the built files to GitHub Pages

### Single Page Application Support

The deployment includes SPA routing support through:

- `public/404.html`: Redirects all routes to the main application
- Modified `index.html`: Handles redirected routes properly
- Proper React Router configuration with basename

### Environment Variables

The build process uses `NODE_ENV=production` to:
- Set the correct base path for assets
- Configure React Router basename
- Optimize the build for production

## Troubleshooting

### Common Issues

1. **404 Errors on Refresh**: Ensure the 404.html file is properly configured
2. **Assets Not Loading**: Check that the base path matches your repository name
3. **Routing Issues**: Verify the BrowserRouter basename is correctly set

### Build Failures

If the GitHub Action fails:
1. Check the Actions tab for error details
2. Ensure all dependencies are properly listed in package.json
3. Verify the build succeeds locally with `npm run build`

### API Configuration

For production deployment, you may need to:
1. Update API endpoints in your configuration
2. Handle CORS settings for your backend
3. Configure environment variables for production

## Development vs Production

- **Development**: Runs on `localhost:8080` with proxy to backend
- **Production**: Deployed to GitHub Pages with static hosting

Make sure your backend API is configured to handle requests from your GitHub Pages domain.

## Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure DNS settings with your domain provider
3. Update the base path configuration to use `/` instead of the repository name

## Security Considerations

- Never commit API keys or sensitive data
- Use environment variables for configuration
- Ensure your backend API has proper CORS configuration
- Consider using GitHub Secrets for sensitive build-time variables