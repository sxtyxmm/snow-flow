#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function postInstall() {
  console.log('Running post-install setup...');

  // Create necessary directories
  const directories = [
    'memory',
    'memory/sessions',
    'memory/agents',
    'logs',
    'workflows',
    'config'
  ];

  for (const dir of directories) {
    const dirPath = path.join(projectRoot, dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`✗ Failed to create directory ${dir}:`, error);
      }
    }
  }

  // Create default config file if it doesn't exist
  const configPath = path.join(projectRoot, 'config', 'default.json');
  try {
    await fs.access(configPath);
  } catch {
    const defaultConfig = {
      orchestrator: {
        maxAgents: 10,
        topology: 'hierarchical',
        strategy: 'adaptive'
      },
      memory: {
        cleanupInterval: 300000,
        maxEntries: 10000
      },
      logging: {
        level: 'info',
        enabled: true
      }
    };

    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✓ Created default configuration file');
  }

  console.log('\nPost-install setup completed!');
  console.log('Run "npm run build" to build the project');
  console.log('Then use "snow-flow --help" to see available commands');
}

postInstall().catch(console.error);