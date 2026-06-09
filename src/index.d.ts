export type SdDbnLayoutDirection = "auto" | "hstack" | "vstack";
export type SdDbnEvidenceState = "agreed" | "mentioned" | "rejected" | "none";

export interface SdDbnCanvasNode {
  id: string;
  label: string;
  meta?: string;
  state?: SdDbnEvidenceState;
  posterior?: Record<string, number>;
  value?: unknown;
  sdDbn?: Record<string, unknown>;
}

export interface SdDbnCanvasEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  state?: SdDbnEvidenceState;
  sdDbn?: Record<string, unknown>;
}

export interface SdDbnCanvasGroup {
  id: string;
  label: string;
  direction?: SdDbnLayoutDirection;
  groups?: SdDbnCanvasGroup[];
  nodes?: SdDbnCanvasNode[];
}

export interface SdDbnCanvasModel {
  id: string;
  label?: string;
  direction?: SdDbnLayoutDirection;
  nodeSize?: {
    width?: number;
    height?: number;
  };
  nodeEdgeJoint?: {
    minLength?: number;
  };
  margins?: {
    nodeNode?: {
      x?: number;
      y?: number;
    };
    groupGroup?: {
      x?: number;
      y?: number;
    };
    groupNode?: {
      x?: number;
      y?: number;
    };
  };
  groups?: SdDbnCanvasGroup[];
  nodes?: SdDbnCanvasNode[];
  edges?: SdDbnCanvasEdge[];
}

export interface SdDbnDocument {
  "@type": "SD-DBN";
  version?: string;
  id: string;
  subject?: string;
  schema: {
    variables: unknown[];
    relations: unknown[];
  };
  events?: unknown[];
  [key: string]: unknown;
}

export interface SdDbnViewport {
  x: number;
  y: number;
  scale: number;
}

export interface SdDbnViewportOptions {
  animate?: boolean;
  duration?: number;
  padding?: number;
  minScale?: number;
  maxScale?: number;
}

export interface SdDbnFocusOptions extends SdDbnViewportOptions {
  focus?: boolean;
  highlight?: boolean;
}

export class SdDbnCanvasElement extends HTMLElement {
  canvas: SdDbnCanvasModel | null;
  minimap: boolean;

  setCanvas(value: SdDbnCanvasModel | null): void;
  getLayout(): unknown;
  optimizeViewport(options?: SdDbnViewportOptions): boolean;
  fitViewport(options?: SdDbnViewportOptions): boolean;
  focusNode(nodeId: string, options?: SdDbnFocusOptions): boolean;
  focusGroup(groupId: string, options?: SdDbnFocusOptions): boolean;
  focusItem(itemId: string, options?: SdDbnFocusOptions & { kind?: string }): boolean;
  highlightNode(nodeId: string): boolean;
  highlightGroup(groupId: string): boolean;
  highlightItem(itemId: string, options?: { kind?: string; mode?: "add" }): boolean;
  clearHighlight(): boolean;
  clearFocus(): boolean;
  clearVisualState(): boolean;
  showMinimap(): boolean;
  hideMinimap(): boolean;
  setMinimapVisible(isVisible: boolean): boolean;
  setViewport(transform: Partial<SdDbnViewport>, options?: SdDbnViewportOptions): boolean;
  resetViewport(options?: SdDbnViewportOptions): boolean;
  getViewport(): SdDbnViewport;
}

export function defineSdDbnCanvasElement(): void;
export function layoutCanvas(canvas: SdDbnCanvasModel): unknown;
export function sdDbnToCanvas(document: SdDbnDocument, options?: Partial<SdDbnCanvasModel>): SdDbnCanvasModel;
