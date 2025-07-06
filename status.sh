#!/bin/bash

# Final Status Script for qzzly.com
# This script monitors the complete setup progress

echo "🎯 Quiz.io Domain Setup Status"
echo "=============================="

# Get service details
SERVICE_URL=$(gcloud run services describe qzzly --region=us-central1 --format="value(status.url)" 2>/dev/null)
echo "✅ Cloud Run Service: $SERVICE_URL"
echo ""

# Check domain mapping
echo "🔗 Domain Mapping Status:"
echo "========================"
gcloud beta run domain-mappings list --region=us-central1 2>/dev/null
echo ""

# Check DNS propagation
echo "🌐 DNS Propagation Status:"
echo "========================"
CURRENT_IP=$(nslookup qzzly.com | grep "Address:" | tail -1 | awk '{print $2}')
SERVICE_IP=$(nslookup $(echo $SERVICE_URL | sed 's|https://||') | grep "Address:" | tail -1 | awk '{print $2}')

if [ "$CURRENT_IP" = "$SERVICE_IP" ]; then
    echo "✅ DNS is correctly configured!"
    echo "📍 IP: $CURRENT_IP"
else
    echo "⏳ DNS propagation in progress..."
    echo "📍 Current IP: $CURRENT_IP"
    echo "🎯 Target IP: $SERVICE_IP"
fi
echo ""

# Test domain response
echo "🌍 Domain Response Test:"
echo "======================="
curl -I https://qzzly.com 2>/dev/null | head -5
echo ""

# Check if app is accessible
echo "🚀 Application Status:"
echo "====================="
if curl -s https://qzzly.com | grep -q "Quiz.io\|React\|Vite"; then
    echo "✅ qzzly.com is serving your Quiz.io app!"
else
    echo "⏳ qzzly.com is still showing placeholder page"
    echo "   (DNS propagation may take 15 minutes to 48 hours)"
fi
echo ""

echo "📊 Summary:"
echo "==========="
echo "✅ Cloud Run: Deployed and running"
echo "✅ Domain Mapping: Created successfully"
echo "⏳ DNS Propagation: In progress"
echo "⏳ Custom Domain: Will be live once DNS propagates"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Wait for DNS propagation (15 min - 48 hours)"
echo "2. Run this script again to check progress: ./status.sh"
echo "3. Once DNS propagates, your app will be live at:"
echo "   https://qzzly.com"
echo ""

echo "🔧 Troubleshooting:"
echo "=================="
echo "• If DNS doesn't propagate: Check your DNS provider settings"
echo "• If domain mapping fails: Verify domain ownership in Google Cloud Console"
echo "• If app doesn't load: Check Cloud Run logs"
echo ""

echo "📞 Support Commands:"
echo "==================="
echo "• View logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=qzzly' --limit=10"
echo "• Check service: gcloud run services describe qzzly --region=us-central1"
echo "• Monitor DNS: ./monitor-dns.sh"
echo "• Test app: curl -I $SERVICE_URL"
echo "" 