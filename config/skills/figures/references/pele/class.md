# Class

Use for: Classes, interfaces, fields and methods with inheritance and composition (UML class view of code).

Keyword: `classDiagram`

```mermaid
---
config:
  class:
    hierarchicalNamespaces: false
---
classDiagram
    namespace Earth.Volcano.Summit {
        class Crater {
            +erupt()
        }
    }
    namespace Earth.Volcano.Slope {
        class LavaFlow {
            +buildLand()
        }
    }
    namespace Earth {
        class Hotspot {
            +meltRock()
        }
    }
    Hotspot --> Crater : feeds
    Hotspot --> LavaFlow : feeds
```

```mermaid
---
title: Reef animal example
---
classDiagram
    note "From Turtle till Whale"
    Animal <|-- Turtle
    note for Turtle "can swim<br>can dive<br>can nest on beaches<br>can live for decades"
    Animal <|-- Shark
    Animal <|-- Whale
    Animal : +int age
    Animal : +String name
    Animal: +isMammal()
    Animal: +migrate()
    class Turtle{
        +String shellColor
        +swim()
        +nest()
    }
    class Shark{
        -int sizeInFeet
        -canHunt()
    }
    class Whale{
        +bool is_humpback
        +sing()
    }
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Class examples](https://pele.run/examples/class).
