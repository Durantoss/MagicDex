# MagicDex Production Deployment Guide

## Overview
This guide covers deploying MagicDex to production with a fully functional Supabase backend.

## Prerequisites
- Supabase project with valid credentials
- Node.js 18+ installed
- Domain name (optional, for custom domain)

## Production Setup

### 1. Environment Configuration
The app is configured to use the production Supabase instance:
- **Supabase URL**: `https://reeijsdzozdvnbkbngid.supabase.co`
- **Environment files**: 
  - `client/.env` - Development environment
  - `client/.env.production` - Production environment

### 2. Database Schema
The production database includes:
- **Collections table** with foil support (normal_quantity, foil_quantity)
- **Wishlists table** with foil support
- **Trading profiles** and **trade interests** tables
- **RPC functions**: `upsert_collection_entry`, `upsert_wishlist_entry`
- **Row Level Security (RLS)** policies for data protection
- **Views**: `collection_stats`, `wishlist_stats`

### 3. Build Commands

#### Development
```bash
npm run dev
```

#### Production Build
```bash
npm run build:prod
```

#### Production Preview
```bash
npm run preview:prod
```

#### Full Production Start
```bash
npm start
```

### 4. Deployment Options

#### Option A: Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   ```
   VITE_SUPABASE_URL=https://reeijsdzozdvnbkbngid.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Option B: Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build:prod`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard

#### Option C: Manual Server Deployment
1. Build the application:
   ```bash
   npm run build:prod
   ```
2. Copy the `dist` folder to your web server
3. Configure your web server to serve the static files
4. Set up HTTPS (recommended)

### 5. Supabase Configuration

#### Required Tables and Functions
The following are already configured in your Supabase instance:

**Tables:**
- `collections` - User card collections with foil support
- `wishlists` - User wishlists with foil support
- `trading_profiles` - User trading information
- `trade_interests` - Trading requests between users
- `trade_cards` - Cards involved in trades

**RPC Functions:**
- `upsert_collection_entry(p_user_id, p_card_id, p_normal_quantity, p_foil_quantity, p_card_data)`
- `upsert_wishlist_entry(p_user_id, p_card_id, p_normal_quantity, p_foil_quantity, p_priority, p_card_data)`

**Views:**
- `collection_stats` - Aggregated collection statistics
- `wishlist_stats` - Aggregated wishlist statistics

#### Authentication Setup
- Email/password authentication is enabled
- Row Level Security (RLS) is configured
- Users can only access their own data

### 6. Features Available in Production

#### Core Features
- ✅ Card search via Scryfall API
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Collection management (add/remove cards)
- ✅ Wishlist management
- ✅ Foil card support (normal and foil quantities)
- ✅ Card pricing and market data
- ✅ Responsive design (mobile-friendly)

#### Advanced Features
- ✅ AI-powered deck building (requires Anthropic API key)
- ✅ Rules Q&A system
- ✅ Dictionary lookup
- ✅ Card scanner (OCR functionality)
- ✅ Trading system (basic structure)

### 7. Environment Variables

#### Required for Production
```env
VITE_SUPABASE_URL=https://reeijsdzozdvnbkbngid.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Optional (for AI features)
```env
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 8. Performance Optimizations

#### Already Implemented
- Vite build optimization
- Code splitting
- Image lazy loading
- React Query caching
- Responsive images

#### Recommended
- CDN for static assets
- Gzip compression
- Browser caching headers
- Service worker for offline functionality

### 9. Monitoring and Analytics

#### Supabase Dashboard
- Monitor database performance
- Track user authentication
- View API usage statistics

#### Recommended Tools
- Google Analytics for user tracking
- Sentry for error monitoring
- Lighthouse for performance auditing

### 10. Security Considerations

#### Already Implemented
- Row Level Security (RLS) in Supabase
- Environment variable protection
- HTTPS enforcement (when deployed)
- Input validation and sanitization

#### Recommended
- Content Security Policy (CSP) headers
- Rate limiting for API endpoints
- Regular security audits

### 11. Backup and Recovery

#### Database Backups
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Manual backup exports possible

#### Code Backups
- GitHub repository serves as code backup
- Tag releases for version control

### 12. Scaling Considerations

#### Current Limits
- Supabase free tier: 500MB database, 2GB bandwidth
- Scryfall API: Rate limited but generous for personal use

#### Scaling Options
- Upgrade Supabase plan for higher limits
- Implement caching for frequently accessed data
- Consider CDN for card images

## Testing Production Build

1. **Build the application:**
   ```bash
   npm run build:prod
   ```

2. **Test locally:**
   ```bash
   npm run preview:prod
   ```

3. **Verify functionality:**
   - User registration/login
   - Card search
   - Collection management
   - Wishlist functionality
   - All responsive breakpoints

## Troubleshooting

### Common Issues
1. **Environment variables not loading**: Ensure `.env.production` is properly configured
2. **Supabase connection errors**: Verify URL and API keys
3. **Build failures**: Check for TypeScript errors with `npm run check`
4. **Authentication issues**: Verify Supabase auth settings

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check Supabase logs in dashboard
4. Test with different browsers/devices

## Support
For issues or questions:
1. Check the GitHub repository issues
2. Review Supabase documentation
3. Check Scryfall API documentation
4. Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
