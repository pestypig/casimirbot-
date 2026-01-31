---
id: units-systems
aliases: ["SI units", "geometrized units", "natural units"]
scope: unit conventions and conversions used across the physics pipeline
intentHints: ["define", "what is", "explain"]
topicTags: ["physics"]
mustIncludeFiles: ["shared/math-stage.ts", "modules/core/physics-constants.ts"]
---
Definition: Units systems define how length, time, mass, and energy are measured and converted; this repo uses geometrized units internally and converts to SI at boundaries.
Key questions: Which units are assumed in a module, and where are conversions applied?
Notes: Use shared/math-stage.ts and modules/core/physics-constants.ts as anchors for unit metadata and constants.
