// panel-capability.action.template.ts

{
  id: "<action_id>",
  title: "<Title>",
  description: "<What this action does>",
  risk: "low", // "low" | "medium" | "high"
  aliases: [
    "<natural phrase 1>",
    "<natural phrase 2>"
  ],
  required_args: ["<required_key>"],
  optional_args: ["<optional_key>"],
  requires_confirmation: false,
  returns_artifact: true,
}

// Destructive action example:
// requires_confirmation: true
// optional_args: ["confirmed"]
