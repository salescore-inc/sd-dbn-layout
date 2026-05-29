export const minimalSdDbnDocument = {
  "@type": "SD-DBN",
  version: "3.0",
  id: "doc-minimal-001",
  subject: "subject-001",
  schema: {
    variables: [
      {
        id: "S_context",
        kind: "situation",
        domain: ["false", "true"],
        text: "Context is active",
      },
      {
        id: "X_state",
        kind: "latent",
        role: "state",
        domain: ["absent", "present"],
        text: "Latent state is present",
      },
      {
        id: "X_solution",
        kind: "latent",
        role: "means",
        domain: ["unfit", "fit"],
        desired_values: ["fit"],
        undesired_values: ["unfit"],
        text: "Proposed means fits",
      },
      {
        id: "O_statement",
        kind: "observation",
        domain: ["unobserved", "observed"],
        text: "Statement was observed",
      },
    ],
    relations: [
      {
        id: "r_context_state",
        type: "conditioning",
        scheme: "CONDITIONS",
        from: "S_context",
        to: "X_state",
        cpd: {
          direction: "increase",
          strength: "moderate",
        },
      },
      {
        id: "r_solution_state",
        type: "inference",
        scheme: "RESOLVES",
        from: "X_solution",
        to: "X_state",
        cpd: {
          direction: "decrease",
          strength: "moderate",
        },
      },
      {
        id: "r_state_statement",
        type: "emission",
        scheme: "MANIFESTS_AS",
        from: "X_state",
        to: "O_statement",
        cpd: {
          "present->observed": 0.8,
          "absent->observed": 0.2,
        },
      },
    ],
  },
  events: [
    {
      id: "e1",
      seq: 1,
      time: {
        abs: "2026-05-29T00:00:00",
      },
      type: "situated",
      variable: "S_context",
      value: "true",
      evidence_state: "agreed",
    },
    {
      id: "e2",
      seq: 2,
      time: {
        abs: "2026-05-29T00:01:00",
      },
      type: "observed",
      variable: "O_statement",
      value: "observed",
      evidence_state: "mentioned",
    },
    {
      id: "e3",
      seq: 3,
      time: {
        abs: "2026-05-29T00:02:00",
      },
      type: "believed",
      variable: "X_state",
      posterior: {
        present: 0.8,
        absent: 0.2,
      },
      from_observation: "e2",
      evidence_state: "agreed",
    },
    {
      id: "e4",
      seq: 4,
      time: {
        abs: "2026-05-29T00:03:00",
      },
      type: "believed",
      variable: "X_solution",
      posterior: {
        fit: 0.72,
        unfit: 0.28,
      },
      evidence_state: "mentioned",
    },
    {
      id: "e5",
      seq: 5,
      time: {
        abs: "2026-05-29T00:04:00",
      },
      type: "argued",
      relation_id: "r_solution_state",
      evidence_state: "rejected",
      attack_type: "undercut",
    },
  ],
};
