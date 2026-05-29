const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_SIZE = 24;

export function createSvgRenderer(root, layout) {
  const svg = createElement("svg", {
    class: "graph-svg",
    role: "img",
    "aria-label": layout.label ?? "Graph canvas",
  });
  const defs = createElement("defs");
  const marker = createElement("marker", {
    id: "arrow",
    markerWidth: "10",
    markerHeight: "10",
    refX: "9",
    refY: "3",
    orient: "auto",
    markerUnits: "userSpaceOnUse",
  });
  marker.appendChild(createElement("path", {
    d: "M0,0 L0,6 L9,3 z",
    fill: "context-stroke",
  }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const viewport = createElement("g", { class: "viewport" });
  const visualState = {
    focusIds: [],
    highlightIds: [],
  };
  svg.appendChild(viewport);
  root.replaceChildren(svg);
  bindEdgeHover(svg);

  return {
    svg,
    viewport,
    draw(transform) {
      viewport.setAttribute("transform", toTransform(transform));
      setGridTransform(root, transform);
      drawGraph(viewport, layout);
      applyVisualState(svg, visualState);
    },
    setVisualState(nextState = {}) {
      visualState.focusIds = nextState.focusIds ?? visualState.focusIds;
      visualState.highlightIds = nextState.highlightIds ?? visualState.highlightIds;
      applyVisualState(svg, visualState);
    },
  };
}

function drawGraph(viewport, layout) {
  viewport.replaceChildren();

  const groupLayer = createElement("g", { class: "group-layer" });
  const nodeLayer = createElement("g", { class: "node-layer" });
  const portLayer = createElement("g", { class: "port-layer" });
  const edgeLayer = createElement("g", { class: "edge-layer" });
  const labelLayer = createElement("g", { class: "label-layer" });

  viewport.append(groupLayer, nodeLayer, portLayer, edgeLayer, labelLayer);

  layout.groups
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .forEach((group) => drawGroup(groupLayer, labelLayer, group));

  layout.nodes.forEach((node) => drawNode(nodeLayer, portLayer, labelLayer, node));
  layout.edges.forEach((edge) => drawEdge(edgeLayer, labelLayer, edge));
}

function drawGroup(layer, labelLayer, group) {
  const item = createElement("g", { class: "group", "data-id": group.id });

  item.appendChild(createElement("rect", {
    class: "group-box",
    x: group.x,
    y: group.y,
    width: group.width,
    height: group.height,
    rx: 7,
  }));

  labelLayer.appendChild(createText(group.label, {
    class: "group-title",
    "data-id": group.id,
    x: group.x + 14,
    y: group.y + 22,
  }));

  layer.appendChild(item);
}

function drawNode(layer, portLayer, labelLayer, node) {
  const item = createElement("g", { class: "node", "data-id": node.id });

  item.appendChild(createElement("rect", {
    class: "node-box",
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rx: 6,
  }));

  layer.appendChild(item);

  wrapLabel(node.label, 22).forEach((line, index) => {
    labelLayer.appendChild(createText(line, {
      class: "node-title",
      "data-id": node.id,
      x: node.x + 14,
      y: node.y + 23 + index * 15,
    }));
  });

  if (node.meta) {
    labelLayer.appendChild(createText(node.meta, {
      class: "node-meta",
      "data-id": node.id,
      x: node.x + 14,
      y: node.y + node.height - 14,
    }));
  }

  getNodePorts(node).forEach((port) => {
    portLayer.appendChild(createElement("circle", {
      class: "port",
      cx: port.x,
      cy: port.y,
      r: 4,
    }));
  });
}

function drawEdge(layer, labelLayer, edge) {
  const pathData = edge.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const item = createElement("g", { class: "edge", "data-id": edge.id });

  item.appendChild(createElement("path", {
    class: "edge-hit",
    d: pathData,
  }));

  item.appendChild(createElement("path", {
    class: `edge-path ${edge.state ?? ""}`,
    d: pathData,
    "marker-end": "url(#arrow)",
  }));

  const label = edge.label ?? "";
  const labelWidth = Math.max(46, label.length * 6.8 + 14);
  const labelItem = createElement("g", { class: "edge-label-group", "data-id": edge.id });

  labelItem.appendChild(createElement("rect", {
    class: "edge-label-bg",
    x: edge.labelPoint.x - labelWidth / 2,
    y: edge.labelPoint.y - 11,
    width: labelWidth,
    height: 20,
    rx: 5,
  }));

  labelItem.appendChild(createText(label, {
    class: "edge-label",
    x: edge.labelPoint.x,
    y: edge.labelPoint.y + 4,
    "text-anchor": "middle",
  }));

  layer.appendChild(item);
  labelLayer.appendChild(labelItem);
}

function bindEdgeHover(svg) {
  svg.addEventListener("pointermove", (event) => {
    const target = event.target.closest?.(".edge, .edge-label-group");
    setHoveredEdge(svg, target?.dataset.id ?? null);
  });

  svg.addEventListener("pointerleave", () => {
    setHoveredEdge(svg, null);
  });
}

function setHoveredEdge(svg, edgeId) {
  svg.querySelectorAll(".edge.is-hovered, .edge-label-group.is-hovered")
    .forEach((element) => element.classList.remove("is-hovered"));

  if (!edgeId) {
    return;
  }

  svg.querySelectorAll(`.edge[data-id="${edgeId}"], .edge-label-group[data-id="${edgeId}"]`)
    .forEach((element) => element.classList.add("is-hovered"));
}

function applyVisualState(svg, state) {
  setItemState(svg, state.focusIds, "is-focused");
  setItemState(svg, state.highlightIds, "is-highlighted");
}

function setItemState(svg, ids, className) {
  svg.querySelectorAll(`.node.${className}, .group.${className}, .node-title.${className}, .node-meta.${className}, .group-title.${className}`)
    .forEach((element) => element.classList.remove(className));

  ids.forEach((id) => {
    queryItemElements(svg, id)
      .forEach((element) => element.classList.add(className));
  });
}

function queryItemElements(svg, id) {
  const itemId = String(id);
  const escapedId = globalThis.CSS?.escape
    ? CSS.escape(itemId)
    : itemId.replace(/["\\]/g, "\\$&");
  return svg.querySelectorAll(`.node[data-id="${escapedId}"], .group[data-id="${escapedId}"], .node-title[data-id="${escapedId}"], .node-meta[data-id="${escapedId}"], .group-title[data-id="${escapedId}"]`);
}

function setGridTransform(root, transform) {
  const gridSize = Math.max(1, GRID_SIZE * transform.scale);
  root.style.setProperty("--grid-size", `${gridSize}px`);
  root.style.setProperty("--grid-x", `${positiveModulo(transform.x, gridSize)}px`);
  root.style.setProperty("--grid-y", `${positiveModulo(transform.y, gridSize)}px`);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getNodePorts(node) {
  return [
    { x: node.x + node.width / 2, y: node.y },
    { x: node.x + node.width, y: node.y + node.height / 2 },
    { x: node.x + node.width / 2, y: node.y + node.height },
    { x: node.x, y: node.y + node.height / 2 },
  ];
}

function createElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function createText(value, attributes = {}) {
  const text = createElement("text", attributes);
  text.textContent = value;
  return text;
}

function toTransform(transform) {
  return `translate(${transform.x} ${transform.y}) scale(${transform.scale})`;
}

function wrapLabel(label, maxLength) {
  const words = label.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}
