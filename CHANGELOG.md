# Changelog

All notable changes to Snow-Flow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2025-01-27

### Added
- **ServiceNow API Security Section** in README
- Complete transparency about OAuth authentication flow
- Network architecture diagram showing direct ServiceNow connection
- Data privacy and security guarantees explanation
- Clarification that all 100+ MCP tools use official ServiceNow REST APIs exclusively

### Fixed
- Updated agent count from "25+" to accurate "38 Specialized Agents"

## [2.0.3] - 2025-01-27

### Added
- Complete professional open source documentation suite
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md with community standards  
- SECURITY.md with vulnerability reporting process
- GitHub issue templates and CI/CD pipeline
- examples/ directory with real-world use cases
- Professional badge collection in README

### Changed
- Package size reduced from 11.3MB to 1.3MB (88% reduction) with .npmignore
- Enhanced README with professional presentation

## [2.0.2] - 2025-01-27

### Fixed
- Removed `.claude-flow/` directory from repository
- Added `.npmignore` to reduce package size from 11.3MB

### Added
- Professional open source documentation (CONTRIBUTING.md, CHANGELOG.md)

## [2.0.1] - 2025-01-27

### Fixed
- Updated README with correct agent count (38 specialized agents)
- Removed Claude Code section from README
- Changed GPT-4 references to GPT

### Changed
- Added mountain emoji (🏔️) to Snow-Flow branding
- Improved Getting Started section with 5 clear steps

### Removed
- Cleaned up 48 legacy files from repository
- Removed `.roo/` directory (33 room mode files)
- Removed legacy scripts and test files

## [2.0.0] - 2025-01-27

### 🎉 Major Release - Complete Rewrite

### Added
- **100+ MCP Tools** across 16 specialized servers
- **38 Specialized AI Agents** for every ServiceNow task
- **OAuth Authentication** as default (replacing basic auth)
- **Intelligent Multi-Agent Swarm Coordination**
- **Natural Language Interface** for all operations
- **Real-Time ServiceNow Integration** (no mock data)
- **Neural Learning System** for pattern recognition
- **Shared Memory System** for agent coordination
- **Performance Optimization Engine**
- **Smart Rollback System** for safe deployments

### Changed
- Complete architecture redesign for scalability
- Migrated from claude-flow base to Snow-Flow specialization
- Enhanced error handling with automatic recovery
- Improved deployment reliability

### Deprecated
- Basic authentication (use OAuth instead)
- Mock data mode (all operations are real)

### Security
- OAuth 2.0 implementation
- Secure credential storage
- Encrypted communication

## [1.4.44] - 2025-01-26

### Fixed
- Dynamic version loading from package.json
- MCP server startup issues

## [1.4.0] - 2025-01-15

### Removed
- Flow Designer functionality (due to critical bugs)
- Recommend using ServiceNow native Flow Designer

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic ServiceNow integration
- Simple agent system
- Core MCP tools

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

---

For detailed migration guides and breaking changes, see the [Migration Guide](docs/MIGRATION.md).