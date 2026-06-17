# Civilization Bounds Nation Procedural Network Fit

Date: 2026-06-17

Patch classification: evidence normalization, presentation.

Non-goal: this memo does not classify nations into final ranks, certify
predictions, authorize policy, or treat index scores as moral authority. It
tests whether the current Civilization Bounds procedural scaffold can support a
realistic world-map UI for current nations.

## Verdict

The picture is realistic enough for a diagnostic UI if the map presents nations
as transient, multi-axis evidence states instead of fixed civilization classes.

Proceed with UI work if the first version shows:

- nation nodes with time-stamped parameter vectors
- confidence and freshness on every parameter
- missing-observation badges
- dependency and exposure edges
- comparison cases as hypotheses, not predictions
- a visible distinction between structural indices and current event pulses

Do not proceed with a UI that assigns one stable "civilization type" per nation.
That would be too coarse and would hide the main lesson of the procedural
network: a country's identity changes as material, institutional, conflict,
information, environmental, and dependency evidence changes.

## Source Basis

The current `parameterScopes` map cleanly onto major public country datasets:

- World Bank Worldwide Governance Indicators summarize six governance
  dimensions: voice and accountability, political stability/absence of violence,
  government effectiveness, regulatory quality, rule of law, and control of
  corruption:
  https://www.worldbank.org/en/publication/worldwide-governance-indicators
- World Bank Open Data and World Development Indicators provide country-level
  development indicators across population, economy, energy, infrastructure,
  health, education, and environment:
  https://data.worldbank.org/
- V-Dem treats democracy as multidimensional, including electoral, liberal,
  participatory, deliberative, and egalitarian principles:
  https://www.v-dem.net/about/v-dem-project/
- Fragile States Index uses cohesion, economic, political, social, and
  cross-cutting indicators and explicitly frames scores as snapshots that can be
  compared over time:
  https://fragilestatesindex.org/indicators/
- Global Peace Index measures peace across societal safety/security, ongoing
  domestic and international conflict, and militarisation:
  https://www.visionofhumanity.org/maps/
- ACLED's codebook separates disorder into political violence, demonstrations,
  and strategic developments, making it useful for current event pulses:
  https://acleddata.com/methodology/acled-codebook
- UCDP defines state-based armed conflict around contested government/territory
  incompatibility involving armed force and at least 25 battle-related deaths in
  a calendar year:
  https://www.uu.se/en/department/peace-and-conflict-research/research/ucdp/ucdp-definitions
- UNDP's Human Development Index gives a compact human-capability lens using
  life expectancy, education, and GNI per capita:
  https://hdr.undp.org/data-center/human-development-index
- ND-GAIN measures climate vulnerability and readiness, including food, water,
  health, ecosystem services, human habitat, and infrastructure:
  https://gain.nd.edu/our-work/country-index/methodology/
- World Bank Logistics Performance Index is a trade-logistics benchmark for
  speed and connectivity of international supply chains:
  https://lpi.worldbank.org/en/home
- The Observatory of Economic Complexity ranks countries by export diversity and
  sophistication, which is useful for productive-capability depth:
  https://oec.world/en/rankings/eci/hs6/hs96

## Fit Against Current Parameter Scopes

| Roadmap scope | Real data fit | UI readiness | Notes |
| --- | --- | --- | --- |
| `material_base` | Strong | Ready for v1 | WDI, energy, GDP, logistics, ECI, trade, infrastructure, food/water data support this. |
| `governance_institutional_capacity` | Strong | Ready for v1 | WGI, V-Dem, FSI political indicators cover this well, but index uncertainty must be visible. |
| `security_conflict_exposure` | Strong but time-sensitive | Ready with event pulse | GPI/UCDP support structural conflict; ACLED supports current event dynamics. |
| `social_cohesion_demographic_pressure` | Moderate | Ready with missing-gap badges | FSI, World Bank, UN data help, but social trust and grievance are hard to observe cleanly. |
| `information_ideology_legitimacy` | Moderate | Needs careful labels | V-Dem/media datasets help, but legitimacy cannot be collapsed into a single truth score. |
| `environment_entropy_pressure` | Strong | Ready for v1 | ND-GAIN, WDI climate/environment, disaster, water, and energy-transition data support this. |

The model is not complete, but it is structurally sound. The gaps are mostly in
granularity, freshness, and causal interpretation, not in the top-level
categories.

## Recommended Nation Node Shape

