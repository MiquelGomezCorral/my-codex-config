# Cynefin

Use for: Classifying a problem as clear, complicated, complex or chaotic (Cynefin framework).

Keyword: `cynefin-beta`

```mermaid
cynefin-beta
  title Strategy Categorization

  complex
    "Market research"

  complicated
    "Competitive analysis"

  clear
    "Standard pricing"

  chaotic
    "Crisis management"

  complex --> complicated : "Pattern identified"
  complicated --> clear : "Best practice codified"
  clear --> chaotic : "Complacency"
  chaotic --> complex : "Stabilized"
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Cynefin examples](https://pele.run/examples/cynefin).
