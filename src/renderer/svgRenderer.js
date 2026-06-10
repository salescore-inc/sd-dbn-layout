const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_SIZE = 24;
const NODE_TEXT_PADDING_X = 14;
const NODE_TITLE_TOP = 23;
const NODE_TITLE_LINE_HEIGHT = 15;
const NODE_TITLE_META_GAP = 15;
const NODE_TITLE_BOTTOM_PADDING = 12;
const NODE_META_BOTTOM = 14;
const NODE_LABEL_CLIP_PADDING_Y = 8;
const ELLIPSIS = "...";

let rendererInstanceCount = 0;

export function createSvgRenderer(root, layout) {
  const rendererId = `sd-dbn-renderer-${rendererInstanceCount += 1}`;
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
      drawGraph(viewport, layout, rendererId);
      applyVisualState(svg, visualState);
    },
    setVisualState(nextState = {}) {
      visualState.focusIds = nextState.focusIds ?? visualState.focusIds;
      visualState.highlightIds = nextState.highlightIds ?? visualState.highlightIds;
      applyVisualState(svg, visualState);
    },
  };
}

function drawGraph(viewport, layout, rendererId) {
  viewport.replaceChildren();

  const defs = createElement("defs", { class: "graph-defs" });
  const groupLayer = createElement("g", { class: "group-layer" });
  const nodeLayer = createElement("g", { class: "node-layer" });
  const portLayer = createElement("g", { class: "port-layer" });
  const edgeLayer = createElement("g", { class: "edge-layer" });
  const labelLayer = createElement("g", { class: "label-layer" });

  viewport.append(defs, groupLayer, nodeLayer, portLayer, edgeLayer, labelLayer);

  layout.groups
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .forEach((group) => drawGroup(groupLayer, labelLayer, group));

  layout.nodes.forEach((node) => drawNode(nodeLayer, portLayer, labelLayer, defs, node, rendererId));
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

function drawNode(layer, portLayer, labelLayer, defs, node, rendererId) {
  const item = createElement("g", {
    class: ["node", stateClass(node.state)].filter(Boolean).join(" "),
    "data-id": node.id,
  });
  const clipPathId = createNodeLabelClipPath(defs, node, rendererId);
  const clipPath = `url(#${clipPathId})`;

  item.appendChild(createElement("rect", {
    class: "node-box",
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rx: 6,
  }));

  item.appendChild(createTitle(node.label));

  layer.appendChild(item);

  const textWidth = Math.max(1, node.width - NODE_TEXT_PADDING_X * 2);
  const maxLines = getNodeTitleLineLimit(node);
  wrapLabel(node.label, textWidth, { maxLines }).forEach((line, index) => {
    labelLayer.appendChild(createText(line, {
      class: "node-title",
      "data-id": node.id,
      x: node.x + NODE_TEXT_PADDING_X,
      y: node.y + NODE_TITLE_TOP + index * NODE_TITLE_LINE_HEIGHT,
      "clip-path": clipPath,
    }));
  });

  if (node.meta) {
    labelLayer.appendChild(createText(node.meta, {
      class: "node-meta",
      "data-id": node.id,
      x: node.x + NODE_TEXT_PADDING_X,
      y: node.y + node.height - NODE_META_BOTTOM,
      "clip-path": clipPath,
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

function createNodeLabelClipPath(defs, node, rendererId) {
  const clipPathId = `${rendererId}-node-label-${toSafeSvgIdPart(node.id)}`;
  const clipPath = createElement("clipPath", {
    id: clipPathId,
    clipPathUnits: "userSpaceOnUse",
  });
  clipPath.appendChild(createElement("rect", {
    x: node.x + NODE_TEXT_PADDING_X,
    y: node.y + NODE_LABEL_CLIP_PADDING_Y,
    width: Math.max(1, node.width - NODE_TEXT_PADDING_X * 2),
    height: Math.max(1, node.height - NODE_LABEL_CLIP_PADDING_Y * 2),
  }));
  defs.appendChild(clipPath);
  return clipPathId;
}

function getNodeTitleLineLimit(node) {
  const reservedBottom = node.meta
    ? NODE_META_BOTTOM + NODE_TITLE_META_GAP
    : NODE_TITLE_BOTTOM_PADDING;
  const lastBaseline = node.height - reservedBottom;
  return Math.max(1, Math.floor((lastBaseline - NODE_TITLE_TOP) / NODE_TITLE_LINE_HEIGHT) + 1);
}

function drawEdge(layer, labelLayer, edge) {
  const pathData = edge.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const item = createElement("g", {
    class: ["edge", stateClass(edge.state)].filter(Boolean).join(" "),
    "data-id": edge.id,
  });

  item.appendChild(createElement("path", {
    class: "edge-hit",
    d: pathData,
  }));

  item.appendChild(createElement("path", {
    class: "edge-path",
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

function stateClass(state) {
  return state ? `state-${state}` : "";
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

function createTitle(value) {
  const title = createElement("title");
  title.textContent = value;
  return title;
}

function toTransform(transform) {
  return `translate(${transform.x} ${transform.y}) scale(${transform.scale})`;
}

export function wrapLabel(label, maxWidth, options = {}) {
  const normalizedLabel = String(label ?? "").replace(/\s+/g, " ").trim();
  const lineLimit = options.maxLines ?? Number.POSITIVE_INFINITY;
  const maxLines = Number.isFinite(lineLimit)
    ? Math.max(1, Math.floor(lineLimit))
    : Number.POSITIVE_INFINITY;

  if (!normalizedLabel) {
    return [];
  }

  const lines = wrapTokens(segmentLabel(normalizedLabel), Math.max(1, maxWidth));
  return limitLines(lines, Math.max(1, maxWidth), maxLines);
}

function wrapTokens(tokens, maxWidth) {
  const lines = [];
  let line = "";

  tokens.forEach((token) => {
    if (token === " " && !line) {
      return;
    }

    const next = line ? `${line}${token}` : token.trimStart();

    if (measureTextWidth(next) <= maxWidth) {
      line = next;
      return;
    }

    if (line) {
      lines.push(line.trimEnd());
      line = "";
    }

    splitTokenToWidth(token.trimStart(), maxWidth).forEach((part) => {
      if (measureTextWidth(part) > maxWidth && !line) {
        lines.push(part);
        return;
      }

      if (!line) {
        line = part;
        return;
      }

      const splitNext = `${line}${part}`;
      if (measureTextWidth(splitNext) <= maxWidth) {
        line = splitNext;
      } else {
        lines.push(line.trimEnd());
        line = part;
      }
    });
  });

  if (line) {
    lines.push(line.trimEnd());
  }

  return lines;
}

function segmentLabel(label) {
  const tokens = [];
  let run = "";

  Array.from(label).forEach((character) => {
    if (character === " ") {
      flushRun(tokens, run);
      run = "";
      tokens.push(character);
      return;
    }

    if (isFullWidthCharacter(character)) {
      flushRun(tokens, run);
      run = "";
      tokens.push(character);
      return;
    }

    run += character;
  });

  flushRun(tokens, run);
  return tokens;
}

function flushRun(tokens, run) {
  if (run) {
    tokens.push(run);
  }
}

function splitTokenToWidth(token, maxWidth) {
  if (!token || measureTextWidth(token) <= maxWidth) {
    return token ? [token] : [];
  }

  const parts = [];
  let part = "";

  Array.from(token).forEach((character) => {
    const next = `${part}${character}`;
    if (part && measureTextWidth(next) > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part = next;
    }
  });

  if (part) {
    parts.push(part);
  }

  return parts;
}

function limitLines(lines, maxWidth, maxLines) {
  if (!Number.isFinite(maxLines) || lines.length <= maxLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, maxLines);
  const lastIndex = visibleLines.length - 1;
  visibleLines[lastIndex] = fitTextToWidth(`${visibleLines[lastIndex]}${ELLIPSIS}`, maxWidth);
  return visibleLines;
}

function fitTextToWidth(text, maxWidth) {
  if (measureTextWidth(text) <= maxWidth) {
    return text;
  }

  let fitted = "";
  Array.from(text.replace(new RegExp(`${escapeRegExp(ELLIPSIS)}$`), "")).forEach((character) => {
    const next = `${fitted}${character}${ELLIPSIS}`;
    if (measureTextWidth(next) <= maxWidth) {
      fitted += character;
    }
  });

  return fitted ? `${fitted}${ELLIPSIS}` : ELLIPSIS;
}

function measureTextWidth(text) {
  return Array.from(text).reduce((width, character) => width + getCharacterWidth(character), 0);
}

function getCharacterWidth(character) {
  if (character === " ") {
    return 3.5;
  }

  if (isFullWidthCharacter(character)) {
    return 12;
  }

  if (/[A-Z0-9]/.test(character)) {
    return 7.2;
  }

  if (/[a-z]/.test(character)) {
    return 6.2;
  }

  return 5.8;
}

function isFullWidthCharacter(character) {
  return /[\u1100-\u115f\u2329\u232a\u2e80-\u303e\u3040-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/.test(character);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSafeSvgIdPart(value) {
  return String(value ?? "item").replace(/[^a-zA-Z0-9_-]/g, "_");
}
