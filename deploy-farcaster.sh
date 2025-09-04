#!/bin/bash

# ZeroSum Farcaster Mini App Deployment Script

echo "🚀 Deploying ZeroSum to Farcaster..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Vercel (or your preferred hosting)
echo "🌐 Deploying to Vercel..."
npx vercel --prod

# Generate Farcaster manifest credentials
echo "📝 Generating Farcaster manifest credentials..."
echo "💡 You'll need to connect your Farcaster custody wallet and add your deployed URL"
node scripts/generate-farcaster-manifest.js

echo "🎉 Deployment complete!"
echo "📱 Your Farcaster Mini App is ready!"
echo "🔗 Share the link in Farcaster to test the Mini App"
echo ""
echo "📋 Next steps:"
echo "   1. Update your .env with the generated credentials"
echo "   2. Redeploy if needed"
echo "   3. Test in Farcaster by sharing your URL"
