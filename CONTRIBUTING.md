# Contributing to Snow-Flow 🏔️

Thank you for your interest in contributing to Snow-Flow! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Report bugs** through GitHub issues
- **Suggest features** and improvements
- **Submit bug fixes** via pull requests
- **Add documentation** and examples
- **Create new MCP tools** for ServiceNow
- **Develop new AI agents** for specialized tasks

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/groeimetai/snow-flow.git
   cd snow-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   cp .env.example .env
   # Configure your ServiceNow credentials
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 🔧 Development Process

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Commit Your Changes
```bash
git add .
git commit -m "feat: add new widget builder tool"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

### 4. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Code Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Provide proper types (avoid `any`)
- Use interfaces for complex objects
- Document public APIs with JSDoc

### Example:
```typescript
/**
 * Creates a new ServiceNow widget
 * @param config - Widget configuration
 * @returns The created widget metadata
 */
export async function createWidget(config: WidgetConfig): Promise<WidgetMetadata> {
  // Implementation
}
```

### Testing Requirements
- Write tests for new functionality
- Maintain test coverage above 80%
- Use descriptive test names
- Mock external ServiceNow API calls

## 🏗️ Architecture Guidelines

### Adding New MCP Tools
1. Create new file in `src/mcp/`
2. Extend `BaseMCPServer` class
3. Implement required methods
4. Add to server registry
5. Document the tool in README

### Creating New Agents
1. Create new file in `src/agents/`
2. Extend `BaseSnowAgent` class
3. Implement `executeTask` method
4. Add agent type to `AgentType` enum
5. Register in agent factory

## 🐛 Reporting Issues

### Bug Reports Should Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Snow-Flow version
- ServiceNow instance version
- Error messages/logs

### Feature Requests Should Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Impact on existing functionality

## 🔍 Pull Request Process

1. **Update documentation** for any API changes
2. **Add tests** for new functionality
3. **Ensure CI passes** all checks
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Checklist:
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No console.log statements
- [ ] No hardcoded credentials

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others in discussions
- Share knowledge and experiences
- Follow our Code of Conduct

## 📞 Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/snow-flow)
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Check existing issues before creating new ones

## 🙏 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project website

Thank you for contributing to Snow-Flow!