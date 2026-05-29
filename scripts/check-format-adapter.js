import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sdDbnToCanvas } from "../src/parser/sdDbnAdapter.js";
import {
  formatSampleDocuments,
  minimalSdDbnDocument,
} from "../src/examples/formatSamples.js";

const fixturePath = new URL("../../sd-dbn-format/examples/valid/minimal.json", import.meta.url);
const formatFixture = JSON.parse(await readFile(fixturePath, "utf8"));

for (const document of [formatFixture, ...formatSampleDocuments]) {
  const canvas = sdDbnToCanvas(document);
  const variableIds = new Set(document.schema.variables.map((variable) => variable.id));
  const relationIds = new Set(document.schema.relations.map((relation) => relation.id));
  const nodes = collectNodes(canvas);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set(canvas.edges.map((edge) => edge.id));

  assert.equal(nodes.length, document.schema.variables.length);
  assert.deepEqual(nodeIds, variableIds);
  assert.deepEqual(edgeIds, relationIds);
  assert.equal(canvas.edges.every((edge) => variableIds.has(edge.from) && variableIds.has(edge.to)), true);
}

const projectionCanvas = sdDbnToCanvas(minimalSdDbnDocument);
const solutionNode = collectNodes(projectionCanvas).find((node) => node.id === "X_solution");
const arguedEdge = projectionCanvas.edges.find((edge) => edge.id === "r_solution_state");

assert.equal(solutionNode.state, "mentioned");
assert.deepEqual(solutionNode.posterior, { fit: 0.72, unfit: 0.28 });
assert.equal(arguedEdge.state, "rejected");

console.log("format adapter check passed");

function collectNodes(container) {
  return [
    ...(container.nodes ?? []),
    ...(container.groups ?? []).flatMap((group) => collectNodes(group)),
  ];
}
