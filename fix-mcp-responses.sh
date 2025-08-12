#!/bin/bash

echo "🔧 Fixing MCP response patterns to include _meta field..."

# Find all TypeScript files with operationComplete
files=$(grep -l "operationComplete" src/mcp/*.ts)
count=$(echo "$files" | wc -l)

echo "📂 Found $count files to fix"

for file in $files; do
  echo "  📝 Fixing $(basename $file)..."
  
  # Replace the pattern where operationComplete is followed by return result
  # Add the addTokenUsageToResponse call before returning
  sed -i '' 's/this\.logger\.operationComplete(name, result);/result = this.logger.addTokenUsageToResponse(result);\
        this.logger.operationComplete(name, result);/g' "$file"
  
  # Also handle cases with different spacing
  sed -i '' 's/this\.logger\.operationComplete(name, result);[[:space:]]*$/result = this.logger.addTokenUsageToResponse(result);\
        this.logger.operationComplete(name, result);/g' "$file"
done

echo "✅ Fixed all MCP files!"
echo ""
echo "🔍 Verifying changes..."
echo "Files now using addTokenUsageToResponse:"
grep -l "addTokenUsageToResponse" src/mcp/*.ts | wc -l

echo ""
echo "📦 Now run: npm run build"