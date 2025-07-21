/**
 * SPARC Help System
 * Comprehensive documentation for team-based and specialist SPARC modes
 */

import { TEAM_SPARC_MODES, SPECIALIST_SPARC_MODES } from './modes/team-modes.js';
import { VERSION } from '../version.js';

export function displayTeamHelp(): void {
  console.log(`
🚀 SPARC Team Development System v${VERSION}
===============================================

SPARC (Specialized Process & Automation Resource Coordination) provides both predefined development teams and individual specialist modes for ServiceNow development.

📋 PREDEFINED DEVELOPMENT TEAMS
===============================

${Object.entries(TEAM_SPARC_MODES).map(([key, mode]) => `
🎯 ${key.toUpperCase()} TEAM
   ${mode.description}
   
   👥 Team Composition:
      Coordinator: ${mode.coordinator}
      Specialists: ${mode.specialists.join(', ')}
   
   🛠️  Capabilities:
${mode.capabilities.map(cap => `      • ${cap}`).join('\n')}
   
   📚 Example Tasks:
${mode.examples.slice(0, 3).map(ex => `      • ${ex}`).join('\n')}
   
   ⏱️  Estimated Duration: ${mode.estimatedTime}
   🔧 Complexity Level: ${mode.complexity}
   
   📋 Usage:
      snow-flow sparc team ${key} "your task description"
      snow-flow sparc team ${key} "your task" --parallel --monitor
`).join('\n')}

👨‍💻 INDIVIDUAL SPECIALIST MODES
================================

${Object.entries(SPECIALIST_SPARC_MODES).map(([key, mode]) => `
🔧 ${key.toUpperCase()} SPECIALIST
   ${mode.description}
   
   🎯 Domain: ${mode.domain}
   
   🛠️  Capabilities:
${mode.capabilities.map(cap => `      • ${cap}`).join('\n')}
   
   📚 Example Tasks:
${mode.examples.slice(0, 2).map(ex => `      • ${ex}`).join('\n')}
   
   ⏱️  Estimated Duration: ${mode.estimatedTime}
   🔧 Complexity Level: ${mode.complexity}
   
   📋 Usage:
      snow-flow sparc ${key} "your specialized task"
`).join('\n')}

🔧 COMMAND OPTIONS & FLAGS
==========================

Team Mode Options:
  --parallel              Enable parallel execution of team members
  --monitor              Real-time progress monitoring dashboard
  --shared-memory        Enable shared context between agents (default: true)
  --validation           Enable quality gates between handoffs (default: true)
  --dry-run              Preview team assembly without execution
  --max-agents <n>       Maximum number of agents (default: 5)

Specialist Mode Options:
  --dry-run              Preview execution without running
  --monitor              Real-time progress monitoring

Quality Control Options:
  --no-shared-memory     Disable shared context between agents
  --no-validation        Disable quality gates (faster but less safe)

🎯 USAGE PATTERNS
=================

1. QUICK DEVELOPMENT (Team Mode):
   snow-flow sparc team widget "Create incident dashboard"
   snow-flow sparc team flow "Approval process for requests"

2. SPECIALIZED WORK (Individual Mode):
   snow-flow sparc frontend "Optimize mobile responsiveness"
   snow-flow sparc security "Review access controls"

3. COMPLEX PROJECTS (Adaptive Team):
   snow-flow sparc team adaptive "Integration with external API"

4. PARALLEL DEVELOPMENT:
   snow-flow sparc team app "Asset management system" --parallel --monitor

5. PREVIEW MODE (No Execution):
   snow-flow sparc team widget "dashboard" --dry-run

🏗️  WORKFLOW COORDINATION
=========================

Team Execution Flow:
1. 🔍 Task Analysis - Analyze requirements and complexity
2. 👥 Team Assembly - Select optimal specialists 
3. 📋 Project Planning - Create detailed execution plan
4. ⚡ Coordinated Execution - Execute with handoffs and validation
5. 🔍 Quality Validation - Validate deliverables against criteria
6. 📦 Artifact Delivery - Package and deliver results

Quality Gates:
• Requirements Review - Ensure clear and complete requirements
• Architecture Review - Validate design follows best practices  
• Code Quality Review - Check standards and security compliance
• Integration Testing - Verify component integration
• Performance Validation - Ensure performance targets are met

🎯 TEAM SELECTION GUIDE
=======================

Use WIDGET TEAM when:
• Creating Service Portal widgets
• Building dashboards or UI components
• Developing user interfaces
• Integrating with ServiceNow APIs

Use FLOW TEAM when:
• Creating approval workflows
• Building automation processes
• Designing integration flows
• Implementing business processes

Use APPLICATION TEAM when:
• Building complete applications
• Creating new modules
• Developing comprehensive solutions
• Implementing complex business logic

Use ADAPTIVE TEAM when:
• Requirements are unclear or complex
• Cross-domain expertise needed
• Custom or unusual tasks
• Learning new patterns

Use SPECIALIST MODES when:
• Focused expertise needed
• Single-domain tasks
• Quick modifications
• Learning specific skills

🚀 PERFORMANCE OPTIMIZATION
============================

For Maximum Speed:
• Use --parallel flag for independent tasks
• Disable validation for trusted workflows (--no-validation)
• Use specialist modes for focused work

For Maximum Quality:
• Enable all validation gates (default)
• Use shared memory for context (default)
• Use team modes for complex work
• Enable monitoring for oversight

For Learning & Exploration:
• Use --dry-run to understand approaches
• Use adaptive team for unknown domains
• Enable monitoring to see coordination
• Review team capabilities before starting

🔗 INTEGRATION WITH EXISTING TOOLS
===================================

SPARC integrates seamlessly with:
• Snow-Flow swarm commands
• ServiceNow MCP servers
• Update Set management
• Claude Code orchestration
• Memory management system

Example Integration:
  snow-flow swarm "Create widget" --strategy development
  snow-flow sparc team widget "detailed implementation"
  snow-flow memory store "widget_specs" "implementation details"

📚 ADDITIONAL RESOURCES
=======================

For more information:
• Run 'snow-flow sparc' for quick reference
• Check .claude/commands/sparc/ for mode documentation
• Review CLAUDE.md for integration patterns
• Use --help flag on any command for details

💡 TIPS & BEST PRACTICES
=========================

1. Start with team modes for learning ServiceNow patterns
2. Use specialist modes once you understand the domain
3. Always use --dry-run first for complex tasks
4. Enable monitoring for team coordination insights
5. Use adaptive teams for exploratory development
6. Combine with swarm commands for full orchestration
7. Store results in memory for later reference
8. Use validation gates for production-quality work

Happy building with SPARC! 🚀
  `);
}

