# MagicDex Deployment Guide

This guide will help you deploy your Magic: The Gathering collection management app using Netlify and Supabase.

## Prerequisites

- Node.js 18+ installed
- Git repository
- Netlify account
- Supabase account
- Anthropic API key

## Step 1: Set up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to Settings > API to get your project URL and anon key
4. Go to Settings > Database and copy the connection string
5. Run the database migration:
   ```bash
   # Install Supabase CLI if you haven't already
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project (replace with your project reference)
   supabase link --project-ref your-project-ref
   
   # Push the database schema
   supabase db push
   ```

## Step 2: Deploy Edge Functions

Deploy the AI-powered Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy deck-builder
supabase functions deploy rules-qa
supabase functions deploy dictionary-qa

# Set environment variables for functions
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Step 4: Deploy to Netlify

### Option A: Deploy via Git (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com) and create a new site
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Deploy!

### Option B: Manual Deploy

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## Step 5: Configure Supabase Auth

1. In your Supabase dashboard, go to Authentication > Settings
2. Add your Netlify domain to "Site URL" and "Additional Redirect URLs":
   - Site URL: `https://your-app-name.netlify.app`
   - Additional Redirect URLs: `https://your-app-name.netlify.app/**`

## Step 6: Test Your Deployment

1. Visit your deployed app
2. Create an account and sign in
3. Test the main features:
   - Search for cards
   - Add cards to collection
   - Use AI deck builder
   - Ask rules questions
   - Use the dictionary feature

## Environment Variables Reference

### Frontend (Netlify)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Backend (Supabase Edge Functions)
- `ANTHROPIC_API_KEY`: Your Anthropic API key for AI features

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all environment variables are set correctly
2. **Auth not working**: Verify redirect URLs in Supabase auth settings
3. **AI features not working**: Ensure Edge Functions are deployed and ANTHROPIC_API_KEY is set
4. **Database errors**: Check that migrations were applied successfully

### Useful Commands

```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs deck-builder

# Reset local database (development)
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --local > client/src/types/database.ts
```

## Security Notes

- Never commit `.env` files to version control
- Use Row Level Security (RLS) policies (already configured)
- Regularly rotate API keys
- Monitor usage in Supabase dashboard

## Performance Optimization

- Enable caching in Netlify
- Optimize images and assets
- Use Supabase's built-in CDN for static assets
- Monitor Edge Function performance

Your MagicDex app should now be fully deployed and functional!
