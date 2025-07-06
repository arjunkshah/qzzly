#!/bin/bash

# Complete Domain Setup Script for qzzly.com
# This script automates the entire domain setup process

echo "🚀 Complete Domain Setup for qzzly.com"
echo "======================================"

# Get service details
SERVICE_URL=$(gcloud run services describe qzzly --region=us-central1 --format="value(status.url)" 2>/dev/null)
SERVICE_HOST=$(echo $SERVICE_URL | sed 's|https://||')

echo "✅ Your Quiz.io app is deployed at: $SERVICE_URL"
echo ""

# Function to check DNS propagation
check_dns() {
    echo "🔍 Checking DNS propagation..."
    CURRENT_IP=$(nslookup qzzly.com | grep "Address:" | tail -1 | awk '{print $2}')
    SERVICE_IP=$(nslookup $SERVICE_HOST | grep "Address:" | tail -1 | awk '{print $2}')
    
    if [ "$CURRENT_IP" = "$SERVICE_IP" ]; then
        echo "✅ DNS is correctly configured!"
        return 0
    else
        echo "❌ DNS is not yet pointing to our service"
        echo "📍 Current: $CURRENT_IP"
        echo "🎯 Target: $SERVICE_IP"
        return 1
    fi
}

# Function to attempt domain mapping
attempt_mapping() {
    echo "🚀 Attempting to create domain mapping..."
    gcloud beta run domain-mappings create --service=qzzly --domain=qzzly.com --region=us-central1 --platform=managed 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Domain mapping created successfully!"
        return 0
    else
        echo "❌ Domain mapping failed - domain may not be verified"
        return 1
    fi
}

# Main setup process
echo "📋 Step-by-Step Setup Instructions:"
echo "==================================="
echo ""

echo "1️⃣ DNS Configuration (Choose one option):"
echo "   ======================================"
echo ""
echo "   Option A - GoDaddy DNS:"
echo "   - Log into GoDaddy account"
echo "   - Go to DNS Management for qzzly.com"
echo "   - Add CNAME record:"
echo "     Name: @ (or leave blank)"
echo "     Value: $SERVICE_HOST"
echo "     TTL: 3600"
echo ""
echo "   Option B - Cloudflare (Recommended):"
echo "   - Sign up at https://cloudflare.com"
echo "   - Add qzzly.com to Cloudflare"
echo "   - Update nameservers at GoDaddy"
echo "   - Add CNAME: @ → $SERVICE_HOST (Proxied)"
echo ""

echo "2️⃣ Domain Verification:"
echo "   ===================="
echo "   - Go to: https://console.cloud.google.com"
echo "   - Navigate to: Cloud Run → Domain Mappings"
echo "   - Click 'Add Domain Mapping'"
echo "   - Enter: qzzly.com"
echo "   - Follow verification instructions"
echo ""

echo "3️⃣ Automated Monitoring:"
echo "   ====================="
echo "   Run this command to monitor progress:"
echo "   ./monitor-dns.sh"
echo ""

# Check current status
echo "📊 Current Status:"
echo "=================="
check_dns
echo ""

# Try domain mapping
attempt_mapping
echo ""

echo "🎯 Quick Commands:"
echo "=================="
echo "• Monitor DNS: ./monitor-dns.sh"
echo "• Check service: gcloud run services describe qzzly --region=us-central1"
echo "• View logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=qzzly' --limit=10"
echo "• Test app: curl -I $SERVICE_URL"
echo ""

echo "⏰ Expected Timeline:"
echo "===================="
echo "• DNS propagation: 15 minutes to 48 hours"
echo "• Domain verification: 5-10 minutes after DNS setup"
echo "• SSL certificate: Auto-provisioned after verification"
echo ""

echo "🎉 Once complete, your app will be available at:"
echo "   https://qzzly.com"
echo "" 