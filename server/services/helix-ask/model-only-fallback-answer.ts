export const renderAskTurnModelOnlyFallbackAnswer = (fallbackId: string): string | null => {
  switch (fallbackId) {
    case "model_only_fallback.underspecified_kinetic_energy":
      return "This is underspecified for a numeric kinetic-energy calculation because kinetic energy requires the car's speed. Provide the speed, for example in m/s or mph, and then I can calculate the kinetic energy without inventing a value.";
    case "model_only_fallback.electron_proton_comparison":
      return [
        "An electron has negative charge, while a proton has positive charge.",
        "An electron is much lighter than a proton; a proton has about 1836 times the electron's mass.",
        "In atoms, electrons occupy orbitals around the nucleus and drive bonding and electric current, while protons sit in the nucleus and help determine which element the atom is.",
        "One practical consequence is that chemistry is mostly controlled by electron arrangements, while changing the proton count changes the element itself.",
      ].join(" ");
    case "model_only_fallback.generic_electron":
      return "An electron is a fundamental subatomic particle with a negative electric charge. Electrons surround atomic nuclei in atoms, help determine chemical bonding, and also carry electric current in many materials.";
    case "model_only_fallback.proper_time_coordinate_time":
      return "Proper time is the time measured by a clock moving along a particular worldline. Coordinate time is the time label assigned by a chosen reference frame or coordinate system, so different observers or coordinates can assign different coordinate times to the same events.";
    case "model_only_fallback.extrinsic_curvature":
      return "Extrinsic curvature describes how a slice or surface is bending within a larger surrounding spacetime. In general relativity's 3+1 view, it helps track how a spatial slice changes as it evolves from one moment to the next.";
    case "model_only_fallback.doppler_effect":
      return "The Doppler effect is the apparent change in a wave's frequency when the source and observer move relative to each other. For light, motion toward you shifts the light bluer, and motion away shifts it redder. For sound, the same idea makes a siren seem higher-pitched as it approaches and lower-pitched as it moves away.";
    case "model_only_fallback.document_summary_definition":
      return "A document summary is a shortened explanation of a document's main purpose, key points, and important caveats. It helps a reader understand what the document is about without reading every detail.";
    case "model_only_fallback.workspace_help":
      return "I can help with docs, notes, source paths, evidence location, comparisons, summaries, and background-only explanations. I can open or search workspace docs, locate specific lines, create or append notes, compare notes against documents, and answer general questions without using workspace tools when the prompt asks for background-only reasoning.";
    case "model_only_fallback.momentum_conservation":
      return "Momentum is conserved in an isolated two-object collision because the net external impulse on the two-object system is zero. The objects exert equal and opposite internal forces on each other, so their internal impulses cancel when you add the two momenta together. Individual momenta can change during the collision, but the total momentum of the isolated system remains constant.";
    case "model_only_fallback.receipts_observations_terminal_authority":
      return "Calculator receipts are observations: they record the tool input, execution trace, and result so the solver can verify what happened. They can support a final answer, but they are not terminal authority by themselves. Terminal authority must select a completed answer artifact after the observation has re-entered the solver path.";
    default:
      return null;
  }
};
