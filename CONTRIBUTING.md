# Contributing to Snow-Flow

Thank you for your interest in contributing to Snow-Flow! This document provides guidelines and instructions for contributing to this multi-agent ServiceNow development tool.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- ServiceNow instance (for testing)
- Git
- TypeScript knowledge

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/snow-flow.git
   cd snow-flow
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   npm run typecheck
   ```

5. **Set Up ServiceNow (Optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your ServiceNow credentials
   ./snow-flow auth login
   ```

## 🏗️ Project Structure

```
snow-flow/
├── src/
│   ├── agents/          # AI agents (Queen, Widget Creator, etc.)
│   ├── mcp/            # Model Context Protocol servers
│   ├── memory/         # Persistent memory system
│   ├── queen/          # Queen Agent coordination
│   └── utils/          # Utilities and helpers
├── tests/              # Test files
├── examples/           # Usage examples
└── docs/              # Documentation (to be added)
```

## 🎯 Ways to Contribute

### 🐛 Bug Reports

**Before creating a bug report:**
- Search existing issues
- Test with the latest version
- Include reproduction steps

**When creating a bug report:**
- Use our bug report template
- Include environment details
- Provide minimal reproduction case
- Include error logs and screenshots

### ✨ Feature Requests

**Before suggesting features:**
- Check if it aligns with project goals
- Search existing feature requests
- Consider if it's broadly useful

**When suggesting features:**
- Use our feature request template
- Explain the use case
- Consider implementation complexity
- Provide mockups or examples if helpful

### 🔧 Code Contributions

**Types of contributions we welcome:**
- Bug fixes
- Performance improvements
- Documentation improvements
- New agent types
- ServiceNow integrations
- Test coverage improvements
- Developer experience enhancements

## 📝 Development Guidelines

### Code Style

- **TypeScript**: All new code must be TypeScript
- **ESLint**: Follow existing linting rules
- **Formatting**: Use existing code style (run `npm run lint -- --fix`)
- **Naming**: Use descriptive, self-documenting names

### Commit Messages

Follow conventional commits:
```
feat: add new widget creator agent
fix: resolve authentication timeout issue
docs: update API documentation
test: add integration tests for memory system
refactor: simplify agent coordination logic
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test improvements

### Code Quality Standards

1. **TypeScript Compliance**
   - All code passes `npm run typecheck`
   - Use proper types, avoid `any`
   - Document complex type definitions

2. **Testing**
   - Add tests for new functionality
   - Maintain existing test coverage
   - Tests should pass: `npm test`

3. **Performance**
   - Consider memory usage in agent systems
   - Avoid blocking operations in main thread
   - Use appropriate data structures

4. **Security**
   - Never hardcode credentials
   - Validate all external inputs
   - Follow OWASP best practices

## 🧪 Testing Guidelines

### Test Categories

1. **Unit Tests** (`tests/unit/`)
   - Test individual functions/classes
   - Mock external dependencies
   - Fast execution (<1s per test)

2. **Integration Tests** (`tests/integration/`)
   - Test component interactions
   - May use real ServiceNow connections
   - Longer execution acceptable

### Writing Tests

```typescript
import { WidgetCreatorAgent } from '../../src/agents/widget-creator-agent';

describe('WidgetCreatorAgent', () => {
  let agent: WidgetCreatorAgent;

  beforeEach(() => {
    agent = new WidgetCreatorAgent();
  });

  it('should create basic widget structure', async () => {
    const result = await agent.createWidget({
      name: 'test-widget',
      template: 'dashboard'
    });
    
    expect(result.success).toBe(true);
    expect(result.widget).toHaveProperty('name', 'test-widget');
  });
});
```

### Test Environment

- Use `process.env.NODE_ENV = 'test'`
- Mock external services (ServiceNow, Neo4j, SQLite)
- Clean up after each test

## 📚 Documentation

### Code Documentation

- Use JSDoc for public APIs
- Include usage examples
- Document complex algorithms
- Explain architectural decisions

### README Updates

- Keep feature lists current
- Update installation instructions
- Add new examples as needed

## 🔄 Pull Request Process

### Before Submitting

1. **Test Everything**
   ```bash
   npm run build
   npm test
   npm run lint
   npm run typecheck
   ```

2. **Update Documentation**
   - Update README if needed
   - Add/update JSDoc comments
   - Update CHANGELOG.md

3. **Check Dependencies**
   - Avoid adding unnecessary dependencies
   - Justify new dependencies in PR description
   - Use existing project dependencies when possible

### PR Guidelines

1. **Keep PRs Focused**
   - One feature or fix per PR
   - Avoid mixing refactoring with features
   - Split large changes into smaller PRs

2. **Provide Context**
   - Clear title and description
   - Reference related issues
   - Explain design decisions
   - Include screenshots for UI changes

3. **Be Responsive**
   - Address review feedback promptly
   - Ask questions if feedback is unclear
   - Keep discussions respectful and constructive

### Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - All tests must pass
   - Linting must pass
   - TypeScript compilation must succeed

2. **Code Review**
   - At least one maintainer approval required
   - Focus on code quality, security, and design
   - Consider backwards compatibility

3. **Merge**
   - Squash commits for cleaner history
   - Update version if needed
   - Deploy to npm if applicable

## 🏷️ Release Process

### Version Management

- Semantic versioning (MAJOR.MINOR.PATCH)
- Update version in package.json
- Update CHANGELOG.md
- Tag releases in Git

### Release Types

- **Patch** (1.0.1): Bug fixes, small improvements
- **Minor** (1.1.0): New features, backwards compatible
- **Major** (2.0.0): Breaking changes

## 🎨 Agent Development

### Creating New Agents

1. **Extend Base Agent**
   ```typescript
   import { BaseAgent } from './base-agent';
   
   export class MyCustomAgent extends BaseAgent {
     async execute(task: Task): Promise<Result> {
       // Implementation
     }
   }
   ```

2. **Register with Queen**
   - Add to agent factory
   - Define specialization
   - Add to coordination system

3. **Add Tests**
   - Unit tests for agent logic
   - Integration tests with Queen
   - Mock ServiceNow interactions

### Agent Best Practices

- Keep agents focused on single responsibilities
- Use memory system for coordination
- Handle errors gracefully
- Provide meaningful progress updates
- Support cancellation

## 🤝 Community Guidelines

### Communication

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and experiences
- Provide constructive feedback

### Code of Conduct

- Follow the project's Code of Conduct
- Report inappropriate behavior
- Foster a welcoming environment
- Celebrate contributions of all sizes

## 🆘 Getting Help

### Documentation

- README.md for basic usage
- Examples directory for code samples
- Source code comments for implementation details

### Community Support

- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Stack Overflow tag: `snow-flow`

### Maintainer Contact

- Create GitHub issues for bugs
- Use GitHub discussions for questions
- Email for security issues: [security@snow-flow.dev]

## 📋 Checklist Template

Before submitting your contribution:

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No merge conflicts
- [ ] PR description is clear

## 🙏 Recognition

All contributors are recognized in our:
- GitHub contributors page
- CHANGELOG.md mentions
- Release notes

Thank you for helping make Snow-Flow better! 🚀

---

*This contributing guide is inspired by best practices from successful open source projects and is continuously updated based on community feedback.*