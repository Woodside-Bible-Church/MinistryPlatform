#!/bin/bash

# Test script to check MP API access
# Replace YOUR_TOKEN with the actual token from localStorage

TOKEN="YOUR_TOKEN_HERE"

echo "Testing basic Feedback table access..."
curl -X GET \
  "https://my.woodsidebible.org/ministryplatformapi/tables/Feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\nTesting with filters..."
curl -X GET \
  "https://my.woodsidebible.org/ministryplatformapi/tables/Feedback?\$filter=Approved=1&\$top=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
