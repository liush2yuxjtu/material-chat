---
name: html-artifacts
description: Create a self-contained HTML artifact when spatial layout, diagrams, interactivity, visual hierarchy, or an exportable one-off editor communicates the result better than Markdown. Keep short conversational, code-only, and terminal-style answers in Markdown.
---

# HTML Artifacts

Use HTML when the deliverable benefits from side-by-side comparison, spatial information, interaction, non-linear navigation, meaningful color, a purpose-built editor, sharing, or substantial length.

## Stay in Markdown for

- Short conversational replies.
- Code-only or terminal-style output.
- Brief disposable summaries.
- Files intended for frequent hand editing and version-control diffs.

## Required properties

1. Produce one self-contained `.html` file with inline CSS and JavaScript.
2. Make it work offline where practical and avoid build steps.
3. Include a viewport meta tag and responsive narrow-screen behavior.
4. Use a layout matching the information shape: columns for comparisons, timelines for chronology, rendered diffs for reviews, and SVG for diagrams.
5. Put a clear title and concise framing or TL;DR at the top.
6. Use restrained typography and color; avoid generic gradient-card dashboard styling.
7. Any editor must export its state as Markdown, JSON, CSV, or a reusable prompt.

## Category guidance

- Comparisons, explorations, and plans: use aligned columns, consistent metrics, timelines, data-flow diagrams, risk tables, and explicit recommendations.
- Code reviews and PRs: render annotated diffs, severity, review focus, before/after views, and module maps.
- Design and prototypes: render actual tokens and components, make interactions tunable, and expose copyable configuration.
- Diagrams: use accessible inline SVG, directional edges, legends, happy-path emphasis, and copyable SVG.
- Reports and explainers: lead with the answer, use charts or interactive demonstrations where useful, and make status, timelines, impact, and actions scannable.
- Decks: use one full-viewport section per slide, keyboard navigation, a slide counter, and one idea per slide.
- Custom editors: preload the supplied data, expose constraints immediately, support efficient repetitive input, and always provide export.

## Output mechanics for Codex

Save the artifact in the working directory with a descriptive kebab-case `.html` filename. Report the path after creation. For related artifacts, place the files in a dedicated folder. Match an existing project design system when one exists; otherwise use calm, readable defaults.