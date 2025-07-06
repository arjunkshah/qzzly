#!/bin/bash

# DNS Monitoring Script for qzzly.com
# This script monitors DNS propagation and tests domain setup

echo "🔍 DNS Monitoring for qzzly.com"
echo "================================"

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe qzzly --region=us-central1 --format="value(status.url)" 2>/dev/null)
SERVICE_HOST=$(echo $SERVICE_URL | sed 's|https://||')

echo "✅ Target Service: $SERVICE_URL"
echo ""

# Check current DNS resolution
echo "📊 Current DNS Resolution:"
echo "=========================="
nslookup qzzly.com
echo ""

# Check if domain resolves to our service
echo "🔍 Checking if qzzly.com resolves to our service..."
CURRENT_IP=$(nslookup qzzly.com | grep "Address:" | tail -1 | awk '{print $2}')

if [ ! -z "$CURRENT_IP" ]; then
    echo "📍 Current IP: $CURRENT_IP"
    
    # Check if it matches our service
    SERVICE_IP=$(nslookup $SERVICE_HOST | grep "Address:" | tail -1 | awk '{print $2}')
    echo "🎯 Service IP: $SERVICE_IP"
    
    if [ "$CURRENT_IP" = "$SERVICE_IP" ]; then
        echo "✅ DNS is correctly configured!"
    else
        echo "❌ DNS is not yet pointing to our service"
    fi
else
    echo "❌ Could not resolve qzzly.com"
fi

echo ""

# Test HTTP response
echo "🌐 Testing HTTP Response:"
echo "========================"
curl -I https://qzzly.com 2>/dev/null | head -10
echo ""

# Check domain verification status
echo "🔐 Domain Verification Status:"
echo "=============================="
gcloud domains list-user-verified 2>/dev/null
echo ""

# Try to create domain mapping
echo "🚀 Attempting Domain Mapping:"
echo "============================="
gcloud beta run domain-mappings create --service=qzzly --domain=qzzly.com --region=us-central1 --platform=managed 2>&1 | head -5
echo ""

echo "📝 Next Steps:"
echo "=============="
echo "1. Update DNS records in GoDaddy/Cloudflare"
echo "2. Wait for DNS propagation (can take up to 48 hours)"
echo "3. Verify domain ownership in Google Cloud Console"
echo "4. Run this script again to check progress"
echo "" 