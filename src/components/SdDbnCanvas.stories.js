import { html } from "lit";
import { sampleCanvas } from "../examples/sampleGraph.js";
import {
  adjacentGroupsCanvas,
  compactNodeSizeCanvas,
  crossEdgeCanvas,
  denseCanvas,
  deepNestedCanvas,
  horizontalStackCanvas,
  mixedCanvas,
  nestedGroupCanvas,
  verticalStackCanvas,
} from "../examples/previewGraphs.js";

const meta = {
  title: "SD-DBN/SdDbnCanvas",
  component: "sd-dbn-canvas",
  argTypes: {
    height: {
      control: { type: "range", min: 360, max: 1120, step: 20 },
    },
    theme: {
      control: "inline-radio",
      options: ["light", "dark", "forest", "mono", "contrast"],
    },
  },
};

export default meta;

const renderCanvas = ({ canvas, height, theme }) => html`
  <div class="storybook-canvas-frame" data-theme=${theme} style="height: ${height}px;">
    <sd-dbn-canvas .canvas=${canvas}></sd-dbn-canvas>
  </div>
`;

const callCanvasApi = (event, method, ...args) => {
  const root = event.currentTarget.closest(".storybook-api-frame");
  const canvas = root.querySelector("sd-dbn-canvas");
  canvas[method](...args);
};

const callCanvasApis = (event, calls) => {
  const root = event.currentTarget.closest(".storybook-api-frame");
  const canvas = root.querySelector("sd-dbn-canvas");
  calls.forEach(([method, ...args]) => canvas[method](...args));
};

const renderApiCanvas = ({ canvas, height, theme }) => html`
  <div class="storybook-api-frame" data-theme=${theme}>
    <div class="storybook-api-toolbar">
      <button type="button" @click=${(event) => callCanvasApi(event, "optimizeViewport")}>
        Fit All
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "focusGroup", "G_diagnosis")}>
        Focus Diagnosis
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "focusGroup", "G_process_evidence")}>
        Focus Evidence
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "focusNode", "N_response_2")}>
        Focus Node
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "focusNode", "N_response_2", { highlight: true })}>
        Focus + Highlight
      </button>
      <button type="button" @click=${(event) => callCanvasApis(event, [["focusNode", "N_response_2"], ["highlightGroup", "G_process"]])}>
        Focus Node + Highlight Group
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "highlightNode", "N_people_1")}>
        Highlight Node
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "highlightGroup", "G_process")}>
        Highlight Group
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "clearHighlight")}>
        Clear Highlight
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "clearFocus")}>
        Clear Focus
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "clearVisualState")}>
        Clear Visuals
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "showMinimap")}>
        Show Minimap
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "hideMinimap")}>
        Hide Minimap
      </button>
      <button type="button" @click=${(event) => callCanvasApi(event, "resetViewport")}>
        Reset
      </button>
    </div>
    <div class="storybook-canvas-frame" style="height: ${height}px;">
      <sd-dbn-canvas .canvas=${canvas}></sd-dbn-canvas>
    </div>
  </div>
`;

export const ProjectionDefault = {
  name: "Projection / Default",
  render: renderCanvas,
  args: {
    canvas: sampleCanvas,
    height: 620,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const NestedGroups = {
  name: "Nested Groups",
  render: renderCanvas,
  args: {
    canvas: nestedGroupCanvas,
    height: 620,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const VerticalStack = {
  name: "VStack",
  render: renderCanvas,
  args: {
    canvas: verticalStackCanvas,
    height: 720,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const HorizontalStack = {
  name: "HStack",
  render: renderCanvas,
  args: {
    canvas: horizontalStackCanvas,
    height: 560,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const DenseMargins = {
  name: "Dense Margins",
  render: renderCanvas,
  args: {
    canvas: denseCanvas,
    height: 520,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const DeepNested = {
  name: "Deep Nested",
  render: renderCanvas,
  args: {
    canvas: deepNestedCanvas,
    height: 820,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const CrossEdges = {
  name: "Cross Edges",
  render: renderCanvas,
  args: {
    canvas: crossEdgeCanvas,
    height: 860,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const MixedCanvas = {
  name: "Mixed Canvas",
  render: renderCanvas,
  args: {
    canvas: mixedCanvas,
    height: 680,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const CompactNodeSize = {
  name: "Compact Node Size",
  render: renderCanvas,
  args: {
    canvas: compactNodeSizeCanvas,
    height: 760,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const DarkProjection = {
  name: "Dark / Projection",
  render: renderCanvas,
  args: {
    canvas: sampleCanvas,
    height: 620,
    theme: "dark",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const DarkDeepNested = {
  name: "Dark / Deep Nested",
  render: renderCanvas,
  args: {
    canvas: deepNestedCanvas,
    height: 820,
    theme: "dark",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const ForestProjection = {
  name: "Theme / Forest",
  render: renderCanvas,
  args: {
    canvas: sampleCanvas,
    height: 620,
    theme: "forest",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const MonoProjection = {
  name: "Theme / Mono",
  render: renderCanvas,
  args: {
    canvas: sampleCanvas,
    height: 620,
    theme: "mono",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const ContrastProjection = {
  name: "Theme / Contrast",
  render: renderCanvas,
  args: {
    canvas: sampleCanvas,
    height: 620,
    theme: "contrast",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const ViewportApi = {
  name: "API / Viewport Focus",
  render: renderApiCanvas,
  args: {
    canvas: deepNestedCanvas,
    height: 760,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};

export const AdjacentGroups = {
  name: "Stress / Adjacent Groups",
  render: renderCanvas,
  args: {
    canvas: adjacentGroupsCanvas,
    height: 1120,
    theme: "light",
  },
  parameters: {
    controls: { exclude: ["canvas"] },
  },
};
