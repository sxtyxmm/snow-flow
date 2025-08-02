# Snow-Flow Realistische Test Prompt

## Test de 50+ echte MCP tools systematisch

**Verwachting:** ~70% succes rate (35+ van 50+ tools werken)

Kopieer deze prompt en plak in Claude Code:

---

**PROMPT VOOR CLAUDE CODE:**

```
Test Snow-Flow's 50+ MCP tools systematisch per categorie en rapporteer welke werken.

## 🎯 REALISTISCH TESTEN - Verwacht ~70% succes rate

### 📊 **ServiceNow Operations** (12+ tools - meeste werken)
1. snow-flow swarm "Geef me operational metrics van mijn ServiceNow instance"
2. snow-flow swarm "Zoek user information en groups voor admin gebruikers"  
3. snow-flow swarm "Query incidents met status Open en hoge priority"
4. snow-flow swarm "Zoek catalog items met fuzzy search voor iPhone"
5. snow-flow swarm "Maak nieuwe user group voor incident managers"

### 🔧 **Update Set Management** (9+ tools - basis functionaliteit werkt)
6. snow-flow swarm "Laat me de huidige update set zien"
7. snow-flow swarm "Lijst alle update sets die in progress zijn"
8. snow-flow swarm "Zorg voor een actieve update set session"

### 📈 **Reporting & Analytics** (12+ tools - data quality werkt)
9. snow-flow swarm "Analyseer data quality van incident table"
10. snow-flow swarm "Vind alle beschikbare tabellen voor reporting"

### ⚙️ **Automation** (11+ tools - discovery werkt goed)
11. snow-flow swarm "Vind alle automation jobs in mijn instance"
12. snow-flow swarm "Ontdek alle ServiceNow events"
13. snow-flow swarm "Laat alle system schedules zien"

### 🔗 **Integration** (10+ tools - endpoint discovery werkt)
14. snow-flow swarm "Vind alle REST en SOAP integration endpoints"

### 🔧 **Platform Development** (2+ tools - schema discovery werkt)
15. snow-flow swarm "Ontdek alle platform development tabellen"
16. snow-flow swarm "Analyseer table schema van incident table"

### 🛡️ **Security & Compliance** (12+ tools - mogelijk beperkt door permissions)
17. snow-flow swarm "Scan mijn instance voor security policies"

### 🐝 **AI Swarm Orchestration** (4+ tools - coördinatie werkt)
18. snow-flow swarm "Initialiseer 5-agent swarm voor ServiceNow analyse"

## 🔧 **RECENT GEFIXTE TOOLS TESTEN:**
19. Test de verbeterde snow_deploy tool
20. Test de gefixte snow_widget_test tool  
21. Test de gefixe snow_create_security_policy tool

## 📋 **RAPPORTAGE per test:**
- ✅ Werkt perfect / ⚠️ Werkt deels / ❌ Werkt niet / 🔒 Permission issue
- Execution tijd
- Echte data gekregen? (aantallen, namen, sys_ids)
- Error messages (403, 404, 400, etc.)

## 📊 **VERWACHTE RESULTATEN:**
- **✅ Werkende tools**: 12+ operations tools, update set basics, data analysis, discovery tools
- **⚠️ Beperkte tools**: Security tools (permissions), sommige automation tools  
- **❌ Niet werkende**: Mogelijk complexe migration tools, predictive features

## 📋 **FINAL SUMMARY RAPPORT:**
- **Totaal getest**: X tools van 50+
- **✅ Volledig werkend**: X tools (X%)
- **⚠️ Gedeeltelijk**: X tools (permission/config issues)
- **❌ Niet werkend**: X tools 
- **🏆 Snow-Flow Score**: X/50+ (vergelijk met verwachte 70%)
- **💡 Top bevindingen**: Welke categorieën werken best?
- **🔧 Prioriteit fixes**: Top 3 belangrijkste issues
```

---

**🎯 Realistisch verwachtingsmanagement - Snow-Flow heeft 50+ echte tools met ~70% succes rate!** 🏔️