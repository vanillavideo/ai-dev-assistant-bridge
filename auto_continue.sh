#!/bin/bash
# auto_continue.sh
# Sends periodic "continue" messages to the AI Agent Feedback Bridge extension

MESSAGE="Continue with tasks, improvements, code coverage, please. Prioritize improvements, code robustness, maintainability. Cleanup unused files if you need to. Periodically commit."

echo "[auto-continue] ▶️ Starting persistent loop..."
echo "[auto-continue] 🎯 Target: http://localhost:3737"
echo "[auto-continue] ⏱️  Interval: 30 seconds"
echo ""

while true; do
  # Get current timestamp
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Build JSON payload
  JSON_PAYLOAD=$(cat <<EOF
{
  "message": "$MESSAGE",
  "context": {
    "timestamp": "$TIMESTAMP",
    "source": "auto_continue_script",
    "iteration": "$ITERATION_COUNT"
  }
}
EOF
)
  
  # Send POST request
  RESPONSE=$(curl -s -X POST http://localhost:3737 \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")
  
  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "[auto-continue] ✅ $(date '+%H:%M:%S') - Sent successfully"
  else
    echo "[auto-continue] ❌ $(date '+%H:%M:%S') - Failed: $RESPONSE"
  fi
  
  # Increment counter
  ITERATION_COUNT=$((ITERATION_COUNT + 1))
  
  # Wait 30 seconds
  sleep 30
done
