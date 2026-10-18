# Figure catalog

Every figure kind the tools can make, and which tools make it. This is the one list of what each
tool has; the tool references explain how to use it.

## How to pick

1. Find the figure in the tables below.
2. Use the first tool, left to right, that has it: Pele, then diagram-design, then Plotly.
3. If that tool's result is not good enough (the layout tangles, a feature is missing, it looks
   rough for a reader who needs polish), move right to the next tool that has the same figure.
4. Real measured or computed data goes to Plotly even when Pele or diagram-design has the chart:
   they draw the numbers you type, Plotly plots the data itself with exact values on hover.
5. Anything not listed, or drawn rather than diagrammed, is Excalidraw (last table).

Pele cells link to the example file and name the Mermaid keyword. diagram-design cells name the
type file in that skill's `references/` (`type-<name>.md`). "—" means the tool does not have it.

## Flows and processes

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Flowchart | Steps and decisions, algorithms, triage | [`flowchart`](pele/flowchart.md) | `flowchart` | — |
| Swimlane | A process across teams or roles | [`swimlane-beta`](pele/swimlane.md) | `swimlane` | — |
| Business process | Who does each step, with the data and tools it uses | — | `process` | — |
| Data flow across roles | How data moves between people who make, process and use it | — | `data-flow` | — |
| Agent workflow | Agent steps, tools, branches and loops | [`agentflow-beta`](pele/agentflow.md) | — | — |
| Sequence | Messages between actors over time: API calls, protocols | [`sequenceDiagram`](pele/sequence.md) | `sequence` | — |
| State machine | States of one thing and its transitions; lifecycle phase maps | [`stateDiagram-v2`](pele/state.md) | `state` | — |
| User journey | Stages of an experience and how each feels | [`journey`](pele/journey.md) | `journey` | — |
| Event modeling | Commands, events and views laid out in time | [`eventmodeling`](pele/eventmodeling.md) | — | — |
| Story map | User stories by narrative order and priority, with the release cut | — | `story-map` | — |
| Loop or flywheel | A cycle where the last step feeds the first | — | `loop` | — |
| Railroad | Grammar or syntax of a language or format | [`railroad-ebnf-beta`, `railroad-beta`](pele/railroad.md) | — | — |

## Systems and architecture

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Architecture overview | Services, stores and how they connect | [`architecture-beta`](pele/architecture.md) | `architecture` | — |
| C4 | Context, container or component views of one system | [`C4Context` and others](pele/c4.md) | — | — |
| Block layout | System boxes placed on a grid | [`block`](pele/block.md) | — | — |
| Architecture delta | A migration: what stays, moves, appears or goes, before and after | — | `architecture-delta` | — |
| Data stack overview | Ingestion to visualisation on one platform | — | `high-level` | — |
| Current IT landscape | The legacy picture before a modernisation | — | `it-state` | — |
| Deployment | Where software runs: hosts, pods, zones, replicas | — | `deployment` | — |
| Layer stack | Stacked layers: tech stack, OSI, abstraction levels | — | `layers` | — |
| Nested containment | Scopes, trust zones, blast radius | — | `nested` | — |
| Medallion tiers | Data storage tiers by quality and access level | — | `medallion` | — |
| Data platform integration | Sources and consumers around a data platform hub | — | `dp-integration` | — |
| Access matrix | Permissions per role and component | — | `dp-security-matrix` | — |
| Dependency graph | What depends on what, with shared dependencies | — | `dependency` | — |

