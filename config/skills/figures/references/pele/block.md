# Block

Use for: Block layouts on a grid: system boxes of different widths, groups and arrow blocks, when a flowchart would reorder what you placed.

Keyword: `block`

```mermaid
block
  blockArrowId<["Label"]>(right)
  blockArrowId2<["Label"]>(left)
  blockArrowId3<["Label"]>(up)
  blockArrowId4<["Label"]>(down)
  blockArrowId5<["Label"]>(x)
  blockArrowId6<["Label"]>(y)
  blockArrowId7<["Label"]>(x, down)
```

```mermaid
block
  columns 3
  a:3
  block:group1:2
    columns 2
    h i j k
  end
  g
  block:group2:3
    %% columns auto (default)
    l m n o p q r
  end
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Block examples](https://pele.run/examples/block).
