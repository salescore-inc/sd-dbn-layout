import { sampleCanvas } from "./sampleGraph.js";

export const verticalStackCanvas = {
  ...sampleCanvas,
  id: "vertical-stack-preview",
  label: "Vertical Stack Preview",
  direction: "vstack",
  groups: sampleCanvas.groups.map((group) => ({
    ...group,
    direction: "vstack",
  })),
};

export const horizontalStackCanvas = {
  ...sampleCanvas,
  id: "horizontal-stack-preview",
  label: "Horizontal Stack Preview",
  direction: "hstack",
};

export const nestedGroupCanvas = {
  id: "nested-group-preview",
  label: "Nested Group Preview",
  direction: "auto",
  margins: {
    nodeNode: { x: 96, y: 48 },
    groupGroup: { x: 78, y: 60 },
    groupNode: { x: 42, y: 32 },
  },
  groups: [
    {
      id: "G_outer",
      label: "Outer Group",
      direction: "hstack",
      groups: [
        {
          id: "G_inner_left",
          label: "Inner Left",
          direction: "vstack",
          nodes: [
            {
              id: "N_left_1",
              label: "Situation establishes pressure",
              meta: "situation",
            },
            {
              id: "N_left_2",
              label: "Observation supports the latent state",
              meta: "observation",
            },
          ],
        },
        {
          id: "G_inner_right",
          label: "Inner Right",
          direction: "vstack",
          nodes: [
            {
              id: "N_right_1",
              label: "Latent state becomes visible",
              meta: "latent / state",
            },
            {
              id: "N_right_2",
              label: "Proposed means resolves the issue",
              meta: "latent / means",
            },
          ],
        },
      ],
    },
  ],
  nodes: [
    {
      id: "N_outside",
      label: "Top-level canvas node",
      meta: "canvas child",
    },
  ],
  edges: [
    {
      id: "E_group_group",
      from: "G_inner_left",
      to: "G_inner_right",
      label: "GROUP-GROUP",
    },
    {
      id: "E_node_node",
      from: "N_left_2",
      to: "N_right_1",
      label: "NODE-NODE",
    },
    {
      id: "E_group_node",
      from: "G_outer",
      to: "N_outside",
      label: "GROUP-NODE",
    },
  ],
};

export const denseCanvas = {
  id: "dense-margin-preview",
  label: "Dense Margin Preview",
  direction: "auto",
  margins: {
    nodeNode: { x: 66, y: 36 },
    groupGroup: { x: 52, y: 42 },
    groupNode: { x: 28, y: 22 },
  },
  groups: [
    {
      id: "G_cluster",
      label: "Compact Cluster",
      direction: "hstack",
      nodes: [
        {
          id: "N_a",
          label: "A",
          meta: "node",
        },
        {
          id: "N_b",
          label: "B",
          meta: "node",
        },
        {
          id: "N_c",
          label: "C",
          meta: "node",
        },
        {
          id: "N_d",
          label: "D",
          meta: "node",
        },
      ],
    },
  ],
  nodes: [
    {
      id: "N_e",
      label: "External",
      meta: "node",
    },
  ],
  edges: [
    { id: "E_ab", from: "N_a", to: "N_b", label: "A-B" },
    { id: "E_bc", from: "N_b", to: "N_c", label: "B-C" },
    { id: "E_cd", from: "N_c", to: "N_d", label: "C-D" },
    { id: "E_de", from: "G_cluster", to: "N_e", label: "GROUP-NODE" },
  ],
};

