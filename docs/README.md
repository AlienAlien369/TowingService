# RoadSaathi documentation

## PDF packs (ready to share)

| Pack | For | File |
|---|---|---|
| **Business & Project Plan** | Management, investors | [`pdf/RoadSaathi-Business-and-Project-Plan.pdf`](pdf/RoadSaathi-Business-and-Project-Plan.pdf) |
| **Product & Developer Handbook** | Product and engineering | [`pdf/RoadSaathi-Product-and-Developer-Handbook.pdf`](pdf/RoadSaathi-Product-and-Developer-Handbook.pdf) |
| **Operations & Compliance Handbook** | Operations, finance, compliance | [`pdf/RoadSaathi-Operations-and-Compliance-Handbook.pdf`](pdf/RoadSaathi-Operations-and-Compliance-Handbook.pdf) |

The PDFs are generated from the Markdown below. After editing a document, rebuild them:

```bash
cd docs/pdf-build && npm install && npm run build
```

## Business (`business/`)
1. [Business & project plan](business/01-business-plan.md): executive summary, problem, what's built, model, differentiation, decisions needed
2. [Competitor analysis](business/02-competitor-analysis.md): India and global players with revenue, EBITDA and why they make a profit or loss
3. [Legal & regulatory map](business/03-legal-regulatory-map.md): what Indian law requires, with open questions for counsel
4. [Risk register](business/04-risk-register.md): biggest obstacles and mitigations
5. [AI roadmap](business/05-ai-roadmap.md): 15 future AI features with value, data and phase
6. [Financial model](business/06-financial-model.md): unit economics, 3-year planning case, sensitivity, funding
7. [Go-to-market](business/07-go-to-market.md): segments, supply plan, channels, KPIs

## Product (`product/`)
- [Feature inventory](product/FEATURE-INVENTORY.md): built vs. not yet built
- [PRD](product/PRD.md): personas, journeys, v1.1 launch scope with acceptance criteria
- [Roadmap & launch checklist](product/ROADMAP.md): phases, exit criteria, estimates

## Engineering
- [Architecture](ARCHITECTURE.md) · [Developer guide](developer/DEVELOPER-GUIDE.md) · [Data model](developer/DATA-MODEL.md)
- [Security](developer/SECURITY.md) · [Testing](developer/TESTING.md) · [Contributing](developer/CONTRIBUTING.md)
- [Deployment](DEPLOY.md) · [Tracking plan](tracking-plan.md) · [OpenAPI](openapi.yaml)

## Operations
- [Operations SOPs](operations/OPERATIONS-SOP.md) · [Incident response](operations/INCIDENT-RESPONSE.md) · [Admin guide](ADMIN-GUIDE.md)