export function displayQuickReference(): void {
  console.log(`
🚀 SPARC Quick Reference

📋 TEAM COMMANDS:
  sparc team widget <task>       Widget Development Team
  sparc team flow <task>         Flow Development Team  
  sparc team app <task>          Application Development Team
  sparc team adaptive <task>     Adaptive Team

👨‍💻 SPECIALIST COMMANDS:
  sparc frontend <task>          Frontend Specialist
  sparc backend <task>           Backend Specialist
  sparc security <task>          Security Specialist
  sparc database <task>          Database Specialist

🔧 COMMON OPTIONS:
  --parallel                     Parallel execution
  --monitor                      Progress monitoring
  --dry-run                      Preview only
  --max-agents <n>              Team size limit

📚 EXAMPLES:
  snow-flow sparc team widget "Create incident dashboard"
  snow-flow sparc frontend "Optimize mobile UI"
  snow-flow sparc team flow "Build approval process" --parallel

Use 'sparc help' for complete documentation.
  `);
}

export function displayModeCapabilities(mode: string): void {
  const teamMode = TEAM_SPARC_MODES[mode.toLowerCase()];
  const specialistMode = SPECIALIST_SPARC_MODES[mode.toLowerCase()];
  
  if (teamMode) {
    console.log(`
🎯 ${mode.toUpperCase()} TEAM CAPABILITIES

${teamMode.description}

👥 Team Composition:
   Coordinator: ${teamMode.coordinator}
   Specialists: ${teamMode.specialists.join(', ')}

🛠️  Core Capabilities:
${teamMode.capabilities.map(cap => `   • ${cap}`).join('\n')}

📚 Example Use Cases:
${teamMode.examples.map(ex => `   • ${ex}`).join('\n')}

⏱️  Estimated Duration: ${teamMode.estimatedTime}
🔧 Complexity Level: ${teamMode.complexity}

${teamMode.dependencies ? `🔗 Dependencies:\n${teamMode.dependencies.map(dep => `   • ${dep}`).join('\n')}` : ''}

📋 Usage:
   snow-flow sparc team ${mode} "your task description"
    `);
  } else if (specialistMode) {
    console.log(`
🔧 ${mode.toUpperCase()} SPECIALIST CAPABILITIES

${specialistMode.description}

🎯 Domain: ${specialistMode.domain}

🛠️  Core Capabilities:
${specialistMode.capabilities.map(cap => `   • ${cap}`).join('\n')}

📚 Example Use Cases:
${specialistMode.examples.map(ex => `   • ${ex}`).join('\n')}

⏱️  Estimated Duration: ${specialistMode.estimatedTime}
🔧 Complexity Level: ${specialistMode.complexity}

📋 Usage:
   snow-flow sparc ${mode} "your specialized task"
    `);
  } else {
    console.log(`❌ Unknown mode: ${mode}`);
    console.log('Available modes: ' + [...Object.keys(TEAM_SPARC_MODES), ...Object.keys(SPECIALIST_SPARC_MODES)].join(', '));
  }
}