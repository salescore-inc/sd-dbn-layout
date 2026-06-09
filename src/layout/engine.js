const DEFAULT_MARGIN = {
  nodeNode: { x: 108, y: 56 },
  groupGroup: { x: 88, y: 66 },
  groupNode: { x: 46, y: 34 },
};

const COST_WEIGHT = {
  area: 1,
  aspect: 120,
  edgeLength: 0.18,
  margin: 0.08,
};

const EDGE_ROUTE_WEIGHT = {
  length: 1,
  bend: 34,
  nodeOverlap: 1600,
  portDirection: 260,
};

const DEFAULT_NODE_SIZE = { width: 204, height: 82 };
const DEFAULT_NODE_EDGE_JOINT = { minLength: 28 };
const EDGE_LABEL_POSITION = 0.4;
const GROUP_HEADER_HEIGHT = 34;
const GROUP_PADDING = 18;
const EDGE_OBSTACLE_PADDING = 12;
const EDGE_ROUTE_THICKNESS = 10;

export function layoutCanvas(canvas) {
  const margins = { ...DEFAULT_MARGIN, ...(canvas.margins ?? {}) };
  const nodeSize = { ...DEFAULT_NODE_SIZE, ...(canvas.nodeSize ?? {}) };
  const nodeEdgeJoint = { ...DEFAULT_NODE_EDGE_JOINT, ...(canvas.nodeEdgeJoint ?? {}) };
  const root = createContainerItem(canvas, "canvas", margins, canvas.edges ?? [], nodeSize);
  const positioned = positionAbsolute(root, 28, 28);
  const registry = buildRegistry(positioned);
  const edges = routeEdges(canvas.edges ?? [], registry, nodeEdgeJoint);
  const bounds = getBounds([...registry.values()]);

  return {
    id: canvas.id,
    label: canvas.label,
    width: bounds.width + 56,
    height: bounds.height + 56,
    nodes: [...registry.values()].filter((item) => item.type === "node"),
    groups: [...registry.values()].filter((item) => item.type === "group"),
    edges,
    bounds: {
      x: bounds.x - 28,
      y: bounds.y - 28,
      width: bounds.width + 56,
      height: bounds.height + 56,
    },
  };
}

function createContainerItem(container, type, margins, edges, nodeSize) {
  const children = [
    ...(container.groups ?? []).map((group) => createContainerItem(group, "group", margins, edges, nodeSize)),
    ...(container.nodes ?? []).map((node) => createNodeItem(node, nodeSize)),
  ];
  const direction = chooseDirection(container.direction ?? "auto", children, margins, edges);
  const arranged = arrangeChildren(children, direction, margins, edges);

  if (type === "canvas") {
    return {
      id: container.id,
      type,
      label: container.label,
      x: 0,
      y: 0,
      width: arranged.width,
      height: arranged.height,
      children: arranged.children,
    };
  }

  return {
    id: container.id,
    type,
    label: container.label,
    x: 0,
    y: 0,
    width: arranged.width + GROUP_PADDING * 2,
    height: arranged.height + GROUP_HEADER_HEIGHT + GROUP_PADDING,
    children: arranged.children.map((child) => ({
      ...child,
      x: child.x + GROUP_PADDING,
      y: child.y + GROUP_HEADER_HEIGHT,
    })),
  };
}

function createNodeItem(node, nodeSize) {
  return {
    id: node.id,
    type: "node",
    label: node.label,
    meta: node.meta,
    state: node.state,
    posterior: node.posterior,
    value: node.value,
    sdDbn: node.sdDbn,
    x: 0,
    y: 0,
    width: nodeSize.width,
    height: nodeSize.height,
    children: [],
  };
}

function chooseDirection(direction, children, margins, edges) {
  if (direction === "vstack" || direction === "hstack") {
    return direction;
  }

  const vertical = arrangeChildren(children, "vstack", margins, edges);
  const horizontal = arrangeChildren(children, "hstack", margins, edges);

  return scoreArrangement(vertical, edges) <= scoreArrangement(horizontal, edges) ? "vstack" : "hstack";
}

