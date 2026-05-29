const ROLE_GROUP_DEFINITIONS = [
  {
    id: "G_role_state",
    label: "State",
    role: "state",
  },
  {
    id: "G_role_means",
    label: "Means",
    role: "means",
  },
  {
    id: "G_role_obstacle",
    label: "Obstacle",
    role: "obstacle",
  },
  {
    id: "G_role_factor",
    label: "Factor",
    role: "factor",
  },
  {
    id: "G_role_goal",
    label: "Goal",
    role: "goal",
  },
  {
    id: "G_role_other",
    label: "Other",
    role: undefined,
  },
];

const EVENT_TYPES_BY_VARIABLE = new Set(["believed", "observed", "situated"]);

export function sdDbnToCanvas(document, options = {}) {
  assertSdDbnDocument(document);

  const variables = document.schema.variables;
  const relations = document.schema.relations;
  const events = document.events ?? [];
  const variableProjection = projectVariables(events);
  const relationProjection = projectRelations(events);

  const groups = buildGroups(variables, variableProjection);

  return {
    id: options.id ?? `${document.id}-layout`,
    label: options.label ?? document.subject ?? document.id,
    direction: options.direction ?? "hstack",
    nodeSize: options.nodeSize,
    nodeEdgeJoint: options.nodeEdgeJoint,
    margins: options.margins,
    groups,
    edges: relations.map((relation) => toLayoutEdge(relation, relationProjection.get(relation.id))),
  };
}

function assertSdDbnDocument(document) {
  if (!document || document["@type"] !== "SD-DBN") {
    throw new TypeError("Expected an SD-DBN document with @type=\"SD-DBN\".");
  }

  if (!Array.isArray(document.schema?.variables)) {
    throw new TypeError("Expected schema.variables to be an array.");
  }

  if (!Array.isArray(document.schema?.relations)) {
    throw new TypeError("Expected schema.relations to be an array.");
  }
}

function projectVariables(events) {
  const latest = new Map();

  sortedEvents(events).forEach((event) => {
    if (!EVENT_TYPES_BY_VARIABLE.has(event.type) || !event.variable) {
      return;
    }

    latest.set(event.variable, {
      eventId: event.id,
      eventType: event.type,
      evidenceState: event.evidence_state,
      posterior: event.posterior,
      value: event.value,
      seq: event.seq,
    });
  });

  return latest;
}

function projectRelations(events) {
  const latest = new Map();

  sortedEvents(events).forEach((event) => {
    if (event.type !== "argued" || !event.relation_id) {
      return;
    }

    latest.set(event.relation_id, {
      eventId: event.id,
      evidenceState: event.evidence_state,
      attackType: event.attack_type,
      seq: event.seq,
    });
  });

  return latest;
}

function sortedEvents(events) {
  return [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

function buildGroups(variables, projection) {
  const situations = variables.filter((variable) => variable.kind === "situation");
  const observations = variables.filter((variable) => variable.kind === "observation");
  const latents = variables.filter((variable) => variable.kind === "latent");
  const otherVariables = variables.filter((variable) => !["situation", "latent", "observation"].includes(variable.kind));
  const groups = [];

  if (situations.length > 0) {
    groups.push(createNodeGroup("G_context", "Context", situations, projection));
  }

  if (latents.length > 0) {
    groups.push({
      id: "G_argument",
      label: "Argument",
      direction: "vstack",
      groups: buildRoleGroups(latents, projection),
    });
  }

  if (observations.length > 0) {
    groups.push(createNodeGroup("G_observation", "Observation", observations, projection));
  }

  if (otherVariables.length > 0) {
    groups.push(createNodeGroup("G_other", "Other", otherVariables, projection));
  }

  return groups;
}

function buildRoleGroups(latents, projection) {
  const remaining = new Set(latents);
  const roleGroups = ROLE_GROUP_DEFINITIONS.map((definition) => {
    const roleVariables = latents.filter((variable) => {
      if (definition.role === undefined) {
        return !variable.role || !ROLE_GROUP_DEFINITIONS.some((roleDefinition) => roleDefinition.role === variable.role);
      }

      return variable.role === definition.role;
    });

    roleVariables.forEach((variable) => remaining.delete(variable));
    return createNodeGroup(definition.id, definition.label, roleVariables, projection);
  }).filter((group) => group.nodes.length > 0);

  if (remaining.size > 0) {
    roleGroups.push(createNodeGroup("G_role_unclassified", "Unclassified", [...remaining], projection));
  }

  return roleGroups;
}

function createNodeGroup(id, label, variables, projection) {
  return {
    id,
    label,
    direction: "vstack",
    nodes: variables.map((variable) => toLayoutNode(variable, projection.get(variable.id))),
  };
}

function toLayoutNode(variable, projection) {
  const meta = [variable.kind, variable.role].filter(Boolean).join(" / ");

  return {
    id: variable.id,
    label: variable.text ?? variable.id,
    meta,
    state: projection?.evidenceState ?? "none",
    posterior: projection?.posterior,
    value: projection?.value,
    sdDbn: {
      kind: variable.kind,
      role: variable.role,
      subkind: variable.subkind,
      domain: variable.domain,
      eventId: projection?.eventId,
    },
  };
}

function toLayoutEdge(relation, projection) {
  return {
    id: relation.id,
    from: relation.from,
    to: relation.to,
    label: relation.scheme ?? relation.type,
    state: projection?.evidenceState,
    sdDbn: {
      type: relation.type,
      scheme: relation.scheme,
      subrelation: relation.subrelation,
      eventId: projection?.eventId,
      attackType: projection?.attackType,
    },
  };
}
