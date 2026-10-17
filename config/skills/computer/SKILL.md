---
name: computer
description: Use the user's own computer. Control its GUI (use my computer, click, drag and drop, type, keyboard shortcut, scroll, take a screenshot on this machine, GNOME/Wayland on Ubuntu, usually through Orca) and inspect live hardware, OS, shell, and toolchain facts. Supports macOS and Linux; never rely on stored version or capacity values.
---

# Computer Inspection

Use live, read-only commands and report only facts relevant to the request.

1. Detect the platform with `uname -s`.
2. On macOS, use `sw_vers`, `system_profiler`, `sysctl`, `df`, and tool `--version`
   commands as needed.
3. On Linux, use `/etc/os-release`, `uname`, `lscpu`, `free`, `df`, and tool
   `--version` commands as needed.
4. Distinguish observed values from inference. Re-run volatile checks such as free
   space, memory, running services, and tool versions.
5. Do not expose hostnames, usernames, serial numbers, network addresses, or secrets
   unless the user explicitly needs that exact value.

Project dependencies and conventions belong to the repository, not this skill.

# Controlling the GUI

Before any click, drag, typing, shortcut, scroll, or screenshot on this machine, read
`references/desktop-control.md`. On GNOME Wayland, Orca's coordinate input silently does
nothing; the reference holds the commands that work (`scripts/wl-input.py`, accessibility
element clicks, `gnome-screenshot`). Prefer a shell, file, or HTTP path when one exists.


# Possible computers known

Stored specs are history. Live commands (`lscpu`, `free`, `lsblk`, `df`, `system_profiler`) override
this list; use it only to know which machine you are on.

### TurbotowerLNX
- **OS**: Linux, Ubuntu 24.04 LTS
- **CPU:** [AMD Ryzen 9 9900X 4.4/5.6GHz](https://www.pccomponentes.com/procesador-amd-ryzen-9-9900x-44-56ghz)
- **Disipador:** [MSI MAG CORELIQUID A13 360 ARGB Kit Refrigeración Líquida 360mm Negro](https://www.pccomponentes.com/msi-mag-coreliquid-a13-360-argb-kit-refrigeracion-liquida-360mm-negro)
- **Placa Base:** [ASUS TUF GAMING B850M-PLUS WIFI](https://www.pccomponentes.com/placa-base-asus-tuf-gaming-b850m-plus-wifi)
- **RAM:** [Patriot Viper Venom DDR5 64 GB (2 x 32 GB) 6400 MT/s UDIMM](https://www.amazon.es/dp/B0C9X9T6TP)
- **SSD:** 2 x Kioxia Exceria Plus G3 1 TB NVMe PCIe 4.0 M.2 (`lsblk` on 2026-10-16: two 931.5 GiB drives)
- **Tarjeta Gráfica:** [Palit Nvidia GeForce RTX 5070 Infinity 3 12GB](https://informaticabarata.com/en/graphics-cards/graphic-card-palit-nvidia-geforce-rtx-5070-infinity-3-12gb)
- **Fuente de Alimentación:** [MSI MPG A850G PCIE5 850W 80 Plus Gold Full Modular](https://www.pccomponentes.com/msi-mpg-a850g-pcie5-850w-80-plus-gold-full-modular)
- **Caja:** [Deepcool CH560 ARGB Mid Tower Cristal Templado USB 3.2 Negra](https://www.pccomponentes.com/deepcool-ch560-argb-mid-tower-cristal-templado-usb-32-negra)

### Turbotower
- **OS**: Windows 11, Atlas OS version
- **CPU:** [AMD Ryzen 9 9900X 4.4/5.6GHz](https://www.pccomponentes.com/procesador-amd-ryzen-9-9900x-44-56ghz)
- **Disipador:** [MSI MAG CORELIQUID A13 360 ARGB Kit Refrigeración Líquida 360mm Negro](https://www.pccomponentes.com/msi-mag-coreliquid-a13-360-argb-kit-refrigeracion-liquida-360mm-negro)
- **Placa Base:** [ASUS TUF GAMING B850M-PLUS WIFI](https://www.pccomponentes.com/placa-base-asus-tuf-gaming-b850m-plus-wifi)
- **RAM:** [Patriot Viper Venom DDR5 64 GB (2 x 32 GB) 6400 MT/s UDIMM](https://www.amazon.es/dp/B0C9X9T6TP)
- **SSD:** [Kioxia Exceria Plus G3 2TB Disco SSD 5000MB/S NVMe PCIe 4.0 M.2](https://www.pccomponentes.com/disco-duro-kioxia-exceria-plus-g3-2tb-disco-ssd-5000mb-s-nvme-pcie-40-m2-gen4)
- **Tarjeta Gráfica:** [Palit Nvidia GeForce RTX 5070 Infinity 3 12GB](https://informaticabarata.com/en/graphics-cards/graphic-card-palit-nvidia-geforce-rtx-5070-infinity-3-12gb)
- **Fuente de Alimentación:** [MSI MPG A850G PCIE5 850W 80 Plus Gold Full Modular](https://www.pccomponentes.com/msi-mpg-a850g-pcie5-850w-80-plus-gold-full-modular)
- **Caja:** [Deepcool CH560 ARGB Mid Tower Cristal Templado USB 3.2 Negra](https://www.pccomponentes.com/deepcool-ch560-argb-mid-tower-cristal-templado-usb-32-negra)


### macbook-air-de-miquel
- **OS**: MacOS...
- ... Missing ... No worry, look for them if needed


### turbopacjr
- **OS**: Windows 11...
- ... Missing ... No worry, look for them if needed