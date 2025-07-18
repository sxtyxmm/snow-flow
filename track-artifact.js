#!/usr/bin/env node
/**
 * Track Artifact in Update Set
 * This utility helps track artifacts in the iPhone 6 Update Set
 */

const fs = require('fs').promises;
const path = require('path');

class UpdateSetTracker {
  constructor() {
    this.memoryDir = path.join(process.cwd(), 'memory', 'update-set-sessions');
    this.updateSetId = '1021793183f6ea102a7ea130ceaad31b';
    this.sessionFile = path.join(this.memoryDir, `${this.updateSetId}.json`);
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async loadSession() {
    try {
      const data = await fs.readFile(this.sessionFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Create new session if file doesn't exist
      return {
        update_set_id: this.updateSetId,
        name: 'iPhone 6 Approval Flow',
        description: 'Implementation of approval workflow for iPhone 6 requests. This update set contains the flow that requires admin approval for all iPhone 6 requests from the service catalog. The flow will automatically route requests to administrators for approval before fulfillment.',
        user_story: 'STORY-001: iPhone 6 Admin Approval Requirement',
        created_at: new Date().toISOString(),
        state: 'in_progress',
        artifacts: []
      };
    }
  }

  async saveSession(session) {
    await this.ensureDirectory();
    await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
  }

  async trackArtifact(type, sys_id, name, description = '') {
    console.log(`📦 Tracking artifact: ${name} (${type})`);
    
    const session = await this.loadSession();
    
    // Check if artifact already exists
    const existingArtifact = session.artifacts.find(a => a.sys_id === sys_id);
    if (existingArtifact) {
      console.log(`⚠️  Artifact already tracked: ${name}`);
      return session;
    }

    // Add new artifact
    const artifact = {
      type,
      sys_id,
      name,
      description,
      created_at: new Date().toISOString(),
      status: 'tracked'
    };

    session.artifacts.push(artifact);
    await this.saveSession(session);

    console.log(`✅ Artifact tracked successfully!`);
    console.log(`📋 Total artifacts in Update Set: ${session.artifacts.length}`);
    
    return session;
  }

  async listArtifacts() {
    const session = await this.loadSession();
    
    console.log(`📋 Update Set: ${session.name}`);
    console.log(`📦 Total artifacts: ${session.artifacts.length}`);
    console.log(`🔗 Update Set ID: ${session.update_set_id}`);
    console.log('');
    
    if (session.artifacts.length === 0) {
      console.log('No artifacts tracked yet.');
      return session;
    }

    console.log('Tracked artifacts:');
    session.artifacts.forEach((artifact, index) => {
      console.log(`${index + 1}. ${artifact.type}: ${artifact.name}`);
      console.log(`   - Sys ID: ${artifact.sys_id}`);
      console.log(`   - Added: ${new Date(artifact.created_at).toLocaleString()}`);
      if (artifact.description) {
        console.log(`   - Description: ${artifact.description}`);
      }
      console.log('');
    });

    return session;
  }

  async getUpdateSetSummary() {
    const session = await this.loadSession();
    
    const summary = {
      update_set_id: session.update_set_id,
      name: session.name,
      description: session.description,
      user_story: session.user_story,
      state: session.state,
      total_artifacts: session.artifacts.length,
      artifacts_by_type: {},
      created_at: session.created_at,
      last_updated: new Date().toISOString()
    };

    // Group artifacts by type
    session.artifacts.forEach(artifact => {
      if (!summary.artifacts_by_type[artifact.type]) {
        summary.artifacts_by_type[artifact.type] = 0;
      }
      summary.artifacts_by_type[artifact.type]++;
    });

    return summary;
  }
}

// CLI Interface
async function main() {
  const tracker = new UpdateSetTracker();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Update Set Artifact Tracker');
    console.log('');
    console.log('Usage:');
    console.log('  node track-artifact.js list                           - List all tracked artifacts');
    console.log('  node track-artifact.js track <type> <sys_id> <name>   - Track new artifact');
    console.log('  node track-artifact.js summary                        - Show Update Set summary');
    console.log('');
    console.log('Examples:');
    console.log('  node track-artifact.js track flow abc123 "iPhone 6 Approval Flow"');
    console.log('  node track-artifact.js track widget def456 "iPhone 6 Widget"');
    return;
  }

  const command = args[0];
  
  try {
    switch (command) {
      case 'list':
        await tracker.listArtifacts();
        break;
        
      case 'track':
        if (args.length < 4) {
          console.error('❌ Usage: node track-artifact.js track <type> <sys_id> <name>');
          process.exit(1);
        }
        const [, type, sys_id, name] = args;
        const description = args[4] || '';
        await tracker.trackArtifact(type, sys_id, name, description);
        break;
        
      case 'summary':
        const summary = await tracker.getUpdateSetSummary();
        console.log('📊 Update Set Summary:');
        console.log(`   - Name: ${summary.name}`);
        console.log(`   - ID: ${summary.update_set_id}`);
        console.log(`   - User Story: ${summary.user_story}`);
        console.log(`   - State: ${summary.state}`);
        console.log(`   - Total Artifacts: ${summary.total_artifacts}`);
        console.log(`   - Created: ${new Date(summary.created_at).toLocaleString()}`);
        console.log('');
        if (Object.keys(summary.artifacts_by_type).length > 0) {
          console.log('Artifacts by type:');
          Object.entries(summary.artifacts_by_type).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count}`);
          });
        }
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { UpdateSetTracker };