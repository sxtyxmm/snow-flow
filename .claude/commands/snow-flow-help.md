---
name: snow-flow-help
description: Show Snow-Flow commands and usage with batchtools optimization
---

# Snow-Flow Commands (Batchtools Optimized)

## 🌊 Snow-Flow: Advanced Agent Orchestration Platform

Snow-Flow is the ultimate multi-terminal orchestration platform that revolutionizes how you work with Claude Code.

**🚀 Batchtools Enhancement**: All commands now include parallel processing capabilities, batch operations, and performance optimizations for maximum efficiency.

## Core Commands (Enhanced)

### 🚀 System Management
- `./snow-flow start` - Start orchestration system
- `./snow-flow start --ui` - Start with interactive process management UI
- `./snow-flow start --parallel` - Start with enhanced parallel processing
- `./snow-flow status` - Check system status
- `./snow-flow status --concurrent` - Check status with parallel monitoring
- `./snow-flow monitor` - Real-time monitoring
- `./snow-flow monitor --performance` - Enhanced performance monitoring
- `./snow-flow stop` - Stop orchestration

### 🤖 Agent Management (Parallel)
- `./snow-flow agent spawn <type>` - Create new agent
- `./snow-flow agent batch-spawn <config>` - Create multiple agents in parallel
- `./snow-flow agent list` - List active agents
- `./snow-flow agent parallel-status` - Check all agent status concurrently
- `./snow-flow agent info <id>` - Agent details
- `./snow-flow agent terminate <id>` - Stop agent
- `./snow-flow agent batch-terminate <ids>` - Stop multiple agents in parallel

### 📋 Task Management (Concurrent)
- `./snow-flow task create <type> "description"` - Create task
- `./snow-flow task batch-create <tasks-file>` - Create multiple tasks in parallel
- `./snow-flow task list` - List all tasks
- `./snow-flow task parallel-status` - Check all task status concurrently
- `./snow-flow task status <id>` - Task status
- `./snow-flow task cancel <id>` - Cancel task
- `./snow-flow task batch-cancel <ids>` - Cancel multiple tasks in parallel
- `./snow-flow task workflow <file>` - Execute workflow
- `./snow-flow task parallel-workflow <files>` - Execute multiple workflows concurrently

### 🧠 Memory Operations (Batch Enhanced)
- `./snow-flow memory store "key" "value"` - Store data
- `./snow-flow memory batch-store <entries-file>` - Store multiple entries in parallel
- `./snow-flow memory query "search"` - Search memory
- `./snow-flow memory parallel-query <queries>` - Execute multiple queries concurrently
- `./snow-flow memory stats` - Memory statistics
- `./snow-flow memory stats --concurrent` - Parallel memory analysis
- `./snow-flow memory export <file>` - Export memory
- `./snow-flow memory concurrent-export <namespaces>` - Export multiple namespaces in parallel
- `./snow-flow memory import <file>` - Import memory
- `./snow-flow memory batch-import <files>` - Import multiple files concurrently

### ⚡ SPARC Development (Optimized)
- `./snow-flow sparc "task"` - Run SPARC orchestrator
- `./snow-flow sparc parallel "tasks"` - Run multiple SPARC tasks concurrently
- `./snow-flow sparc modes` - List all 17+ SPARC modes
- `./snow-flow sparc run <mode> "task"` - Run specific mode
- `./snow-flow sparc batch <modes> "task"` - Run multiple modes in parallel
- `./snow-flow sparc tdd "feature"` - TDD workflow
- `./snow-flow sparc concurrent-tdd <features>` - Parallel TDD for multiple features
- `./snow-flow sparc info <mode>` - Mode details

### 🐝 Swarm Coordination (Enhanced)
- `./snow-flow swarm "task" --strategy <type>` - Start swarm
- `./snow-flow swarm "task" --background` - Long-running swarm
- `./snow-flow swarm "task" --monitor` - With monitoring
- `./snow-flow swarm "task" --ui` - Interactive UI
- `./snow-flow swarm "task" --distributed` - Distributed coordination
- `./snow-flow swarm batch <tasks-config>` - Multiple swarms in parallel
- `./snow-flow swarm concurrent "tasks" --parallel` - Concurrent swarm execution

### 🌍 MCP Integration (Parallel)
- `./snow-flow mcp status` - MCP server status
- `./snow-flow mcp parallel-status` - Check all MCP servers concurrently
- `./snow-flow mcp tools` - List available tools
- `./snow-flow mcp config` - Show configuration
- `./snow-flow mcp logs` - View MCP logs
- `./snow-flow mcp batch-logs <servers>` - View multiple server logs in parallel

### 🤖 Claude Integration (Enhanced)
- `./snow-flow claude spawn "task"` - Spawn Claude with enhanced guidance
- `./snow-flow claude batch-spawn <tasks>` - Spawn multiple Claude instances in parallel
- `./snow-flow claude batch <file>` - Execute workflow configuration