## Hierarchies and maps of ideas

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Tree or hierarchy | Taxonomies, block decomposition trees, decision breakdowns, skill trees | — | `tree` | — |
| File tree | Folders and files | [`treeView-beta`](pele/treeview.md) | — | — |
| Org chart | Teams and who owns what | — | `org-chart` | — |
| Mind map | A topic split into branches | [`mindmap`](pele/mindmap.md) | — | — |
| Venn | Overlap between sets or ideas | [`venn-beta`](pele/venn.md) | `venn` | — |
| Pyramid or funnel | Ranks, hierarchies of needs, conversion stages | — | `pyramid` | `go.Funnel` (data) |
| Quadrant | Items on two axes with four labelled zones | [`quadrantChart`](pele/quadrant.md) | `quadrant` | — |
| Cynefin | Classifying a problem: clear, complicated, complex, chaotic | [`cynefin-beta`](pele/cynefin.md) | — | — |
| Wardley map | A value chain against how evolved each part is | [`wardley-beta`](pele/wardley.md) | `wardley` | — |
| Fishbone (Ishikawa) | Root causes grouped around one effect | [`ishikawa-beta`](pele/ishikawa.md) | `fishbone` | — |

## Data models and code

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Entity relationship | Entities and cardinality | [`erDiagram`](pele/er.md) | `er` | — |
| Database schema | Real tables, column types, keys and indexes | — | `db-schema` | — |
| UML class | Classes, fields, methods, inheritance | [`classDiagram`](pele/class.md) | `uml-class` | — |
| Requirement | Requirements, what satisfies them, how each is verified | [`requirementDiagram`](pele/requirement.md) | — | — |
| Use case | Actors and what they can do with a system | [`usecase-beta`](pele/usecase.md) | — | — |
| Packet layout | Bits and bytes of a packet or record | [`packet`](pele/packet.md) | — | — |
| Git history | Branches, commits, merges, tags | [`gitGraph`](pele/git.md) | — | — |

## Plans and time

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Gantt | Tasks and phases with dates | [`gantt`](pele/gantt.md) | `gantt` | — |
| Timeline | Events by period: history, releases, incidents | [`timeline`](pele/timeline.md) | `timeline` | — |
| Kanban | Work items by state | [`kanban`](pele/kanban.md) | `kanban` | — |

## Charts

Pele and diagram-design charts hold a handful of typed numbers (diagram-design's line chart: 4 to
12 points). Plotly charts real data of any size.

| Figure | Use it for | Pele | diagram-design | Plotly |
| --- | --- | --- | --- | --- |
| Bar or column | Values across categories | [`xychart`](pele/xychart.md) | `bar` | `go.Bar` |
| Dumbbell | The gap between two values per category | — | `bar` | `go.Scatter` |
| Line | A trend over time or an index | [`xychart`](pele/xychart.md) | `line` | `go.Scatter` |
| Slopegraph, bump, ridgeline, streamgraph | Change between two states, rank over time, stacked distributions, stacked flows | — | `line` | `go.Scatter`, `go.Violin` |
| Pie | Share of a whole, few categories | [`pie`](pele/pie.md) | — | `go.Pie` |
| Treemap | Part of a whole where sizes are the story | [`treemap-beta`](pele/treemap.md) | `treemap` | `go.Treemap` |
| Marimekko | Shares across two dimensions at once | — | `treemap` | — |
| Sankey | A quantity splitting and merging across stages | [`sankey`](pele/sankey.md) | `sankey` | `go.Sankey` |
| Radar or spider | A few items scored on the same axes | [`radar-beta`](pele/radar.md) | `radar` | `go.Scatterpolar` |
| Polar or radial lollipop | One series over categories whose order is circular | — | `polar` | `go.Barpolar` |
| Heatmap | Which row and column combination stands out | — | `heatmap` | `go.Heatmap` |
| Scatter, bubble, beeswarm | Correlation, clusters and distribution of two variables | — | `scatter` | `go.Scatter` |
| Waterfall | How a start total becomes an end total | — | `waterfall` | `go.Waterfall` |
| Histogram, box, violin | Distributions of measured values | — | — | `go.Histogram`, `go.Box`, `go.Violin` |
| Many series, many points, 3D, maps | Anything beyond a dozen values, or geography | — | — | Plotly |

## Drawings: Excalidraw

Anything drawn rather than diagrammed: wireframes, UI mockups, slides, illustrations, hand-drawn
maps, icon-rich visuals, a whiteboard the user keeps editing, and any figure no table above has.
Use `excalidraw` for quick template scenes and `excalidraw-draw` for clean or free-form ones; see
[excalidraw.md](excalidraw.md).