Use one country node per ISO-3166 country or territory, with a versioned state:

```ts
type CivilizationNationStateVectorV1 = {
  country_iso3: string;
  observed_at: string;
  freshness_days: number;
  source_refs: string[];

  material_base: number | null;
  governance_capacity: number | null;
  security_exposure: number | null;
  social_cohesion_pressure: number | null;
  information_legitimacy_pressure: number | null;
  environmental_pressure: number | null;
  logistics_connectivity: number | null;
  productive_complexity: number | null;
  human_development: number | null;

  event_pulse: {
    acled_event_count_30d?: number;
    protest_event_count_30d?: number;
    political_violence_event_count_30d?: number;
    strategic_development_count_30d?: number;
    ucdp_active_conflict?: boolean;
  };

  missing_observations: string[];
  confidence: number;
  claim_tier: "source_backed_observation" | "current_observation" | "diagnostic_bound";
};
```

The important design choice is that these are not identity labels. They are
state vectors with dates, source references, confidence, and gaps.

## Recommended Edge Types

The world map should not only color countries. It should show relationships:

- `trade_dependency`: import/export, commodity, energy, food, or technology
  exposure
- `logistics_corridor`: ports, shipping lanes, border crossings, chokepoints,
  freight capacity
- `security_exposure`: active conflict, border risk, alliance exposure,
  spillover risk
- `migration_displacement`: refugee, IDP, labor migration, brain drain
- `information_influence`: media freedom, censorship, narrative influence, civil
  society exposure
- `climate_shared_risk`: river basins, drought zones, disaster exposure,
  ecological sinks
- `institutional_alignment`: treaty, trade bloc, legal interface, standards
  compatibility

Edges should also be transient. A trade edge can strengthen, weaken, or become
stale; a conflict edge can appear as an event pulse and later decay into
historical context.

## Better Categorization Strategy

Avoid categories like "developed", "fragile", "peaceful", or "authoritarian" as
the primary UI layer. They are useful as source-derived references, but bad as
the map's own ontology.

Use procedural clusters instead:

- `high_material_high_governance`: can absorb complex projects, but still needs
  consent/review evidence
- `high_material_low_governance`: capacity exists, but review and legitimacy
  gaps bound claim strength
- `low_material_high_governance`: reliable interface, but resource and
  infrastructure constraints dominate
- `high_security_exposure`: event pulse or conflict exposure should dominate
  confidence and freshness warnings
- `high_environment_pressure`: climate, water, disaster, or sink constraints
  bound long-horizon claims
- `high_dependency_centrality`: not necessarily powerful, but structurally
  important because many flows depend on it
- `stale_or_missing_observation`: UI should show this as a first-class state,
  not as an absence of risk

These are transient diagnostic clusters. A country can belong to several at
once, and membership should change as observations update.

## Completeness Assessment

The current picture is about 70 percent complete for a credible diagnostic UI.

What is present:

- a good high-level parameter scaffold
- clear authority boundaries
- read-only receipt compatibility
- Spore-derived procedural grammar for nodes, resources, action channels, edges,
  and maturity gates
- real public data anchors for most country-level dimensions

What is missing before a realistic world-map UI:

- a country-state-vector adapter
- source freshness and confidence fields surfaced in UI
- event-pulse integration separate from annual indices
- relation edges between countries, not only country badges
- subnational caveat for large countries and conflict zones
- index-bias caveat and missing-observation overlays
- a time slider that represents observation date, not only project phase

## UI Recommendation

Continue UI work, but make the first world-map layer a `diagnostic atlas`, not a
ranking board.

First screen should support:

- map colored by selected parameter scope
- nation hover showing values, source age, confidence, and missing observations
- toggles for `structural index`, `event pulse`, `dependency edges`, and
  `missing evidence`
- side panel for a selected country with parameter vector and top blockers
- edge overlay for trade/security/environment/institutional dependencies
- date/freshness control

Do not show:

- one final civilization score
- ranked "best/worst civilization" lists
- deterministic outcome predictions
- policy recommendations generated directly from map clusters

## Next Implementation Step

Build a small static fixture first:

```text
docs or data fixture
  -> 10-20 countries
  -> 6 parameter scopes
  -> 2-4 edge types
  -> source refs and freshness
  -> missing-observation flags
```

Then wire the UI against that fixture before adding live data ingestion. This
keeps the visual model honest while we test whether the procedural network is
readable.