function arrangeChildren(children, direction, margins, edges) {
  if (children.length === 0) {
    return { width: 0, height: 0, children: [] };
  }

  let cursor = 0;
  let crossSize = 0;
  const placed = [];

  children.forEach((child, index) => {
    const previous = placed[index - 1];
    const margin = previous ? resolveMargin(previous, child, direction, margins, edges) : { x: 0, y: 0 };
    cursor += direction === "hstack" ? margin.x : margin.y;

    const placedChild = {
      ...child,
      x: direction === "hstack" ? cursor : 0,
      y: direction === "vstack" ? cursor : 0,
    };

    placed.push(placedChild);
    cursor += direction === "hstack" ? child.width : child.height;
    crossSize = Math.max(crossSize, direction === "hstack" ? child.height : child.width);
  });

  const normalized = placed.map((child) => {
    if (direction === "hstack") {
      return { ...child, y: Math.round((crossSize - child.height) / 2) };
    }

    return { ...child, x: Math.round((crossSize - child.width) / 2) };
  });

  return {
    width: direction === "hstack" ? cursor : crossSize,
    height: direction === "vstack" ? cursor : crossSize,
    children: normalized,
  };
}

function resolveMargin(left, right, direction, margins, edges) {
  const key = getMarginKey(left, right);
  const base = margins[key] ?? DEFAULT_MARGIN[key];
  const pressure = countEdgePressure(left, right, edges);
  const extra = Math.min(28, pressure * 7);

  return {
    x: direction === "hstack" ? base.x + extra : base.x,
    y: direction === "vstack" ? base.y + extra : base.y,
  };
}

function getMarginKey(a, b) {
  if (a.type === "node" && b.type === "node") {
    return "nodeNode";
  }

  if (a.type === "group" && b.type === "group") {
    return "groupGroup";
  }

  return "groupNode";
}

function countEdgePressure(a, b, edges) {
  const aIds = collectIds(a);
  const bIds = collectIds(b);

  return edges.filter((edge) => {
    const forward = aIds.has(edge.from) && bIds.has(edge.to);
    const backward = aIds.has(edge.to) && bIds.has(edge.from);
    return forward || backward;
  }).length;
}

function collectIds(item, ids = new Set()) {
  ids.add(item.id);
  item.children?.forEach((child) => collectIds(child, ids));
  return ids;
}

function scoreArrangement(arrangement, edges) {
  const area = arrangement.width * arrangement.height;
  const aspect = Math.abs(Math.log((arrangement.width || 1) / (arrangement.height || 1)));
  const edgeLength = estimateEdgeLength(arrangement.children, edges);
  const margin = arrangement.children.length * 10;

  return (
    area * COST_WEIGHT.area +
    aspect * COST_WEIGHT.aspect +
    edgeLength * COST_WEIGHT.edgeLength +
    margin * COST_WEIGHT.margin
  );
}

function estimateEdgeLength(children, edges) {
  const centers = new Map();

  children.forEach((child) => {
    collectIds(child).forEach((id) => {
      centers.set(id, {
        x: child.x + child.width / 2,
        y: child.y + child.height / 2,
      });
    });
  });

  return edges.reduce((total, edge) => {
    const from = centers.get(edge.from);
    const to = centers.get(edge.to);
    if (!from || !to) {
      return total;
    }

    return total + Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }, 0);
}

function positionAbsolute(item, offsetX, offsetY) {
  const absolute = {
    ...item,
    x: item.x + offsetX,
    y: item.y + offsetY,
  };

  absolute.children = item.children?.map((child) =>
    positionAbsolute(child, absolute.x, absolute.y),
  ) ?? [];

  return absolute;
}

function buildRegistry(root) {
  const registry = new Map();

  function visit(item) {
    if (item.type !== "canvas") {
      registry.set(item.id, item);
    }

    item.children?.forEach(visit);
  }

  visit(root);
  return registry;
}

function routeEdges(edges, registry, nodeEdgeJoint) {
  const nodeObstacles = [...registry.values()]
    .filter((item) => item.type === "node")
    .map((node) => expandBox(node, EDGE_OBSTACLE_PADDING));

  return edges
    .map((edge) => {
      const from = registry.get(edge.from);
      const to = registry.get(edge.to);

      if (!from || !to) {
        return null;
      }

      const ignoredIds = new Set([...collectIds(from), ...collectIds(to)]);
      const obstacles = nodeObstacles.filter((obstacle) => !ignoredIds.has(obstacle.id));
      const points = createBestOrthogonalPath(from, to, obstacles, nodeEdgeJoint.minLength);

      return {
        ...edge,
        points,
        labelPoint: getPathPointAt(points, EDGE_LABEL_POSITION),
      };
    })
    .filter(Boolean);
}

