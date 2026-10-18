"""One small plot that follows the artifact page theme.

Run: uv run --with plotly python example.py <out dir>
Open <out dir>/plots/recall.html alone, or add ?theme=light and ?theme=dark to its address.
"""

import argparse
import json
import math
from pathlib import Path

import plotly.graph_objects as go

# ======================================================================================
#                                   PALETTE (artifact pages)
# ======================================================================================
PALETTE = {
    "light": {
        "card": "#ffffff",  # --pele-bg, the page card behind the frame
        "text": "#1d1d1f",  # --pele-fg
        "line": "#5b5b66",  # --pele-line, the grid is this colour at low opacity
        "series": [
            "#2f5bd3",
            "#d96f00",
            "#1f7a4d",
            "#b3261e",
            "#b03a9a",
            "#1b7f8c",
            "#6b52c0",
            "#8a6d3b",
        ],
    },
    "dark": {
        "card": "#1d1d21",
        "text": "#ececf0",
        "line": "#b9b9c4",
        "series": [
            "#8fb0ff",
            "#ffa24d",
            "#5fd394",
            "#ff8a80",
            "#e58ad2",
            "#5ccfdc",
            "#b9a2ff",
            "#d8b56b",
        ],
    },
}
FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

# Runs in the saved HTML after the plot is drawn; plotly.py swaps {plot_id} for the plot div's id.
# The page passes ?theme=light|dark to a framed plot; opened alone, the system theme decides.
THEME_SCRIPT = """
const gd = document.getElementById("{plot_id}");
const asked = new URLSearchParams(location.search).get("theme");
const dark = asked ? asked === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
const colors = __PALETTE__[dark ? "dark" : "light"];
const grid = colors.line + "40";
const update = {"font.color": colors.text, colorway: colors.series};
for (const axis of ["xaxis", "yaxis"]) {
  for (const key of ["gridcolor", "zerolinecolor", "linecolor", "tickcolor"]) {
    update[axis + "." + key] = grid;
  }
}
document.body.style.margin = 0;
// The card colour is painted here, not in the plot, so the file also reads when opened alone.
document.documentElement.style.background = colors.card;
document.documentElement.style.colorScheme = dark ? "dark" : "light";
Plotly.relayout(gd, update);
""".replace("__PALETTE__", json.dumps(PALETTE))


# ======================================================================================
#                                          PLOT
# ======================================================================================
def build_figure() -> go.Figure:
    """Build the recall plot: three methods over training steps."""
    steps = list(range(0, 1001, 50))
    speeds = {"Baseline": 0.004, "Reward machine": 0.009, "Reward machine + replay": 0.012}
    recall = {
        name: [1 - math.exp(-speed * step) for step in steps] for name, speed in speeds.items()
    }

    # The title is a claim; assert it so a rerun on new data cannot keep a false title.
    at_300 = {name: values[steps.index(300)] for name, values in recall.items()}
    assert at_300["Reward machine + replay"] > at_300["Baseline"], at_300
    best, base = at_300["Reward machine + replay"], at_300["Baseline"]
    # Plotly does not wrap a title; break it by hand so a phone does not clip it.
    title = f"Replay reaches {best:.0%} recall by step 300,<br>the baseline only {base:.0%}"

    fig = go.Figure()
    for name, values in recall.items():
        fig.add_trace(
            go.Scatter(
                x=steps,
                y=values,
                name=name,
                mode="lines",
                hovertemplate=f"{name}<br>step %{{x}}<br>recall %{{y:.1%}}<extra></extra>",
            )
        )

    fig.update_layout(
        title={"text": title, "x": 0, "font": {"size": 15}},
        xaxis_title="Training steps",
        yaxis_title="Recall",
        yaxis_tickformat=".0%",
        colorway=PALETTE["light"]["series"],
        font={"family": FONT, "color": PALETTE["light"]["text"]},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend={"orientation": "h", "y": -0.2},
    )
    return fig


def main(out: Path) -> None:
    """Write the plot to <out>/plots/recall.html; plotly.min.js goes next to it."""
    path = out / "plots" / "recall.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    build_figure().write_html(
        path,
        include_plotlyjs="directory",
        config={"displayModeBar": False, "fillFrame": True},
        post_script=THEME_SCRIPT,
    )
    print(path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Write the themed example plot.")
    parser.add_argument("out", type=Path, help="output folder; the plot goes to <out>/plots/recall.html")
    main(parser.parse_args().out)
