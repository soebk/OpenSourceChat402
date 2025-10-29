#!/bin/bash

# Chat402 - Basic cURL Example
#
# This example shows how to make a simple request using cURL
#
# Usage: ./basic-request.sh

# Set your API key (or export CHAT402_API_KEY in your shell)
API_KEY="${CHAT402_API_KEY:-your_api_key_here}"
API_URL="https://api.chat402.xyz/api/v1"

# Make the request
curl -X POST "${API_URL}/prompt" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "prompt": "What is Solana?"
  }' \
  | jq '.'

# Note: Install jq for formatted JSON output
# On macOS: brew install jq
# On Ubuntu: sudo apt-get install jq
