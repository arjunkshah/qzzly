#!/bin/bash

# Quiz.io Domain Setup Script
# This script helps automate the domain setup process for qzzly.com

echo "🌐 Quiz.io Domain Setup Script"
echo "================================"

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe qzzly --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Error: Could not get Cloud Run service URL"
    exit 1
fi

echo "✅ Cloud Run Service URL: $SERVICE_URL"
echo ""

echo "📋 DNS Configuration Instructions:"
echo "=================================="
echo ""
echo "1. Log into your GoDaddy account (where qzzly.com is registered)"
echo "2. Go to DNS Management for qzzly.com"
echo "3. Add/Update the following DNS records:"
echo ""
echo "   CNAME Record:"
echo "   - Name: @ (or leave blank for root domain)"
echo "   - Value: $(echo $SERVICE_URL | sed 's|https://||')"
echo "   - TTL: 3600 (or default)"
echo ""
echo "   OR if you want www subdomain:"
echo "   - Name: www"
echo "   - Value: $(echo $SERVICE_URL | sed 's|https://||')"
echo "   - TTL: 3600 (or default)"
echo ""

echo "🔧 Alternative: Use Cloudflare (Recommended)"
echo "============================================="
echo ""
echo "1. Sign up for Cloudflare (free): https://cloudflare.com"
echo "2. Add qzzly.com to Cloudflare"
echo "3. Update nameservers at GoDaddy to Cloudflare's nameservers"
echo "4. Add CNAME record in Cloudflare:"
echo "   - Name: @"
echo "   - Target: $(echo $SERVICE_URL | sed 's|https://||')"
echo "   - Proxy status: Proxied (orange cloud)"
echo ""

echo "🌐 Domain Verification Steps:"
echo "============================="
echo ""
echo "1. Go to: https://console.cloud.google.com"
echo "2. Navigate to: Cloud Run → Domain Mappings"
echo "3. Click 'Add Domain Mapping'"
echo "4. Enter: qzzly.com"
echo "5. Select service: qzzly"
echo "6. Follow verification instructions"
echo ""

echo "✅ After DNS is configured, run:"
echo "gcloud beta run domain-mappings create --service=qzzly --domain=qzzly.com --region=us-central1 --platform=managed"
echo ""

echo "🧪 Test your setup:"
echo "curl -I https://qzzly.com"
echo ""

echo "📝 Current Status:"
echo "=================="
echo "✅ App deployed: $SERVICE_URL"
echo "⏳ Domain verification: Pending"
echo "⏳ Custom domain: qzzly.com (pending DNS setup)"
echo "" 