export const deepNestedCanvas = {
  id: "deep-nested-preview",
  label: "Deep Nested Preview",
  direction: "hstack",
  groups: [
    {
      id: "G_market",
      label: "Market Context",
      direction: "vstack",
      nodes: [
        { id: "N_market_1", label: "Hiring demand expands", meta: "situation" },
        { id: "N_market_2", label: "Enablement capacity is constrained", meta: "latent / state" },
      ],
    },
    {
      id: "G_diagnosis",
      label: "Diagnosis",
      direction: "hstack",
      groups: [
        {
          id: "G_people",
          label: "People",
          direction: "vstack",
          groups: [
            {
              id: "G_people_evidence",
              label: "Evidence",
              direction: "vstack",
              nodes: [
                { id: "N_people_1", label: "Manager judgment differs", meta: "observation" },
                { id: "N_people_2", label: "Feedback timing varies", meta: "observation" },
              ],
            },
          ],
          nodes: [
            { id: "N_people_3", label: "Coaching quality drifts", meta: "latent / obstacle" },
          ],
        },
        {
          id: "G_process",
          label: "Process",
          direction: "vstack",
          groups: [
            {
              id: "G_process_evidence",
              label: "Evidence",
              direction: "hstack",
              nodes: [
                { id: "N_process_1", label: "Review cadence is unclear", meta: "observation" },
                { id: "N_process_2", label: "Action history is fragmented", meta: "observation" },
              ],
            },
          ],
          nodes: [
            { id: "N_process_3", label: "Progress state is not shared", meta: "latent / state" },
          ],
        },
      ],
    },
    {
      id: "G_response",
      label: "Response",
      direction: "vstack",
      nodes: [
        { id: "N_response_1", label: "Standardize action metrics", meta: "latent / means" },
        { id: "N_response_2", label: "Run weekly exception review", meta: "latent / means" },
        { id: "N_response_3", label: "Stabilize onboarding decision", meta: "latent / goal" },
      ],
    },
  ],
  edges: [
    { id: "E_market_diag", from: "G_market", to: "G_diagnosis", label: "CONDITIONS" },
    { id: "E_market_people", from: "N_market_2", to: "N_people_3", label: "CAUSES" },
    { id: "E_people_process", from: "G_people_evidence", to: "G_process_evidence", label: "SUPPORTS" },
    { id: "E_people_obstacle", from: "N_people_1", to: "N_people_3", label: "EXPLAINS" },
    { id: "E_process_state", from: "N_process_2", to: "N_process_3", label: "EXPLAINS" },
    { id: "E_metrics_people", from: "N_response_1", to: "N_people_3", label: "MITIGATES" },
    { id: "E_review_process", from: "N_response_2", to: "N_process_3", label: "RESOLVES" },
    { id: "E_goal", from: "G_response", to: "N_response_3", label: "ENABLES" },
  ],
};

export const crossEdgeCanvas = {
  id: "cross-edge-preview",
  label: "Cross Edge Preview",
  direction: "hstack",
  margins: {
    nodeNode: { x: 102, y: 48 },
    groupGroup: { x: 96, y: 64 },
    groupNode: { x: 46, y: 30 },
  },
  groups: [
    {
      id: "G_situations",
      label: "Situations",
      direction: "vstack",
      nodes: [
        { id: "N_s1", label: "Intake grows quickly", meta: "situation" },
        { id: "N_s2", label: "Team coverage is uneven", meta: "situation" },
        { id: "N_s3", label: "Pipeline standards shift", meta: "situation" },
      ],
    },
    {
      id: "G_states",
      label: "States",
      direction: "vstack",
      nodes: [
        { id: "N_x1", label: "Readiness is opaque", meta: "latent / state" },
        { id: "N_x2", label: "Manager load increases", meta: "latent / factor" },
        { id: "N_x3", label: "Intervention is late", meta: "latent / obstacle" },
      ],
    },
    {
      id: "G_means",
      label: "Means",
      direction: "vstack",
      nodes: [
        { id: "N_m1", label: "Visible action metrics", meta: "latent / means" },
        { id: "N_m2", label: "Exception review loop", meta: "latent / means" },
        { id: "N_m3", label: "Manager calibration", meta: "latent / means" },
      ],
    },
    {
      id: "G_outcomes",
      label: "Outcomes",
      direction: "vstack",
      nodes: [
        { id: "N_o1", label: "Decision consistency", meta: "latent / goal" },
        { id: "N_o2", label: "Early risk discovery", meta: "latent / goal" },
      ],
    },
  ],
  edges: [
    { id: "E_s1_x1", from: "N_s1", to: "N_x1", label: "CAUSES" },
    { id: "E_s2_x2", from: "N_s2", to: "N_x2", label: "CAUSES" },
    { id: "E_s3_x1", from: "N_s3", to: "N_x1", label: "CONDITIONS" },
    { id: "E_x1_x3", from: "N_x1", to: "N_x3", label: "COMPOSES" },
    { id: "E_x2_x3", from: "N_x2", to: "N_x3", label: "SUPPORTS" },
    { id: "E_m1_x1", from: "N_m1", to: "N_x1", label: "RESOLVES" },
    { id: "E_m2_x3", from: "N_m2", to: "N_x3", label: "MITIGATES" },
    { id: "E_m3_x2", from: "N_m3", to: "N_x2", label: "RESOLVES" },
    { id: "E_m1_o2", from: "N_m1", to: "N_o2", label: "ENABLES" },
    { id: "E_m2_o1", from: "N_m2", to: "N_o1", label: "ENABLES" },
    { id: "E_m3_o1", from: "N_m3", to: "N_o1", label: "SUPPORTS" },
  ],
};

