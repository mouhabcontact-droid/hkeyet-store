# Deployment Guide

## Prerequisites

Your Supabase environment variables are already configured in `netlify.toml` and `vercel.json`.

## Deploy to Netlify

### Option 1: Deploy via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard
1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Netlify will automatically detect the `netlify.toml` configuration
5. Click "Deploy site"

The environment variables are already set in `netlify.toml`, so no additional configuration is needed.

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard
1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel will automatically detect the configuration
5. Add these environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`: https://jeauxmdkeyvfgrwurudz.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYXV4bWRrZXl2Zmdyd3VydWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTcxODQsImV4cCI6MjA4ODMzMzE4NH0.EesySpfmHXHNXret4C-9ovAiO0wFQkUaLCGVePdj7lc
6. Click "Deploy"

## Deploy to Other Platforms

For other static hosting platforms (GitHub Pages, Cloudflare Pages, etc.):

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your hosting platform

3. Configure environment variables in your hosting platform's dashboard:
   - `VITE_SUPABASE_URL`: https://jeauxmdkeyvfgrwurudz.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYXV4bWRrZXl2Zmdyd3VydWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTcxODQsImV4cCI6MjA4ODMzMzE4NH0.EesySpfmHXHNXret4C-9ovAiO0wFQkUaLCGVePdj7lc

4. Configure SPA routing (redirect all routes to index.html)

## Troubleshooting

If you encounter build errors:
- Ensure Node.js version 18 or higher is installed
- Run `npm install` to install all dependencies
- Check that environment variables are properly set

If the site loads but shows database errors:
- Verify that your Supabase project is active
- Check that the environment variables are correctly configured
- Ensure your Supabase RLS policies allow public access to appropriate tables
