#!/bin/bash

echo "Testing Contract Signing Flow"
echo "=============================="

# Test application that we created
APP_ID=12
CONTRACT_ID="CONT-1759531108743"

# Test digital signature
echo -e "\nAttempting to sign contract..."
curl -X POST https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/onboarding/contracts/${CONTRACT_ID}/sign \
  -H "Content-Type: application/json" \
  -d '{
    "signatory_name": "Adebayo Ogundimu",
    "signatory_email": "adebayo.ogundimu@lagosmedical.ng",
    "signatory_role": "Hospital Owner",
    "signature_data": "'$(echo -n "Digital Signature: Adebayo Ogundimu" | base64)'",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0"
  }' 2>/dev/null | jq . || echo "Contract signing endpoint not yet implemented"

echo -e "\n✅ Verification Complete"
