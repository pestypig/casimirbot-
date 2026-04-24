// panel-adapter-handler.template.ts

if (panelId === "<panel_id>" && actionId === "<action_id>") {
  const args = asRecord(request.args) ?? {};
  const required = asNonEmptyString(args.<required_key>);
  if (!required) {
    return {
      ok: false,
      panel_id: panelId,
      action_id: actionId,
      message: "<panel_id>.<action_id> requires <required_key>.",
    };
  }

  // Optional destructive confirmation gate
  // const confirmed = asBoolean(args.confirmed);
  // if (confirmed !== true) {
  //   return {
  //     ok: false,
  //     panel_id: panelId,
  //     action_id: actionId,
  //     message: "<panel_id>.<action_id> requires confirmation. Re-run with args.confirmed=true.",
  //     artifact: { requires_confirmation: true, action_id: actionId },
  //   };
  // }

  // Perform state mutation here using store helpers.

  return {
    ok: true,
    panel_id: panelId,
    action_id: actionId,
    artifact: {
      <artifact_key>: <artifact_value>,
    },
  };
}
