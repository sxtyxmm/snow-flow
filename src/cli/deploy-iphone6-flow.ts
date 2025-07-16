#!/usr/bin/env node
/**
 * Deploy iPhone 6 Approval Flow to ServiceNow
 * This script creates a Flow Designer workflow for iPhone 6 request approvals
 */

import { ServiceNowClient } from '../utils/servicenow-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

async function deployIPhone6Flow() {
  console.log(chalk.cyan('\n📱 iPhone 6 Approval Flow Deployment\n'));
  
  const client = new ServiceNowClient();
  
  try {
    // Test connection first
    console.log(chalk.yellow('📡 Testing ServiceNow connection...'));
    const connectionTest = await client.testConnection();
    
    if (!connectionTest.success) {
      console.error(chalk.red('❌ Failed to connect to ServiceNow:'), connectionTest.error);
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Connected to ServiceNow successfully!'));
    
    // Load flow definition
    console.log(chalk.yellow('\n📂 Loading flow definition...'));
    const flowPath = join(process.cwd(), 'servicenow', 'flows', 'iphone6-approval-flow.json');
    const flowDefinition = JSON.parse(readFileSync(flowPath, 'utf8'));
    
    console.log(chalk.green('✅ Flow definition loaded successfully'));
    
    // Create Flow Designer workflow
    console.log(chalk.yellow('\n🔄 Creating Flow Designer workflow...'));
    
    const result = await client.createWorkflow({
      name: flowDefinition.name,
      description: flowDefinition.description,
      active: flowDefinition.active,
      workflow_version: flowDefinition.version,
      table: flowDefinition.table,
      condition: 'state=1' // Trigger on new requests
    });
    
    if (result.success) {
      console.log(chalk.green('\n✅ Flow created successfully!'));
      console.log(chalk.cyan('\n📋 Flow Details:'));
      console.log(chalk.white(`   • Flow Name: ${flowDefinition.name}`));
      console.log(chalk.white(`   • System ID: ${result.data?.sys_id}`));
      console.log(chalk.white(`   • Table: ${flowDefinition.table}`));
      console.log(chalk.white(`   • Active: ${flowDefinition.active}`));
      
      console.log(chalk.cyan('\n🔧 Flow Components:'));
      console.log(chalk.white('   • Trigger: Record Created on sc_request'));
      console.log(chalk.white('   • Condition: Check for iPhone 6 items'));
      console.log(chalk.white('   • Approval: Admin approval required'));
      console.log(chalk.white('   • Notifications: Requestor and admin notifications'));
      console.log(chalk.white('   • Actions: Approve/Reject processing'));
      
      console.log(chalk.cyan('\n📊 Flow Logic:'));
      console.log(chalk.white('   1. ✅ Check if request contains iPhone 6'));
      console.log(chalk.white('   2. 🔒 Set request to pending approval'));
      console.log(chalk.white('   3. 📋 Create admin approval task'));
      console.log(chalk.white('   4. 📧 Notify requestor of pending status'));
      console.log(chalk.white('   5. ⚖️ Process approval decision'));
      console.log(chalk.white('   6. 📬 Send approval/rejection notification'));
      console.log(chalk.white('   7. 📝 Log workflow completion'));
      
      console.log(chalk.cyan('\n🎯 Next Steps:'));
      console.log(chalk.white('1. Navigate to Flow Designer in ServiceNow'));
      console.log(chalk.white('2. Search for "iPhone 6 Request Approval Flow"'));
      console.log(chalk.white('3. Review and configure flow activities'));
      console.log(chalk.white('4. Test with a sample iPhone 6 request'));
      console.log(chalk.white('5. Activate flow when testing is complete'));
      
      console.log(chalk.cyan('\n🔗 ServiceNow Links:'));
      console.log(chalk.white('   • Flow Designer: /now/flow/designer'));
      console.log(chalk.white('   • Service Catalog: /now/sc/catalog'));
      console.log(chalk.white('   • Approval Admin: /now/nav/ui/classic/params/target/sysapproval_approver_list.do'));
      
      console.log(chalk.green('\n🎉 Flow deployment completed successfully!\n'));
      
    } else {
      console.error(chalk.red('\n❌ Failed to create flow:'), result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Deployment error:'), error);
    process.exit(1);
  }
}

// Run deployment
deployIPhone6Flow().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});