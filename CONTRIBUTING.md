# Contributing to Snow-flow

Bedankt voor je interesse in het bijdragen aan Snow-flow! Dit document beschrijft hoe je kunt bijdragen aan het project.

## Code of Conduct

Dit project houdt zich aan een Code of Conduct. Door deel te nemen, wordt verwacht dat je deze code respecteert.

## Hoe kan ik bijdragen?

### 🐛 Bugs Rapporteren

Voordat je een bug rapporteert:
1. Check of de bug al gerapporteerd is in [Issues](https://github.com/groeimetai/Snow-flow/issues)
2. Zorg dat je de laatste versie gebruikt
3. Verzamel informatie over de bug:
   - Stack trace
   - OS en versie
   - Node.js versie
   - Stappen om te reproduceren

### 💡 Feature Requests

We verwelkomen nieuwe ideeën! Open een issue met:
- Een duidelijke titel en beschrijving
- Use case - waarom is dit nuttig?
- Mogelijke implementatie suggesties

### 🔧 Pull Requests

1. Fork de repository
2. Maak een nieuwe branch: `git checkout -b feature/mijn-feature`
3. Maak je wijzigingen
4. Test je wijzigingen grondig
5. Commit met een duidelijke message: `git commit -m 'Add: nieuwe feature'`
6. Push naar je fork: `git push origin feature/mijn-feature`
7. Open een Pull Request

#### Pull Request Checklist

- [ ] Code volgt de project coding style
- [ ] Tests zijn toegevoegd/aangepast
- [ ] Documentatie is bijgewerkt
- [ ] TypeScript compileert zonder errors
- [ ] Linting geeft geen errors
- [ ] Alle tests slagen

### 📝 Coding Guidelines

#### TypeScript
- Gebruik TypeScript voor alle nieuwe code
- Definieer types expliciet (geen `any` tenzij noodzakelijk)
- Gebruik interfaces voor object types
- Documenteer publieke functies met JSDoc

#### Code Style
```typescript
// Goed
export interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
}

async function generateApplication(config: ServiceNowConfig): Promise<Result> {
  // Implementation
}

// Slecht
export function generateApp(config: any) {
  // Implementation
}
```

#### Naming Conventions
- Classes: PascalCase (`ServiceNowClient`)
- Interfaces: PascalCase met 'I' prefix optioneel (`IServiceNowClient` of `ServiceNowClient`)
- Functions/Methods: camelCase (`generateTable`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- Files: kebab-case (`service-now-client.ts`)

### 🧪 Testing

- Schrijf unit tests voor nieuwe functionaliteit
- Zorg voor minstens 80% code coverage
- Test edge cases
- Mock externe dependencies

```typescript
describe('SchemaDesignerAgent', () => {
  it('should generate valid table schema', async () => {
    const agent = new SchemaDesignerAgent(mockClient);
    const result = await agent.generateTable(mockRequest);
    expect(result).toHaveProperty('sys_id');
    expect(result.name).toBe('x_app_table');
  });
});
```

### 📚 Documentatie

- Update README.md voor nieuwe features
- Voeg JSDoc toe aan publieke functies
- Update CLI help text
- Voeg voorbeelden toe waar nuttig

### 🔄 Development Workflow

1. **Setup Development Environment**
```bash
git clone https://github.com/groeimetai/Snow-flow.git
cd Snow-flow/servicenow-app-builder
npm install
npm run build
```

2. **Maak wijzigingen**
```bash
# Maak een nieuwe branch
git checkout -b feature/mijn-feature

# Maak je wijzigingen
# ...

# Test lokaal
npm test
npm run lint
npm run typecheck
```

3. **Commit Conventies**
- `Add:` voor nieuwe features
- `Fix:` voor bug fixes
- `Update:` voor updates aan bestaande functionaliteit
- `Docs:` voor documentatie
- `Test:` voor test wijzigingen
- `Refactor:` voor code refactoring

### 🏗️ Project Structuur

```
servicenow-app-builder/
├── src/
│   ├── agents/          # AI Agents
│   ├── cli/            # CLI implementatie
│   ├── config/         # Configuratie
│   ├── orchestrator/   # Hoofdorchestratie
│   ├── studio/         # ServiceNow Studio client
│   ├── templates/      # App templates
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── tests/              # Tests
├── docs/               # Documentatie
└── examples/           # Voorbeelden
```

### 🤝 Review Process

1. Alle PRs worden gereviewd door maintainers
2. Tests moeten slagen
3. Code moet voldoen aan style guidelines
4. Documentatie moet up-to-date zijn

## Vragen?

Open een [Discussion](https://github.com/groeimetai/Snow-flow/discussions) voor algemene vragen of hulp.

## Licentie

Door bij te dragen ga je akkoord dat je bijdragen gelicenseerd worden onder de MIT License.