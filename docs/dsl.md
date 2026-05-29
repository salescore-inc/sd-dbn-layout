# Layout DSL

The layout DSL is a Mermaid-like notation for authoring or overriding an SD-DBN graph view.

It does not redefine SD-DBN. It provides a compact way to describe nodes, relations, projection states, and renderer hints.

## Design Rules

| Rule | Meaning |
|---|---|
| Domain independent | Node kinds and relation semantics stay independent from sales or any other domain. |
| Renderer oriented | Visual state, grouping, and edge style are renderer inputs. |
| JSON compatible | Every DSL document can be compiled into a JSON graph model. |
| Deterministic layout | The same input should produce the same visual arrangement. |

## First Syntax Draft

```sdbnl
sddbn "document-id" {
  view projection

  situation S1 "Situation label" {
    state agreed
  }

  latent X1 role=state subkind=need "Latent label" {
    domain absent present
    desired absent
    undesired present
    posterior present=0.90 absent=0.10
    state agreed
  }

  observation O1 "Observation label" {
    state mentioned
  }

  S1 --> X1 : CONDITIONS
  X1 -.-> O1 : MANIFESTS_AS
}
```

## Projection States

These states are layout projection states, not SD-DBN format-level evidence states.

| State | Display Meaning |
|---|---|
| `agreed` | Strongly lit by consensus or projection. |
| `mentioned` | Mentioned or weakly lit. |
| `rejected` | Rejected, contradicted, or visually crossed. |
| `none` | Not lit in the current view. |

## Edge Operators

| Operator | Visual Style |
|---|---|
| `-->` | Solid support or causal relation. |
| `-.->` | Dotted manifestation, evidence, or weak relation. |
| `-/->` | Attack, rejection, or overridden relation. |

## Compilation Target

The parser should compile the DSL into a graph model shaped like:

```ts
interface LayoutDocument {
  id: string;
  view: "schema" | "projection";
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}
```
