#!/usr/bin/env node

/**
 * Update version.ts with the current version from package.json
 * This script runs automatically after npm version
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Path to version.ts
const versionTsPath = path.join(__dirname, '..', 'src', 'version.ts');

// Read current version.ts content
const versionTsContent = fs.readFileSync(versionTsPath, 'utf8');

// Replace the VERSION constant
const updatedContent = versionTsContent.replace(
  /export const VERSION = '[^']+';/,
  `export const VERSION = '${version}';`
);

// Write updated content back
fs.writeFileSync(versionTsPath, updatedContent, 'utf8');

console.log(`✅ Updated version.ts to ${version}`);
