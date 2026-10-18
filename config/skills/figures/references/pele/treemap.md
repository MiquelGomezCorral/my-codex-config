# Treemap

Use for: Part-of-whole where nested rectangle area is the amount (disk use, budget).

Keyword: `treemap-beta`

```mermaid
---
config:
  treemap:
    valueFormat: '$0,0'
---
treemap-beta
"Budget"
    "Operations"
        "Salaries": 700000
        "Equipment": 200000
        "Supplies": 100000
    "Marketing"
        "Advertising": 400000
        "Events": 100000
```

```mermaid
treemap-beta
"Products"
    "Electronics"
        "Phones": 50
        "Computers": 30
        "Accessories": 20
    "Clothing"
        "Men's": 40
        "Women's": 40
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Treemap examples](https://pele.run/examples/treemap).