function createBestOrthogonalPath(from, to, obstacles, jointLength) {
  const routes = [];
  const fromPorts = getConnectionPorts(from);
  const toPorts = getConnectionPorts(to);

  fromPorts.forEach((start) => {
    toPorts.forEach((end) => {
      createOrthogonalRouteCandidates(start, end, obstacles, jointLength)
        .forEach((points) => {
          routes.push({
            points,
            score: scoreEdgeRoute(points, start, end, obstacles),
          });
        });
    });
  });

  routes.sort((a, b) => a.score - b.score);
  return routes[0]?.points ?? [getCenter(from), getCenter(to)];
}

function getConnectionPorts(item) {
  const center = getCenter(item);

  return [
    { x: center.x, y: item.y, side: "top", normal: { x: 0, y: -1 } },
    { x: item.x + item.width, y: center.y, side: "right", normal: { x: 1, y: 0 } },
    { x: center.x, y: item.y + item.height, side: "bottom", normal: { x: 0, y: 1 } },
    { x: item.x, y: center.y, side: "left", normal: { x: -1, y: 0 } },
  ];
}

function createOrthogonalRouteCandidates(start, end, obstacles, jointLength) {
  const routes = [];
  const startJoint = extendPort(start, jointLength);
  const endJoint = extendPort(end, jointLength);
  const midX = Math.round((startJoint.x + endJoint.x) / 2);
  const midY = Math.round((startJoint.y + endJoint.y) / 2);
  const xCorridors = uniqueNumbers([
    midX,
    startJoint.x,
    endJoint.x,
    ...obstacles.flatMap((obstacle) => [
      obstacle.x - EDGE_ROUTE_THICKNESS,
      obstacle.x + obstacle.width + EDGE_ROUTE_THICKNESS,
    ]),
  ]);
  const yCorridors = uniqueNumbers([
    midY,
    startJoint.y,
    endJoint.y,
    ...obstacles.flatMap((obstacle) => [
      obstacle.y - EDGE_ROUTE_THICKNESS,
      obstacle.y + obstacle.height + EDGE_ROUTE_THICKNESS,
    ]),
  ]);

  xCorridors.forEach((x) => {
    routes.push(normalizePath([
      start,
      startJoint,
      { x, y: startJoint.y },
      { x, y: endJoint.y },
      endJoint,
      end,
    ]));
  });

  yCorridors.forEach((y) => {
    routes.push(normalizePath([
      start,
      startJoint,
      { x: startJoint.x, y },
      { x: endJoint.x, y },
      endJoint,
      end,
    ]));
  });

  return dedupeRoutes(routes).filter((route) => !hasReverseTurn(route));
}

function extendPort(port, length) {
  return {
    x: port.x + port.normal.x * length,
    y: port.y + port.normal.y * length,
  };
}

function scoreEdgeRoute(points, start, end, obstacles) {
  return (
    getPathLength(points) * EDGE_ROUTE_WEIGHT.length +
    getBendCount(points) * EDGE_ROUTE_WEIGHT.bend +
    getNodeOverlapArea(points, obstacles) * EDGE_ROUTE_WEIGHT.nodeOverlap +
    getPortDirectionPenalty(points, start, end) * EDGE_ROUTE_WEIGHT.portDirection
  );
}

function getNodeOverlapArea(points, obstacles) {
  return getPathSegments(points).reduce((total, segment) => {
    const corridor = segmentToBox(segment, EDGE_ROUTE_THICKNESS);
    const overlap = obstacles.reduce((sum, obstacle) => sum + getOverlapArea(corridor, obstacle), 0);
    return total + overlap;
  }, 0);
}

function getPathSegments(points) {
  return points.slice(0, -1).map((from, index) => ({
    from,
    to: points[index + 1],
  }));
}

