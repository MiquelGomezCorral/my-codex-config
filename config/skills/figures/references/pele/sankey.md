# Sankey

Use for: A quantity that splits and merges between stages; band width is the amount.

Keyword: `sankey`

```mermaid
---
config:
  sankey:
    showValues: false
    nodeWidth: 15
    nodePadding: 20
---
sankey

Electricity grid,Heating and cooling - homes,113.726
Electricity grid,Industry,342.165
Electricity grid,Losses,56.691
```

```mermaid
sankey

%% source,target,value
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Sankey examples](https://pele.run/examples/sankey).
