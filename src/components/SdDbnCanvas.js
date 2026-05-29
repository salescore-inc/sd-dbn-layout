import { layoutCanvas } from "../layout/engine.js";
import { createSvgRenderer } from "../renderer/svgRenderer.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WHEEL_PINCH_ZOOM_SPEED = 0.0032;
const DEFAULT_VIEWPORT_PADDING = 56;
const DEFAULT_FOCUS_PADDING = 96;
const DEFAULT_MIN_SCALE = 0.28;
const DEFAULT_MAX_SCALE = 2.6;
const DEFAULT_FIT_MAX_SCALE = 1.25;
const DEFAULT_FOCUS_MAX_SCALE = 1.8;
const DEFAULT_VIEWPORT_ANIMATION_DURATION = 420;
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 128;
const MINIMAP_PADDING = 10;

export class SdDbnCanvasElement extends HTMLElement {
  static get observedAttributes() {
    return ["minimap"];
  }

  constructor() {
    super();
    this.canvasModel = null;
    this.layout = null;
    this.renderer = null;
    this.rootElement = null;
    this.graphElement = null;
    this.minimapElement = null;
    this.transform = { x: 24, y: 24, scale: 1 };
    this.activePointers = new Map();
    this.pinchStart = null;
    this.resizeObserver = null;
    this.viewportAnimationFrame = null;
    this.focusedItemIds = new Set();
    this.highlightedItemIds = new Set();
    this.minimapVisible = true;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  connectedCallback() {
    this.classList.add("sd-dbn-canvas");
    this.rootElement = document.createElement("div");
    this.rootElement.className = "sd-dbn-canvas__surface";

    this.graphElement = document.createElement("div");
    this.graphElement.className = "sd-dbn-canvas__graph";

    this.minimapElement = document.createElement("div");
    this.minimapElement.className = "sd-dbn-canvas__minimap";

    this.rootElement.replaceChildren(this.graphElement, this.minimapElement);
    this.replaceChildren(this.rootElement);
    this.syncMinimapVisibility();

    this.resizeObserver = new ResizeObserver(() => this.fitViewport({ animate: false }));
    this.resizeObserver.observe(this);

    if (this.canvasModel) {
      this.renderCanvas();
    }
  }

  disconnectedCallback() {
    this.detachRendererEvents();
    this.cancelViewportAnimation();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  attributeChangedCallback(name) {
    if (name === "minimap") {
      this.minimapVisible = this.getAttribute("minimap") !== "false";
      this.syncMinimapVisibility();
      this.updateMinimap();
    }
  }

  set canvas(value) {
    this.setCanvas(value);
  }

  get canvas() {
    return this.canvasModel;
  }

  setCanvas(value) {
    this.canvasModel = value;

    if (this.isConnected && this.rootElement) {
      this.renderCanvas();
    }
  }

  getLayout() {
    return this.layout;
  }

  get minimap() {
    return this.minimapVisible;
  }

  set minimap(value) {
    this.setMinimapVisible(Boolean(value));
  }

  fitViewport(options = {}) {
    if (!this.renderer || !this.layout) {
      return false;
    }

    return this.fitBounds(this.layout.bounds, {
      padding: DEFAULT_VIEWPORT_PADDING,
      maxScale: DEFAULT_FIT_MAX_SCALE,
      ...options,
    });
  }

  optimizeViewport(options = {}) {
    return this.fitViewport(options);
  }

  focusNode(nodeId, options = {}) {
    return this.focusItem(nodeId, { kind: "node", ...options });
  }

  focusGroup(groupId, options = {}) {
    return this.focusItem(groupId, { kind: "group", ...options });
  }

  focusItem(itemId, options = {}) {
    if (!this.layout) {
      return false;
    }

    const item = this.findLayoutItem(itemId, options.kind);
    if (!item) {
      return false;
    }

    if (options.focus !== false) {
      this.setFocusedItems([itemId]);
    }

    if (options.highlight === true) {
      this.setHighlightedItems([itemId]);
    }

    return this.fitBounds(item, {
      padding: DEFAULT_FOCUS_PADDING,
      maxScale: DEFAULT_FOCUS_MAX_SCALE,
      ...options,
    });
  }

  getViewport() {
    return { ...this.transform };
  }

  highlightNode(nodeId) {
    return this.highlightItem(nodeId, { kind: "node" });
  }

  highlightGroup(groupId) {
    return this.highlightItem(groupId, { kind: "group" });
  }

  highlightItem(itemId, options = {}) {
    if (!this.layout || !this.findLayoutItem(itemId, options.kind)) {
      return false;
    }

    if (options.mode === "add") {
      this.setHighlightedItems([...this.highlightedItemIds, itemId]);
    } else {
      this.setHighlightedItems([itemId]);
    }
    return true;
  }

  clearHighlight() {
    this.setHighlightedItems([]);
    return true;
  }

  clearFocus() {
    this.setFocusedItems([]);
    return true;
  }

  clearVisualState() {
    this.setFocusedItems([]);
    this.setHighlightedItems([]);
    return true;
  }

  setViewport(transform, options = {}) {
    if (!this.renderer) {
      return false;
    }

    const nextTransform = {
      x: transform.x ?? this.transform.x,
      y: transform.y ?? this.transform.y,
      scale: clamp(transform.scale ?? this.transform.scale, DEFAULT_MIN_SCALE, DEFAULT_MAX_SCALE),
    };
    this.applyViewport(nextTransform, options);
    return true;
  }

  resetViewport(options = {}) {
    if (!this.renderer) {
      return false;
    }

    this.applyViewport({ x: 24, y: 24, scale: 1 }, options);
    return true;
  }

  showMinimap() {
    return this.setMinimapVisible(true);
  }

  hideMinimap() {
    return this.setMinimapVisible(false);
  }

  setMinimapVisible(isVisible) {
    this.minimapVisible = Boolean(isVisible);
    if (this.minimapVisible) {
      this.setAttribute("minimap", "true");
    } else {
      this.setAttribute("minimap", "false");
    }
    this.syncMinimapVisibility();
    this.updateMinimap();
    return true;
  }

  renderCanvas() {
    this.detachRendererEvents();
    this.activePointers.clear();
    this.pinchStart = null;
    this.layout = layoutCanvas(this.canvasModel);
    this.renderer = createSvgRenderer(this.graphElement, this.layout);
    this.attachRendererEvents();
    this.renderer.draw(this.transform);
    this.syncVisualState();
    this.fitViewport({ animate: false });
  }

  findLayoutItem(itemId, kind) {
    const items = kind === "node"
      ? this.layout.nodes
      : kind === "group"
        ? this.layout.groups
        : [...this.layout.nodes, ...this.layout.groups];

    return items.find((item) => item.id === itemId) ?? null;
  }

  fitBounds(bounds, options = {}) {
    if (!this.renderer) {
      return false;
    }

    const rect = this.renderer.svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || bounds.width === 0 || bounds.height === 0) {
      return false;
    }

    const padding = options.padding ?? DEFAULT_VIEWPORT_PADDING;
    const minScale = options.minScale ?? DEFAULT_MIN_SCALE;
    const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;
    const availableWidth = Math.max(1, rect.width - padding * 2);
    const availableHeight = Math.max(1, rect.height - padding * 2);
    const scale = Math.min(
      availableWidth / bounds.width,
      availableHeight / bounds.height,
      maxScale,
    );
    const nextScale = clamp(scale, minScale, maxScale);

    const nextTransform = {
      scale: nextScale,
      x: (rect.width - bounds.width * nextScale) / 2 - bounds.x * nextScale,
      y: (rect.height - bounds.height * nextScale) / 2 - bounds.y * nextScale,
    };
    this.applyViewport(nextTransform, options);
    return true;
  }

  setFocusedItems(itemIds) {
    this.focusedItemIds = new Set(itemIds);
    this.syncVisualState();
  }

  setHighlightedItems(itemIds) {
    this.highlightedItemIds = new Set(itemIds);
    this.syncVisualState();
  }

  syncVisualState() {
    this.renderer?.setVisualState({
      focusIds: [...this.focusedItemIds],
      highlightIds: [...this.highlightedItemIds],
    });
  }

  syncMinimapVisibility() {
    this.minimapElement?.classList.toggle("is-hidden", !this.minimapVisible);
  }

  updateMinimap() {
    if (!this.minimapElement || !this.layout || !this.renderer || !this.minimapVisible) {
      return;
    }

    const viewportRect = this.renderer.svg.getBoundingClientRect();
    if (viewportRect.width === 0 || viewportRect.height === 0) {
      return;
    }

    this.minimapElement.replaceChildren(createMinimapSvg({
      layout: this.layout,
      transform: this.transform,
      viewportSize: {
        width: viewportRect.width,
        height: viewportRect.height,
      },
    }));
  }

  applyViewport(nextTransform, options = {}) {
    if (options.animate === false || options.duration === 0) {
      this.cancelViewportAnimation();
      this.transform = nextTransform;
      this.renderer.draw(this.transform);
      this.updateMinimap();
      return;
    }

    this.animateViewport(nextTransform, {
      duration: options.duration ?? DEFAULT_VIEWPORT_ANIMATION_DURATION,
    });
  }

  animateViewport(nextTransform, options) {
    this.cancelViewportAnimation();

    const startTransform = { ...this.transform };
    const startedAt = performance.now();
    const duration = Math.max(1, options.duration);

    const tick = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = easeOutCubic(progress);

      this.transform = {
        x: lerp(startTransform.x, nextTransform.x, eased),
        y: lerp(startTransform.y, nextTransform.y, eased),
        scale: lerp(startTransform.scale, nextTransform.scale, eased),
      };
      this.renderer.draw(this.transform);
      this.updateMinimap();

      if (progress < 1) {
        this.viewportAnimationFrame = requestAnimationFrame(tick);
        return;
      }

      this.transform = nextTransform;
      this.renderer.draw(this.transform);
      this.updateMinimap();
      this.viewportAnimationFrame = null;
    };

    this.viewportAnimationFrame = requestAnimationFrame(tick);
  }

