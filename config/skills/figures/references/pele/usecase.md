# Use case

Use for: Actors and what they can do with a system, with include and extend links.

Keyword: `usecase-beta`

```mermaid
---
config:
  usecase:
    nodeSpacing: 60
    rankSpacing: 70
    diagramPadding: 24
    useMaxWidth: false
---
usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse
```

```mermaid
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalog")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Use case examples](https://pele.run/examples/usecase).