export const mixedCanvas = {
  id: "mixed-canvas-preview",
  label: "Mixed Canvas Preview",
  direction: "auto",
  nodes: [
    { id: "N_entry", label: "Entry question", meta: "canvas node" },
    { id: "N_exit", label: "Decision output", meta: "canvas node" },
  ],
  groups: [
    {
      id: "G_left_mixed",
      label: "Left Mixed Group",
      direction: "hstack",
      nodes: [
        { id: "N_l1", label: "Initial signal", meta: "observation" },
        { id: "N_l2", label: "Initial belief", meta: "belief" },
      ],
    },
    {
      id: "G_right_mixed",
      label: "Right Mixed Group",
      direction: "vstack",
      groups: [
        {
          id: "G_right_nested",
          label: "Nested Assessment",
          direction: "hstack",
          nodes: [
            { id: "N_r1", label: "Risk indicator", meta: "latent / factor" },
            { id: "N_r2", label: "Remedy candidate", meta: "latent / means" },
          ],
        },
      ],
      nodes: [
        { id: "N_r3", label: "Assessment summary", meta: "latent / state" },
      ],
    },
  ],
  edges: [
    { id: "E_entry_left", from: "N_entry", to: "G_left_mixed", label: "STARTS" },
    { id: "E_l1_l2", from: "N_l1", to: "N_l2", label: "SUPPORTS" },
    { id: "E_left_right", from: "G_left_mixed", to: "G_right_mixed", label: "CONDITIONS" },
    { id: "E_r1_r3", from: "N_r1", to: "N_r3", label: "EXPLAINS" },
    { id: "E_r2_r3", from: "N_r2", to: "N_r3", label: "RESOLVES" },
    { id: "E_right_exit", from: "G_right_mixed", to: "N_exit", label: "PROJECTS" },
  ],
};

export const compactNodeSizeCanvas = {
  ...crossEdgeCanvas,
  id: "compact-node-size-preview",
  label: "Compact Node Size Preview",
  nodeSize: { width: 164, height: 72 },
  margins: {
    nodeNode: { x: 78, y: 40 },
    groupGroup: { x: 72, y: 52 },
    groupNode: { x: 36, y: 26 },
  },
};

const adjacentGroupIds = ["Discovery", "Evidence", "Belief", "Intervention", "Outcome"];

export const adjacentGroupsCanvas = {
  id: "adjacent-groups-preview",
  label: "Adjacent Groups Preview",
  direction: "hstack",
  nodeSize: { width: 172, height: 68 },
  margins: {
    nodeNode: { x: 88, y: 42 },
    groupGroup: { x: 104, y: 66 },
    groupNode: { x: 46, y: 34 },
  },
  groups: adjacentGroupIds.map((label, groupIndex) => ({
    id: `G_adj_${groupIndex + 1}`,
    label,
    direction: "vstack",
    nodes: Array.from({ length: 10 }, (_, nodeIndex) => ({
      id: `N_adj_${groupIndex + 1}_${nodeIndex + 1}`,
      label: `${label} ${nodeIndex + 1}`,
      meta: `group ${groupIndex + 1}`,
    })),
  })),
  edges: adjacentGroupIds.slice(0, -1).flatMap((_, groupIndex) => (
    Array.from({ length: 10 }, (_, nodeIndex) => ({
      id: `E_adj_${groupIndex + 1}_${nodeIndex + 1}`,
      from: `N_adj_${groupIndex + 1}_${nodeIndex + 1}`,
      to: `N_adj_${groupIndex + 2}_${nodeIndex + 1}`,
      label: `G${groupIndex + 1}-G${groupIndex + 2}`,
    }))
  )),
};
