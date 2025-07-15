# Deployment Guide for GitHub Pages

This guide will help you deploy your MythSeeker app to GitHub Pages.

## Prerequisites

1. Make sure you have a GitHub account
2. Your project should be pushed to a GitHub repository
3. Node.js and npm should be installed on your system

## Step-by-Step Deployment

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `MythSeeker` (or whatever you prefer)
3. Make it public or private (your choice)
4. Don't initialize with README, .gitignore, or license (we already have these)

### 3. Push to GitHub

```bash
git remote add origin https://github.com/repairman29/MythSeeker.git
git branch -M main
git push -u origin main
```

### 4. Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
- Build your project for production
- Create a `gh-pages` branch
- Push the built files to GitHub Pages

### 5. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "gh-pages" branch and "/ (root)" folder
6. Click "Save"

### 6. Access Your App

Your app will be available at: `https://repairman29.github.io/MythSeeker`

**Note:** It may take a few minutes for the changes to appear.

## Troubleshooting

### Common Issues

1. **404 Error**: Make sure the `homepage` in `package.json` matches your repository name
2. **Build Fails**: Check that all dependencies are installed (`npm install`)
3. **Deployment Fails**: Ensure you have write access to the repository

### Manual Deployment

If the automatic deployment doesn't work:

```bash
# Build the project
npm run build

# Create gh-pages branch manually
git checkout -b gh-pages
git add dist -f
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Switch back to main branch
git checkout main
```

### Updating the App

To update your deployed app:

1. Make your changes
2. Commit and push to main branch
3. Run `npm run deploy`

## Environment Variables

If your app uses environment variables, you'll need to configure them in your GitHub repository:

1. Go to repository Settings
2. Click on "Secrets and variables" → "Actions"
3. Add your environment variables

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the `public` folder with your domain
2. Configure your domain's DNS settings
3. Update the `homepage` in `package.json`

## Performance Optimization

- The app is already optimized with Vite
- Images and assets are automatically optimized
- CSS and JS are minified for production
- Source maps are generated for debugging

## Monitoring

- Check the "Actions" tab in your GitHub repository for deployment status
- Monitor the "Pages" section for build logs
- Use browser dev tools to check for any console errors 