function segmentToBox(segment, thickness) {
  const half = thickness / 2;

  if (segment.from.y === segment.to.y) {
    return {
      x: Math.min(segment.from.x, segment.to.x),
      y: segment.from.y - half,
      width: Math.abs(segment.to.x - segment.from.x),
      height: thickness,
    };
  }

  return {
    x: segment.from.x - half,
    y: Math.min(segment.from.y, segment.to.y),
    width: thickness,
    height: Math.abs(segment.to.y - segment.from.y),
  };
}

function getOverlapArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function getPathLength(points) {
  return getPathSegments(points).reduce((total, segment) => (
    total + Math.abs(segment.to.x - segment.from.x) + Math.abs(segment.to.y - segment.from.y)
  ), 0);
}

function getBendCount(points) {
  let bends = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const firstHorizontal = previous.y === current.y;
    const secondHorizontal = current.y === next.y;

    if (firstHorizontal !== secondHorizontal) {
      bends += 1;
    }
  }

  return bends;
}

function getPortDirectionPenalty(points, start, end) {
  const first = points[1] ?? start;
  const previous = points[points.length - 2] ?? end;

  return getOutboundPenalty(start, first) + getInboundPenalty(end, previous);
}

function getOutboundPenalty(port, next) {
  if (port.side === "left" && next.x > port.x) return 1;
  if (port.side === "right" && next.x < port.x) return 1;
  if (port.side === "top" && next.y > port.y) return 1;
  if (port.side === "bottom" && next.y < port.y) return 1;
  return 0;
}

function getInboundPenalty(port, previous) {
  if (port.side === "left" && previous.x > port.x) return 1;
  if (port.side === "right" && previous.x < port.x) return 1;
  if (port.side === "top" && previous.y > port.y) return 1;
  if (port.side === "bottom" && previous.y < port.y) return 1;
  return 0;
}

function expandBox(box, padding) {
  return {
    id: box.id,
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

function uniqueNumbers(values) {
  return [...new Set(values.map((value) => Math.round(value)))];
}

function normalizePath(points) {
  const withoutDuplicates = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });

  return withoutDuplicates.reduce((normalized, point) => {
    const previous = normalized.at(-1);
    const beforePrevious = normalized.at(-2);

    if (beforePrevious && previous && areCollinear(beforePrevious, previous, point)) {
      normalized[normalized.length - 1] = point;
      return normalized;
    }

    normalized.push(point);
    return normalized;
  }, []);
}

function areCollinear(a, b, c) {
  return (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
}

function hasReverseTurn(points) {
  for (let index = 1; index < points.length - 1; index += 1) {
    const incoming = getDirection(points[index - 1], points[index]);
    const outgoing = getDirection(points[index], points[index + 1]);

    if (incoming.x + outgoing.x === 0 && incoming.y + outgoing.y === 0) {
      return true;
    }
  }

  return false;
}

function getDirection(from, to) {
  return {
    x: Math.sign(to.x - from.x),
    y: Math.sign(to.y - from.y),
  };
}

function dedupeRoutes(routes) {
  const seen = new Set();

  return routes.filter((route) => {
    const key = route.map((point) => `${point.x},${point.y}`).join("|");
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getPathPointAt(points, ratio) {
  const targetLength = getPathLength(points) * ratio;
  let traveled = 0;

  for (const segment of getPathSegments(points)) {
    const segmentLength = Math.abs(segment.to.x - segment.from.x) + Math.abs(segment.to.y - segment.from.y);
    const nextTraveled = traveled + segmentLength;

    if (targetLength <= nextTraveled) {
      const offset = targetLength - traveled;
      const direction = {
        x: Math.sign(segment.to.x - segment.from.x),
        y: Math.sign(segment.to.y - segment.from.y),
      };

      return {
        x: Math.round(segment.from.x + direction.x * offset),
        y: Math.round(segment.from.y + direction.y * offset),
      };
    }

    traveled = nextTraveled;
  }

  return points.at(-1) ?? { x: 0, y: 0 };
}

function getCenter(item) {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
  };
}

function getBounds(items) {
  const minX = Math.min(...items.map((item) => item.x));
  const minY = Math.min(...items.map((item) => item.y));
  const maxX = Math.max(...items.map((item) => item.x + item.width));
  const maxY = Math.max(...items.map((item) => item.y + item.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