  cancelViewportAnimation() {
    if (this.viewportAnimationFrame !== null) {
      cancelAnimationFrame(this.viewportAnimationFrame);
      this.viewportAnimationFrame = null;
    }
  }

  attachRendererEvents() {
    this.renderer.svg.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.svg.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.svg.addEventListener("pointerup", this.handlePointerUp);
    this.renderer.svg.addEventListener("pointercancel", this.handlePointerUp);
    this.renderer.svg.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  detachRendererEvents() {
    if (!this.renderer?.svg) {
      return;
    }

    this.renderer.svg.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.svg.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.svg.removeEventListener("pointerup", this.handlePointerUp);
    this.renderer.svg.removeEventListener("pointercancel", this.handlePointerUp);
    this.renderer.svg.removeEventListener("wheel", this.handleWheel);
  }

  handlePointerDown(event) {
    this.cancelViewportAnimation();
    this.renderer.svg.setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (this.activePointers.size === 2) {
      this.pinchStart = this.createPinchState();
    }
  }

  handlePointerMove(event) {
    if (!this.activePointers.has(event.pointerId)) {
      return;
    }

    this.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (this.activePointers.size !== 2 || !this.pinchStart) {
      return;
    }

    const current = this.getPinchGeometry();
    const nextScale = clamp(
      this.pinchStart.transform.scale * (current.distance / this.pinchStart.distance),
      0.28,
      2.6,
    );

    this.transform = {
      scale: nextScale,
      x: current.center.x - this.pinchStart.world.x * nextScale,
      y: current.center.y - this.pinchStart.world.y * nextScale,
    };
    this.renderer.draw(this.transform);
    this.updateMinimap();
  }

  handlePointerUp(event) {
    this.activePointers.delete(event.pointerId);

    if (this.activePointers.size === 2) {
      this.pinchStart = this.createPinchState();
    } else {
      this.pinchStart = null;
    }
  }

  handleWheel(event) {
    event.preventDefault();
    this.cancelViewportAnimation();

    if (!event.ctrlKey) {
      const delta = normalizeWheelDelta(event);
      this.transform = {
        ...this.transform,
        x: this.transform.x - delta.x,
        y: this.transform.y - delta.y,
      };
      this.renderer.draw(this.transform);
      this.updateMinimap();
      return;
    }

    const rect = this.renderer.svg.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const nextScale = clamp(
      this.transform.scale * Math.exp(-event.deltaY * WHEEL_PINCH_ZOOM_SPEED),
      0.28,
      2.6,
    );
    const world = {
      x: (pointer.x - this.transform.x) / this.transform.scale,
      y: (pointer.y - this.transform.y) / this.transform.scale,
    };

    this.transform = {
      x: pointer.x - world.x * nextScale,
      y: pointer.y - world.y * nextScale,
      scale: nextScale,
    };
    this.renderer.draw(this.transform);
    this.updateMinimap();
  }

  createPinchState() {
    const geometry = this.getPinchGeometry();

    return {
      ...geometry,
      transform: { ...this.transform },
      world: {
        x: (geometry.center.x - this.transform.x) / this.transform.scale,
        y: (geometry.center.y - this.transform.y) / this.transform.scale,
      },
    };
  }

  getPinchGeometry() {
    const [first, second] = [...this.activePointers.values()];
    const dx = second.x - first.x;
    const dy = second.y - first.y;

    return {
      distance: Math.max(1, Math.hypot(dx, dy)),
      center: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
    };
  }
}

export function defineSdDbnCanvasElement() {
  if (!customElements.get("sd-dbn-canvas")) {
    customElements.define("sd-dbn-canvas", SdDbnCanvasElement);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function createMinimapSvg({ layout, transform, viewportSize }) {
  const svg = createSvgElement("svg", {
    class: "minimap-svg",
    viewBox: `0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`,
    role: "img",
    "aria-label": "Graph minimap",
  });
  const bounds = layout.bounds;
  const innerWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
  const innerHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;
  const scale = Math.min(innerWidth / bounds.width, innerHeight / bounds.height);
  const mapWidth = bounds.width * scale;
  const mapHeight = bounds.height * scale;
  const origin = {
    x: (MINIMAP_WIDTH - mapWidth) / 2 - bounds.x * scale,
    y: (MINIMAP_HEIGHT - mapHeight) / 2 - bounds.y * scale,
  };

  const content = createSvgElement("g", { class: "minimap-content" });
  svg.appendChild(createSvgElement("rect", {
    class: "minimap-bg",
    x: 0,
    y: 0,
    width: MINIMAP_WIDTH,
    height: MINIMAP_HEIGHT,
    rx: 8,
  }));

  layout.groups
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .forEach((group) => {
      content.appendChild(createSvgElement("rect", {
        class: "minimap-group",
        x: origin.x + group.x * scale,
        y: origin.y + group.y * scale,
        width: Math.max(1, group.width * scale),
        height: Math.max(1, group.height * scale),
        rx: 2,
      }));
    });

  layout.edges.forEach((edge) => {
    content.appendChild(createSvgElement("polyline", {
      class: "minimap-edge",
      points: edge.points
        .map((point) => `${origin.x + point.x * scale},${origin.y + point.y * scale}`)
        .join(" "),
    }));
  });

  layout.nodes.forEach((node) => {
    content.appendChild(createSvgElement("rect", {
      class: "minimap-node",
      x: origin.x + node.x * scale,
      y: origin.y + node.y * scale,
      width: Math.max(2, node.width * scale),
      height: Math.max(2, node.height * scale),
      rx: 1.5,
    }));
  });

  svg.appendChild(content);
  svg.appendChild(createSvgElement("rect", createViewportRectAttributes({
    origin,
    scale,
    transform,
    viewportSize,
  })));
  return svg;
}

function createViewportRectAttributes({ origin, scale, transform, viewportSize }) {
  const worldViewport = {
    x: -transform.x / transform.scale,
    y: -transform.y / transform.scale,
    width: viewportSize.width / transform.scale,
    height: viewportSize.height / transform.scale,
  };

  return {
    class: "minimap-viewport",
    x: origin.x + worldViewport.x * scale,
    y: origin.y + worldViewport.y * scale,
    width: Math.max(4, worldViewport.width * scale),
    height: Math.max(4, worldViewport.height * scale),
    rx: 2,
  };
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function normalizeWheelDelta(event) {
  const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;

  return {
    x: event.deltaX * multiplier,
    y: event.deltaY * multiplier,
  };
}
