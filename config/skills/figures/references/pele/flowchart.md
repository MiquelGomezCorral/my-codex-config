# Flowchart

Use for: Steps and decisions of a process, pipelines, dependency graphs and grouped system views. The default for "how does it flow".

Keyword: `flowchart`

```mermaid
flowchart LR
    subgraph subgraph1
        direction TB
        top1[top] --> bottom1[bottom]
    end
    subgraph subgraph2
        direction TB
        top2[top] --> bottom2[bottom]
    end
    %% ^ These subgraphs are identical, except for the links to them:

    %% Link *to* subgraph1: subgraph1 direction is maintained
    outside --> subgraph1
    %% Link *within* subgraph2:
    %% subgraph2 inherits the direction of the top-level graph (LR)
    outside ---> top2
```

```mermaid
flowchart LR
  subgraph Client
    UI[Web app]
    Cache[(Local cache)]
  end
  subgraph Services
    API[API gateway]
    Auth[Auth service]
    Orders[Order service]
  end
  subgraph Storage
    DB[(Orders DB)]
  end
  UI --> API
  UI --> Cache
  API --> Auth
  API --> Orders
  Orders --> DB
  Auth -. token .-> UI
```

Two-way between groups:

```mermaid
flowchart LR
  subgraph Client
    UI[Web app]
    Cache[(Local cache)]
  end
  subgraph Services
    API[API gateway] --> Orders[Order service]
    API --> Auth[Auth service]
  end
  UI --> Cache
  UI --> API
  API --> UI
  Auth -.->|token| UI
  Orders --> DB[(Orders DB)]
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Flowchart examples](https://pele.run/examples/flowchart).
