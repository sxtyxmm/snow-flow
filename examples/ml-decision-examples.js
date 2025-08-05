#!/usr/bin/env node

/**
 * ML Decision Tree Examples
 * Demonstrates when to use PI/PA vs TensorFlow.js
 */

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           🧠 Snow-Flow ML Decision Examples                      ║
╚══════════════════════════════════════════════════════════════════╝
`);

// Example 1: Standard ServiceNow Object (Incident)
console.log("📋 Example 1: Incident Classification");
console.log("─────────────────────────────────────");
console.log("Scenario: Classify incoming incidents by category");
console.log("Object: incident (standard ServiceNow table)");
console.log("Decision Path:");
console.log("  ├─ Is it standard object? ✅ YES (incident)");
console.log("  └─ Do you have PI license?");
console.log("      ├─ YES → Use ml_predictive_intelligence (95%+ accuracy)");
console.log("      └─ NO  → Use ml_train_incident_classifier (80-85% accuracy)");
console.log("\nCommand with PI: snow-flow swarm \"Use Predictive Intelligence to classify incidents\"");
console.log("Command without PI: snow-flow swarm \"Train neural network to classify incidents\"");
console.log();

// Example 2: Custom Table
console.log("📋 Example 2: Vendor Performance Prediction");
console.log("───────────────────────────────────────────");
console.log("Scenario: Predict vendor performance scores");
console.log("Object: u_vendor_performance (custom table)");
console.log("Decision Path:");
console.log("  ├─ Is it standard object? ❌ NO (u_* custom table)");
console.log("  └─ ONLY TensorFlow.js works!");
console.log("\nCommand: snow-flow swarm \"Create ML model for u_vendor_performance predictions\"");
console.log("Note: PI/PA cannot work with custom tables!");
console.log();

// Example 3: Client-Side Widget
console.log("📋 Example 3: Real-time Form Validation");
console.log("────────────────────────────────────────");
console.log("Scenario: Validate form input as user types");
console.log("Location: Service Portal Widget (browser)");
console.log("Decision Path:");
console.log("  ├─ Does it run in browser? ✅ YES");
console.log("  └─ ONLY TensorFlow.js works! (client-side ML)");
console.log("\nCommand: snow-flow swarm \"Create widget with real-time ML form validation\"");
console.log("Note: Runs instantly without server calls!");
console.log();

// Example 4: Privacy-Sensitive Data
console.log("📋 Example 4: HR Salary Predictor");
console.log("──────────────────────────────────");
console.log("Scenario: Predict salary ranges for job postings");
console.log("Data: Sensitive HR information");
console.log("Decision Path:");
console.log("  ├─ Is it privacy-sensitive? ✅ YES");
console.log("  └─ Use TensorFlow.js (data stays in browser)");
console.log("\nCommand: snow-flow swarm \"Build salary predictor that keeps data client-side\"");
console.log("Note: No sensitive data sent to server!");
console.log();

// Example 5: Hybrid Approach
console.log("📋 Example 5: Advanced Incident Resolution");
console.log("──────────────────────────────────────────");
console.log("Scenario: Combine PI's accuracy with custom patterns");
console.log("Object: incident + custom analysis");
console.log("Decision Path:");
console.log("  ├─ Need both platform knowledge AND custom patterns");
console.log("  └─ Use ml_hybrid_recommendation");
console.log("\nCommand: snow-flow swarm \"Create incident resolver using hybrid ML approach\"");
console.log("Benefits:");
console.log("  • PI for similar incident matching (95%+ accuracy)");
console.log("  • TensorFlow for custom pattern detection");
console.log("  • Fallback when one system unavailable");
console.log();

// Example 6: Offline Mobile
console.log("📋 Example 6: Offline Mobile Predictions");
console.log("────────────────────────────────────────");
console.log("Scenario: Mobile app that works without connection");
console.log("Requirement: Must work offline");
console.log("Decision Path:");
console.log("  ├─ Must work offline? ✅ YES");
console.log("  └─ TensorFlow.js with local model storage");
console.log("\nCommand: snow-flow swarm \"Create offline-capable ML for mobile field service app\"");
console.log("Note: Model downloaded once, predictions work offline!");
console.log();

// Summary
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        🎯 Quick Reference                         ║
╠══════════════════════════════════════════════════════════════════╣
║ Use PI/PA when:           │ Use TensorFlow.js when:           ║
║ ─────────────────────────┼─────────────────────────────────  ║
║ • Standard objects       │ • Custom tables (u_*)              ║
║ • Have licenses          │ • Client-side predictions          ║
║ • Need 95%+ accuracy     │ • Privacy-sensitive data           ║
║ • Platform integration   │ • Offline requirements             ║
║                          │ • No licenses available            ║
╚══════════════════════════════════════════════════════════════════╝

💡 Pro Tip: Always check for PI/PA first - they give superior results!
           But TensorFlow.js has unique capabilities PI/PA can't match.
`);