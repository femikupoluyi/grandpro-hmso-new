#!/usr/bin/env python3
import requests
import json

# List of URLs to test
urls = [
    # Nginx proxied endpoints (most likely to work)
    ("Frontend via Nginx (Port 80)", "https://80-morphvm-wz7xxc7v.http.cloud.morph.so/"),
    ("Backend via Nginx (Port 8081)", "https://8081-morphvm-wz7xxc7v.http.cloud.morph.so/health"),
    ("Backend API via Frontend Proxy", "https://80-morphvm-wz7xxc7v.http.cloud.morph.so/api/health"),
    
    # Direct port attempts
    ("Backend Direct 5001", "https://5001-morphvm-wz7xxc7v.http.cloud.morph.so/health"),
    ("Frontend Direct 3001", "https://3001-morphvm-wz7xxc7v.http.cloud.morph.so/"),
    
    # Alternative URL formats
    ("Alt Format 80", "https://morphvm-wz7xxc7v-80.http.cloud.morph.so/"),
    ("Alt Format 8081", "https://morphvm-wz7xxc7v-8081.http.cloud.morph.so/health"),
    
    # Local tests
    ("Local Backend", "http://localhost:5001/health"),
    ("Local Frontend", "http://localhost:3001/"),
    ("Local Nginx Frontend", "http://localhost:80/"),
    ("Local Nginx Backend", "http://localhost:8081/health"),
]

print("Testing GrandPro HMSO URLs...")
print("=" * 60)

for name, url in urls:
    try:
        print(f"\nTesting {name}:")
        print(f"URL: {url}")
        
        response = requests.get(url, timeout=5, verify=False)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS")
            if 'json' in response.headers.get('Content-Type', ''):
                print(f"Response: {json.dumps(response.json(), indent=2)[:200]}")
            else:
                print(f"Response: {response.text[:200]}")
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ CONNECTION ERROR: {str(e)[:100]}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)[:100]}")

print("\n" + "=" * 60)
print("Test complete!")
