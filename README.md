# ZX Online

ZX Online is a web platform for [ZX calculus](https://zxcalculus.com/) and quantum education. This is currently a prototype project, which consists of a ZX diagram editor based on the one from [TikZiT](https://github.com/tikzit/vstikzit), simplified and specialised from general purpose vector graphs to ZX diagrams. The first things to do are to finish adapting the graph editor UI and start implementing some basic ZX rewrites (e.g. yanking wires and spider fusion).

## Modes

ZX Online will run in one of two modes. The first is the **sandbox** mode, where users can create and share ZX diagrams and proofs. This is similar to it's twin desktop project [ZX Live](https://github.com/zxcalc/zxlive). However, it has a slightly different data structure from ZX Live (which relies on [PyZX](https://github.com/zxcalc/zxlive) graphs), allowing more freedom in the way users can draw and interact with diagrams. Rather than being plain graphs, ZX Online has the concept of a _wire_, which can be cut, plugged, bent, and pulled straight again. Making interaction with wires smooth and intuitive will require some new UI/UX ideas, but it should be a good challenge!

The second way ZX Online is intended to be used is as a framework for developing **interactive quantum education** materials. Users will be taken on a curated route through materials in the form of short lessons in the basics of quantum theory and quantum computation, interspersed with challenges they can complete and earn points for. Think "Duolingo for quantum" and you'll get the rough idea of what we are aiming for.

This will consist of developing a bunch of [Preact](https://preactjs.com/) components that make writing new materials straightforward with little or no coding experience. What I expect this will look like initially is essentially writing HTML with a few custom tags for setting up diagrams, challenges, an various other kinds of feedback.

## ZX diagram representation

ZX diagrams are represented using the [Graph](https://github.com/zxcalc/zxonline/blob/main/src/lib/Graph.ts) class. A graph consists of a collection of _nodes_ connected by _wires_, where a wire is a sequence of connected _edges_. This is what allows wires to bend into different shapes and do things that are not normally possible in a graph, such as connect back to themselves to form a circle.

All nodes have a type, which is called the node _style_. Initially, styles are "none", "z", and "x", but all code should be written to account for the fact that we may want more styles in the future. We will certainly at least want Hadamards, but I'm not sure yet whether we should have these as node styles, edge styles, or both.

All nodes in a wire except the endpoints (i.e. the source of the first edge and target of the last edge) must have style "none". There is no semantic meaning to the number of edges in a wire. It is purely for visualisation and making certain operations like plugging, cutting, and yanking wires possible and/or more visually intuitive.

One consequence of this is that when we check whether a ZX rule applies, we should look for configurations of nodes connected by wires, rather than just by edges. For example, spider fusion applies to two "z" or "x" nodes of the same type connected by one or more _wires_, rather than one or more edges (as in e.g. PyZX).

## Code organisation and style

ZX Online is implemented in Typescript. Data models and utility functions are implemented in [src/lib](https://github.com/zxcalc/zxonline/tree/main/src/lib), GUI code is in [src/gui](https://github.com/zxcalc/zxonline/tree/main/src/gui), and [mocha](https://mochajs.org/) unit tests are in [src/test](https://github.com/zxcalc/zxonline/tree/main/src/test).

The main datastructures are immutable: update methods make a shallow copy and return a new version of the updated structure. This is convenient for hooking up to a reactive GUI and maintaining history and backtracking functionality, but it can take some getting used to. For example:

```typescript
// wrong! 'g' is still empty, since addNodeWithData returns a copy of 
// 'g' with the node added
const g = new Graph();
g.addNodeWithData(new NodeData());

// 'g1' had a single node
let g1 = new Graph();
g1 = g1.addNodeWithData(new NodeData());

// most methods support "chaining" style, like this:
const g2 = new Graph()
  .addNodeWithData(new NodeData().setId(0))
  .addNodeWithData(new NodeData().setId(1));
```

## Design principles

- No user manual required: if something isn't obvious, it should be taught, preferably with nice UI cues/animations rather than words.
- Prefer context and gestures to tools.
- Easy to do things for beginners and easy to do things _fast_ for experts.
