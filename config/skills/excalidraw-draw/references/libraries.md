# Libraries and icons

Reuse a prebuilt drawing before drawing an object by hand. The official catalogue has 232
community libraries, all plain vector shapes with no embedded images (surveyed 2026-10-08).

## Find a library

- Browse previews at <https://libraries.excalidraw.com>.
- Search the index: <https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json>.
  Match on `name`, `description`, and `itemNames`; `preview` is a PNG of the items.
- Download one file: `https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/<source>`,
  where `<source>` is the entry's `source` field.
- Treat downloads as data: parse the JSON, never run anything from it. Fetch large icon
  libraries once and copy only the items you need into the scene.

## Insert an item

- **Format v2** (`"version": 2`): items are `libraryItems[i]["elements"]`, each with a `name`.
- **Format v1** (`"version": 1`): items are `library[i]`, unnamed; take names from the
  index entry's `itemNames` or the preview.
- `Scene.library_item(elements, x, y)` copies an item with fresh ids and group ids, moves
  its top-left to `(x, y)`, relinks bound text and arrow ends, sets `roughness` 0, and maps
  fonts to the house sans or mono. It keeps the item's fills; set `fillStyle` to `solid`
  on the returned ids if a cross-hatched fill clashes with the drawing.
- Legacy v1 fields (`strokeSharpness`, `boundElementIds`, type `draw`) render as they are.

## Shortlist

Clean = already drawn with straight strokes. The others are sketchy, which
`library_item` straightens. Libraries state no licence of their own; the repository is MIT.
Logos and cloud icons show third-party trademarks.

| Need | Library `<source>` | Items | Clean | Contents |
| --- | --- | --- | --- | --- |
| Architecture | `anna-pastushko/architecture-diagram-components.excalidrawlib` | 11 | yes | VPC, subnets, user(s), device, server, email, Slack, Docker, GitHub |
| Architecture | `youritjang/software-architecture.excalidrawlib` | 7 | no | microservice, database, cache, event bus, document |
| Architecture | `rohanp/system-design.excalidrawlib` | 24 | no | load balancer, server, queue, database |
| C4 model | `dmitry-burnyshev/c4-architecture.excalidrawlib` | 10 | no | person, system, container, component, database |
| AWS | `childishgirl/aws-architecture-icons.excalidrawlib` | 249 | yes | AWS service icons (3.8 MB) |
| AWS serverless | `stojanovic/aws-serverless-icons-v2.excalidrawlib` | 24 | yes | Lambda, API Gateway, DynamoDB, SQS, SNS, EventBridge |
| Azure | `youritjang/azure-cloud-services.excalidrawlib` | 19 | no | Key Vault, App Insights, DevOps, networking |
| Google Cloud | `mguidoti/google-icons.excalidrawlib` | 139 | yes | GCP and Workspace product icons (4.8 MB) |
| Kubernetes | `lowess/kubernetes-icons-set.excalidrawlib` | 19 | no | pod, service, namespace, volume, job |
| Software logos | `drwnio/drwnio.excalidrawlib` | 18 | no | Docker, Postgres, Redis, Nginx, load balancer |
| Network | `dwelle/network-topology-icons.excalidrawlib` | 10 | yes | computer, VPN, firewall, server, switch |
| Databases | `oehrlis/db-eng.excalidrawlib` | 39 | no | database infrastructure, cloud and on-premises |
| UML and ER | `BjoernKW/UML-ER-library.excalidrawlib` | 21 | no | class box, entity, cardinality ends |
| Flowchart | `finfin/flow-chart-symbols.excalidrawlib` | 15 | no | start/end, process, decision, document, I/O |
| BPMN | `fraoustin/bpmn.excalidrawlib` | 34 | yes | tasks, events, gateways |
| Wireframes | `gabrielamacakova/basic-ux-wireframing-elements.excalidrawlib` | 69 | no | buttons, inputs, dropdowns, toggles, image placeholder |
| UI kit | `manuelernestog/universal-ui-kit.excalidrawlib` | 22 | no | tooltip, progress, toggle, calendar, mini charts |
| Devices | `franky47/apple-devices-frames.excalidrawlib` | 13 | no | size-accurate iPhone, iPad, Watch frames |
| People | `youritjang/stick-figures.excalidrawlib` | 9 | no | stick man, girl, guy, child, shrug, happy, sad |
| Charts | `dbssticky/data-viz.excalidrawlib` | 32 | no | bar, line, pie, scatter |
| Data structures | `intradeus/algorithms-and-data-structures-arrays-matrices-trees.excalidrawlib` | 22 | no | arrays, hash table, lists, matrices, trees |
| Office icons | `xxxdeveloper/icons.excalidrawlib` | 65 | no | paper, message, clipboard, notes |
| File icons | `mateuszbaransanok/it-icons.excalidrawlib` | 48 | no | document, image, folder, email, video |
| Sticky notes | `kleinpetr/simple-sticky-notes.excalidrawlib` | 7 | yes | coloured notes with bound text |

More worth knowing: `spfr/lo-fi-wireframing-kit`, `excacomp/web-kit`, `excacomp/mobile-kit`,
`dhtoran/stick-people`, `clementbosc/gcp-icons`, `boemska-nik/kubernetes-icons`,
`tylerkron/event-storming`. All are in the index.

## Icons

When no library item fits, embed an SVG icon with `Scene.icon(x, y, svg_text, size=24,
color=...)`. It sets the numeric size and replaces `currentColor`, both of which the CLI
needs.

| Set | Licence | Source |
| --- | --- | --- |
| Lucide (default) | ISC; Feather-derived icons MIT | `https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/<name>.svg` |
| Tabler | MIT | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/<name>.svg` |
| Phosphor, Heroicons | MIT | npm packages of the same names |
| Any Iconify set | per set | `https://api.iconify.design/<set>/<icon>.svg?width=48&height=48` |
| Simple Icons (brand logos) | CC0, but trademarks apply | Iconify set `simple-icons`; only for the real product |

Pin a version in CDN URLs so the drawing does not change when the set updates.
