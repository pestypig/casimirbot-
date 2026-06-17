# Civilization Bounds Spore Procedural Systems Research

Date: 2026-06-17

Patch classification: presentation, evidence normalization.

Non-goal: this note does not make Spore a model of history, certify predictions,
authorize interventions, or turn procedural comparison into moral authority. It
uses Spore's Civilization Stage as a bounded design metaphor for dependency
mapping, scenario comparison, and missing-observation review.

## Verdict

Spore's Civilization Stage is useful for the Civilization Bounds Roadmap because
it compresses a complex society into inspectable procedural surfaces:

- cities as capability nodes
- spice geysers as resource anchors
- vehicles as mobility and projection capacity
- economic, military, and religious modes as action channels
- diplomacy modifiers as relationship state
- buildings as production, welfare, and defensive structure
- stage transition as a maturity gate into a larger operating environment

The useful lesson is not that real civilizations behave like Spore. The useful
lesson is that a reflective system needs explicit nodes, edges, resources,
action modes, constraints, observations, and gates before it compares historical
or current world affairs.

## Source Notes

Spore sources reviewed:

- SporeWiki describes Civilization Stage as a real-time strategy stage where
  vehicles replace creatures as the primary units, cities replace huts, and the
  objective is to claim rival nations' cities through religious, economic, or
  military interactions:
  https://spore.fandom.com/wiki/Civilization_Stage
- SporeWiki also identifies Sporebucks as the stage currency, produced through
  factories, spice geysers, trade, gifts, buildings, vehicles, consequence
  abilities, and diplomacy:
  https://spore.fandom.com/wiki/Civilization_Stage
- StrategyWiki's economic route notes that trade routes produce cash, relations
  can be improved with gifts, and cities can later be purchased:
  https://strategywiki.org/wiki/Spore/Civilization_Stage

World affairs data anchors reviewed:

- World Bank Worldwide Governance Indicators: six governance dimensions, with
  historical estimates recalculated back to 1996 for consistency:
  https://www.worldbank.org/en/publication/worldwide-governance-indicators
- World Bank Open Data and World Development Indicators: global development
  indicators across people, prosperity, planet, infrastructure, and digital
  transformation:
  https://data.worldbank.org/
- V-Dem: multidimensional democracy data using electoral, liberal,
  participatory, deliberative, and egalitarian principles:
  https://www.v-dem.net/about/v-dem-project/
- Fragile States Index: cohesion, economic, political, social, and
  cross-cutting fragility indicators:
  https://fragilestatesindex.org/
- Global Peace Index: peace measured across societal safety and security,
  ongoing domestic and international conflict, and militarisation:
  https://www.economicsandpeace.org/global-peace-index/
- ACLED: near-real-time conflict and protest event data by actor, event type,
  location, and date:
  https://acleddata.com/
- ACLED codebook: event-level taxonomy for political violence, demonstrations,
  and strategic developments:
  https://acleddata.com/methodology/acled-codebook

## Procedural Abstraction

The Civilization Bounds Roadmap can treat a civilization scenario as a typed
graph:

```text
bounded_system
  nodes:
    city_or_region
    resource_site
    institution
    population_group
    infrastructure_asset
    external_actor
    information_channel
  edges:
    trade
    supply_dependency
    alliance
    rivalry
    border_pressure
    legitimacy_claim
    migration_flow
    conflict_exposure
    information_influence
  state:
    resource_stock
    production_capacity
    mobility_capacity
    coercive_capacity
    economic_capacity
    persuasive_capacity
    institutional_capacity
    public_service_capacity
    social_cohesion
    ecological_pressure
    external_dependency
    observation_quality
```

This graph should remain diagnostic. It can constrain claims, reveal missing
evidence, and compare scenario structure. It must not decide policy, certify
prediction, or produce final moral judgments.

## Spore-To-World-Affairs Mapping

| Spore surface | Procedural meaning | Real-world parameter scope |
| --- | --- | --- |
| City | Concentrated capability node | urban population, public services, institutional reach, infrastructure density |
| Spice geyser | Extractive or strategic resource | energy, food, water, minerals, ports, chokepoints, fiscal revenue |
| Sporebucks | Liquid operating capacity | state revenue, GDP, reserves, credit access, inflation pressure |
| Factory | Production and fiscal throughput | industrial base, employment, energy intensity, export mix |
| House | Population and capacity support | housing, demographics, labor supply, public health |
| Entertainment | Social stability and consent buffer | trust, cohesion, civil liberties, welfare, public satisfaction |
| Turret | Defensive hardening | force posture, border security, deterrence, policing capacity |
| Vehicle | Projection capability | logistics, military mobility, trade fleet, administrative reach |
| Trade route | Dependency and integration edge | imports, exports, supply chains, investment, payment networks |
| Gift/bribe | Diplomatic transfer | aid, subsidies, debt relief, sanctions relief, side payments |
| Military takeover | Coercive pathway | armed conflict, occupation, coup, repression, deterrence failure |
| Economic takeover | Integration pathway | trade dependency, debt leverage, merger, market capture, investment lock-in |
| Religious takeover | Ideological or narrative pathway | legitimacy, identity, media, education, persuasion, institutional narrative |
| Relation meter | Bilateral/multilateral state | alliance quality, grievance, diplomatic friction, sanctions, public sentiment |
| Stage completion | Maturity transition | regional consolidation, institutionalization, entry into larger global system |

