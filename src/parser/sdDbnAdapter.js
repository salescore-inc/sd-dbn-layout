const GROUP_DEFINITIONS = [
  {
    id: "G_situation",
    label: "Situation",
    match: (variable) => variable.kind === "situation",
  },
  {
    id: "G_state",
    label: "State",
    match: (variable) => variable.kind === "latent" && variable.role === "state",
  },
  {
    id: "G_goal",
    label: "Goal",
    match: (variable) => variable.kind === "latent" && variable.role === "goal",
  },
  {
    id: "G_means",
    label: "Means",
    match: (variable) => variable.kind === "latent" && variable.role === "means",
  },
  {
    id: "G_obstacle",
    label: "Obstacle",
    match: (variable) => variable.kind === "latent" && variable.role === "obstacle",
  },
  {
    id: "G_factor",
    label: "Factor",
    match: (variable) => variable.kind === "latent" && variable.role === "factor",
  },
  {
    id: "G_observation",
    label: "Observation",
    match: (variable) => variable.kind === "observation",
  },
  {
    id: "G_other",
    label: "Other",
    match: () => true,
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
  const groupedVariables = GROUP_DEFINITIONS.map((definition) => ({
    definition,
    variables: [],
  }));

  variables.forEach((variable) => {
    const group = groupedVariables.find(({ definition }) => definition.match(variable));
    group.variables.push(variable);
  });

  return groupedVariables.map(({ definition, variables: groupVariables }) => {
    return {
      id: definition.id,
      label: definition.label,
      direction: "vstack",
      nodes: groupVariables.map((variable) => toLayoutNode(variable, projection.get(variable.id))),
    };
  }).filter((group) => group.nodes.length > 0);
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
