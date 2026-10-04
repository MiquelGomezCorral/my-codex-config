# LaTeX Formatting

### Images
```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.5\linewidth]{images/example.png}
    \caption{Example caption.}
    \label{fig:example}
\end{figure}
```

### Tables
```latex
\begin{table}[H]
\centering
\caption{Example table.}
\label{tab:example}
\renewcommand{\arraystretch}{1.2}
\begin{tabular}{@{}lrr@{}}
\toprule
\textbf{Column A} & \textbf{Column B} & \textbf{Column C} \\ \midrule
Value 1           & 100               & 200               \\
Value 2           & 300               & 400               \\ \bottomrule
\end{tabular}
\end{table}
```

### Plots
Use `pgfplots` with `groupplot` for multi-panel figures. Ensure proper labels, legends, and captions.

### Bibliography
Use `@online` for web references, `@article` for papers, `@book` for books. Keep consistent formatting.

```latex
@online{example,
    author       = {{Author}},
    title        = {Title},
    year         = {2026},
    url          = {https://example.com},
    urldate      = {2026-01-01}
}
```