## Parameter Scopes For Comparison

### Material Base

Track resources and production before ideology or strategy:

- energy mix and import dependence
- food, water, and mineral constraints
- industrial capacity and logistics density
- fiscal capacity, reserves, debt, inflation, and trade balance
- infrastructure bottlenecks and chokepoints

Primary data anchors: World Development Indicators, World Bank Open Data,
Our World in Data, national statistical sources, trade and energy agencies.

### Governance And Institutional Capacity

Separate formal government capacity from legitimacy and rights:

- government effectiveness
- rule of law
- regulatory quality
- corruption control
- voice and accountability
- public service reach
- elite factionalization

Primary data anchors: Worldwide Governance Indicators, V-Dem, Fragile States
Index, country-specific diagnostics.

### Security And Conflict Exposure

Treat violence as event evidence, not as a broad label:

- event frequency and intensity
- actor identity and actor fragmentation
- geographic concentration
- battlefield, protest, riot, and strategic-development separation
- fatality and displacement trends
- internal conflict versus external conflict

Primary data anchors: ACLED, UCDP, Global Peace Index, UN/OCHA, refugee and IDP
datasets.

### Social Cohesion And Demographic Pressure

Model social stress as layered capacity pressure:

- population age structure
- migration and displacement
- uneven development
- human flight and brain drain
- group grievance
- public trust and civic participation

Primary data anchors: Fragile States Index, World Bank, V-Dem, UN population
data, household surveys.

### Information, Ideology, And Legitimacy

Keep this separate from "truth" or "virtue." The observable layer is narrative
capacity and institutional trust:

- media freedom and pluralism
- censorship or information control
- education reach
- civil society capacity
- propaganda exposure
- legitimacy claims and counterclaims

Primary data anchors: V-Dem, media-freedom datasets, public opinion surveys,
local source review.

### Environment And Entropy Pressure

Use environment as a constraint layer, not decorative context:

- climate exposure
- disaster frequency
- water stress
- agricultural vulnerability
- energy transition pressure
- pollution and public health load

Primary data anchors: World Bank climate and environment indicators, IPCC/UN
sources, Our World in Data, national hazard agencies.

## Scenario Loop

Use this loop for AI-assisted reflection:

```text
1. Define bounded system and time horizon.
2. Declare source class: historical comparison, current snapshot, or future scenario.
3. Build graph: nodes, edges, resources, institutions, groups, external actors.
4. Attach observations with source, date, granularity, and uncertainty.
5. Normalize parameters into comparable ranges without erasing source meaning.
6. Identify dependency chains and bottlenecks.
7. Run contrast cases: stable peer, stressed peer, historical analogue, null case.
8. Generate hypotheses, not conclusions.
9. Ask for counterevidence and missing observations.
10. Emit bounds receipt with claim strength and blocked claims.
```

## Prediction Guardrails

The roadmap should support comparison and scenario generation, not deterministic
forecasting. A valid output can say:

- "This scenario resembles a resource-bottleneck pattern."
- "The claim depends on missing conflict-event evidence."
- "The comparison is weak because the cases differ on governance capacity."
- "The model sees a dependency chain from energy imports to fiscal stress to
  social instability, but causal direction is not certified."

It should not say:

- "This country will collapse."
- "This policy is morally proven."
- "This conflict is inevitable."
- "This Spore pathway predicts the real-world outcome."

## AI Role

AI is useful as a context and dependency assistant:

- retrieve and summarize dated evidence
- align indicators across sources
- generate candidate graph edges
- compare historical cases by parameter similarity
- identify missing observations and stale data
- produce scenario ensembles and counterfactual questions
- explain confidence limits

AI must not be treated as the authority for source truth, policy legitimacy,
military necessity, moral finality, or certified prediction.

## Roadmap Implementation Implications

For `civilization_bounds_roadmap/v1`, add or preserve these receipt fields when
this research becomes schema work:

```ts
type CivilizationBoundsReflectionReceiptV1 = {
  artifact_id: "civilization_bounds_reflection";
  schema: "civilization_bounds_roadmap.reflection.v1";
  source_class: "historical_case" | "current_snapshot" | "future_scenario";
  time_horizon: string;
  bounded_system: string;
  nodes: Array<{ id: string; kind: string; evidence_refs: string[] }>;
  edges: Array<{ from: string; to: string; kind: string; evidence_refs: string[] }>;
  parameter_scopes: string[];
  missing_observations: string[];
  comparison_cases: string[];
  hypothesis_claims: Array<{
    claim: string;
    strength: "weak" | "bounded" | "strong";
    blockers: string[];
  }>;
  authority: {
    assistant_answer: false;
    terminal_eligible: false;
    prediction_finality: false;
    policy_finality: false;
    moral_finality: false;
    execution_permission: false;
  };
};
```

## Immediate Next Step

The narrow next implementation step is a read-only adapter that can transform a
small hand-authored case file into:

- bounded-system nodes
- dependency edges
- parameter scopes
- missing-observation flags
- claim-strength receipts

Do this before building any live prediction surface. The first UI should show
observed dependencies and evidence gaps, not a "future outcome" panel.
