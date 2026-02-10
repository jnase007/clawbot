# Manual Deployment Checklist

## Pre-Deployment Checks

### 1. Environment Variables (Netlify Dashboard)
Make sure these are set in Netlify → Site Settings → Environment Variables:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `GEMINI_API_KEY` - Google Gemini API key (for image generation)
- `APOLLO_API_KEY` - Apollo.io API key (for lead search)

### 2. Database Migrations
Run these SQL migrations in Supabase SQL Editor (in order):
1. `supabase/migrations/003_client_workflow.sql`
2. `supabase/migrations/004_seed_agency_clients.sql`
3. `supabase/migrations/005_strategy_columns.sql`
4. `supabase/migrations/006_content_history.sql`
5. `supabase/migrations/007_fix_discovery_columns.sql`

### 3. Build Commands
The build should run:
```bash
cd dashboard && npm install && npm run build
```

### 4. Function Dependencies
Netlify functions are in `netlify/functions/` and should auto-bundle with esbuild.

## Manual Deployment Steps

### Option 1: Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Option 2: Git Push (if auto-deploy is enabled)
```bash
git push origin main
```

### Option 3: Netlify Dashboard
1. Go to your Netlify dashboard
2. Click "Deploys" tab
3. Click "Trigger deploy" → "Deploy site"
4. Or drag & drop the `dashboard/dist` folder

## Common Issues

### Build Fails
- Check that all dependencies are installed in `dashboard/`
- Verify TypeScript compiles: `cd dashboard && npm run build`
- Check for TypeScript errors: `cd dashboard && npx tsc --noEmit`

### Functions Fail
- Verify environment variables are set
- Check function logs in Netlify dashboard
- Ensure `@netlify/functions` is in `netlify/functions/package.json`

### Database Errors
- Run all SQL migrations in order
- Check Supabase connection strings
- Verify RLS policies allow access

## Post-Deployment Verification

1. ✅ Check site loads at your Netlify URL
2. ✅ Test client selection works
3. ✅ Test Discovery page save
4. ✅ Test Content Studio blog generation
5. ✅ Test Strategy generation
6. ✅ Check function logs for errors

## Quick Fixes

If deployment fails, check:
- Netlify build logs for specific errors
- Function logs in Netlify dashboard → Functions
- Browser console for frontend errors
- Network tab for API call failures
