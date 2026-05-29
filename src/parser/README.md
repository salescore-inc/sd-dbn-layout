# Parser

Parsers turn SD-DBN JSON or `.sdbnl` text into the renderer-independent graph model.

The parser must not make layout decisions.

## SD-DBN Format Adapter

`sdDbnAdapter.js` maps SD-DBN Format documents into the canvas model:

| SD-DBN field | Canvas field |
|---|---|
| `schema.variables[].id` | `node.id` |
| `schema.variables[].text` | `node.label` |
| `schema.variables[].kind` + latent `role` | semantic groups |
| latest event for `variable` | `node.state`, `node.posterior`, `node.value` |
| `schema.relations[].id` | `edge.id` |
| `schema.relations[].from/to` | `edge.from/to` |
| `schema.relations[].scheme` | `edge.label` |
| latest `argued.relation_id` event | `edge.state` |