### 🚀 Batchtools Commands (New)
- `./snow-flow batchtools status` - Check batchtools system status
- `./snow-flow batchtools monitor` - Real-time performance monitoring
- `./snow-flow batchtools optimize` - System optimization recommendations
- `./snow-flow batchtools benchmark` - Performance benchmarking
- `./snow-flow batchtools config` - Batchtools configuration management

## 🌟 Quick Examples (Optimized)

### Initialize with enhanced SPARC:
```bash
npx -y snow-flow@latest init --sparc --force
```

### Start a parallel development swarm:
```bash
./snow-flow swarm "Build REST API" --strategy development --monitor --review --parallel
```

### Run concurrent TDD workflow:
```bash
./snow-flow sparc concurrent-tdd "user authentication,payment processing,notification system"
```

### Store project context with batch operations:
```bash
./snow-flow memory batch-store "project-contexts.json" --namespace project --parallel
```

### Spawn specialized agents in parallel:
```bash
./snow-flow agent batch-spawn agents-config.json --parallel --validate
```

## 🎯 Performance Features

### Parallel Processing
- **Concurrent Operations**: Execute multiple independent operations simultaneously
- **Batch Processing**: Group related operations for optimal efficiency
- **Pipeline Execution**: Chain operations with parallel stages
- **Smart Load Balancing**: Intelligent distribution of computational tasks

### Resource Optimization
- **Memory Management**: Optimized memory usage for parallel operations
- **CPU Utilization**: Better use of multi-core processors
- **I/O Throughput**: Improved disk and network operation efficiency
- **Cache Optimization**: Smart caching for repeated operations

### Performance Monitoring
- **Real-time Metrics**: Monitor operation performance in real-time
- **Resource Usage**: Track CPU, memory, and I/O utilization
- **Bottleneck Detection**: Identify and resolve performance issues
- **Optimization Recommendations**: Automatic suggestions for improvements

## 🎯 Best Practices (Enhanced)

### Performance Optimization
- Use `./snow-flow` instead of `npx snow-flow` after initialization
- Enable parallel processing for independent operations (`--parallel` flag)
- Use batch operations for multiple related tasks (`batch-*` commands)
- Monitor system resources during concurrent operations (`--monitor` flag)
- Store important context in memory for cross-session persistence
- Use swarm mode for complex tasks requiring multiple agents
- Enable monitoring for real-time progress tracking (`--monitor`)
- Use background mode for tasks > 30 minutes (`--background`)
- Implement concurrent processing for optimal performance

### Resource Management
- Monitor system resources during parallel operations
- Use appropriate batch sizes based on system capabilities
- Enable smart load balancing for distributed tasks
- Implement throttling for resource-intensive operations

### Workflow Optimization
- Use pipeline processing for complex multi-stage workflows
- Enable concurrent execution for independent workflow components
- Implement parallel validation for comprehensive quality checks
- Use batch operations for related workflow executions

## 📊 Performance Benchmarks

### Batchtools Performance Improvements
- **Agent Operations**: Up to 500% faster with parallel processing
- **Task Management**: 400% improvement with concurrent operations
- **Memory Operations**: 350% faster with batch processing
- **Workflow Execution**: 450% improvement with parallel orchestration
- **System Monitoring**: 250% faster with concurrent monitoring

## 🔧 Advanced Configuration

### Batchtools Configuration
```json
{
  "batchtools": {
    "enabled": true,
    "maxConcurrent": 20,
    "batchSize": 10,
    "enableOptimization": true,
    "smartBatching": true,
    "performanceMonitoring": true
  }
}
```

### Performance Tuning
- **Concurrent Limits**: Adjust based on system resources
- **Batch Sizes**: Optimize for operation type and system capacity
- **Resource Allocation**: Configure memory and CPU limits
- **Monitoring Intervals**: Set appropriate monitoring frequencies

## 📚 Resources (Enhanced)
- Documentation: https://github.com/ruvnet/claude-code-flow/docs
- Batchtools Guide: https://github.com/ruvnet/claude-code-flow/docs/batchtools.md
- Performance Optimization: https://github.com/ruvnet/claude-code-flow/docs/performance.md
- Examples: https://github.com/ruvnet/claude-code-flow/examples
- Issues: https://github.com/ruvnet/claude-code-flow/issues

## 🚨 Troubleshooting (Enhanced)

### Performance Issues
```bash
# Monitor system performance during operations
./snow-flow monitor --performance --real-time

# Check resource utilization
./snow-flow batchtools monitor --resources --detailed

# Analyze operation bottlenecks
./snow-flow performance analyze --bottlenecks --optimization
```

### Optimization Commands
```bash
# Auto-optimize system configuration
./snow-flow batchtools optimize --auto-tune

# Performance benchmarking
./snow-flow batchtools benchmark --detailed --export

# System resource analysis
./snow-flow performance report --system --recommendations
```

For comprehensive documentation and optimization guides, see the resources above.
