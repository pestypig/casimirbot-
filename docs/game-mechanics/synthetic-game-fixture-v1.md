# Synthetic game fixture mechanics v1

Collection ID: `mechanics.synthetic_game.fixture.v1`

This deliberately small collection exists only to prove that the environment
adapter contract is not Minecraft-specific. It is available only when fixture
adapters are enabled outside production.

The fixture world has actors, two-dimensional positions, reachability, and
hazards. Reachability and hazard probes are read-only observations. Nothing in
this collection grants action authority or establishes current world state.
