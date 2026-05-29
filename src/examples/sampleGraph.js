export const sampleCanvas = {
  id: "sales-dbn-canvas",
  label: "Sales DBN Projection",
  direction: "auto",
  margins: {
    nodeNode: { x: 108, y: 56 },
    groupGroup: { x: 88, y: 66 },
    groupNode: { x: 46, y: 34 },
  },
  nodes: [
    {
      id: "N_outcome",
      label: "Stable onboarding judgment",
      meta: "latent / goal",
    },
  ],
  groups: [
    {
      id: "G_context",
      label: "Context",
      direction: "vstack",
      nodes: [
        {
          id: "N_hiring",
          label: "New graduate intake grows",
          meta: "situation",
        },
        {
          id: "N_variance",
          label: "Judgment differs by manager",
          meta: "observation",
        },
      ],
    },
    {
      id: "G_mechanism",
      label: "Mechanism",
      direction: "hstack",
      groups: [
        {
          id: "G_problem",
          label: "Problem",
          direction: "vstack",
          nodes: [
            {
              id: "N_invisible",
              label: "Progress is hard to observe",
              meta: "latent / state",
            },
            {
              id: "N_delay",
              label: "Intervention is delayed",
              meta: "latent / obstacle",
            },
          ],
        },
        {
          id: "G_solution",
          label: "Solution",
          direction: "vstack",
          nodes: [
            {
              id: "N_metrics",
              label: "Action metrics reveal progress",
              meta: "latent / means",
            },
            {
              id: "N_review",
              label: "Weekly review closes gaps",
              meta: "latent / means",
            },
          ],
        },
      ],
    },
  ],
  edges: [
    {
      id: "E_context_problem",
      from: "G_context",
      to: "G_problem",
      label: "CONDITIONS",
    },
    {
      id: "E_hiring_invisible",
      from: "N_hiring",
      to: "N_invisible",
      label: "CAUSES",
    },
    {
      id: "E_variance_invisible",
      from: "N_variance",
      to: "N_invisible",
      label: "SUPPORTS",
    },
    {
      id: "E_invisible_delay",
      from: "N_invisible",
      to: "N_delay",
      label: "COMPOSES",
    },
    {
      id: "E_metrics_problem",
      from: "N_metrics",
      to: "G_problem",
      label: "RESOLVES",
    },
    {
      id: "E_review_delay",
      from: "N_review",
      to: "N_delay",
      label: "MITIGATES",
      state: "rejected",
    },
    {
      id: "E_solution_outcome",
      from: "G_solution",
      to: "N_outcome",
      label: "ENABLES",
    },
  ],
};
