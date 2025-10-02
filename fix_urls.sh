#!/bin/bash

# Test different URL patterns to find the working one
echo "Testing GrandPro HMSO External URLs"
echo "===================================="

# Array of possible URL patterns
declare -a urls=(
    "https://morphvm-wz7xxc7v.cloud.morph.so/"
    "https://morphvm-wz7xxc7v.cloud.morph.so:80/"
    "https://morphvm-wz7xxc7v.cloud.morph.so:8081/health"
    "https://wz7xxc7v.cloud.morph.so/"
    "https://wz7xxc7v.cloud.morph.so:80/"
    "https://wz7xxc7v.cloud.morph.so:8081/health"
)

for url in "${urls[@]}"; do
    echo -e "\nTesting: $url"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 3)
    if [ "$response" = "200" ]; then
        echo "✅ SUCCESS - HTTP $response"
        echo "Found working URL: $url"
        
        # Test the health endpoint if it's the base URL
        if [[ ! "$url" == */health ]]; then
            health_url="${url%/}/health"
            echo "Testing health endpoint: $health_url"
            curl -s "$health_url" | head -5
        fi
    else
        echo "❌ FAILED - HTTP $response"
    fi
done

echo -e "\n===================================="
echo "Checking local services..."
curl -s http://localhost:80/ > /dev/null && echo "✅ Frontend (nginx): OK" || echo "❌ Frontend (nginx): FAILED"
curl -s http://localhost:8081/health > /dev/null && echo "✅ Backend (nginx): OK" || echo "❌ Backend (nginx): FAILED"
curl -s http://localhost:3001/ > /dev/null && echo "✅ Frontend (direct): OK" || echo "❌ Frontend (direct): FAILED"
curl -s http://localhost:5001/health > /dev/null && echo "✅ Backend (direct): OK" || echo "❌ Backend (direct): FAILED"
