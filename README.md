# Nuclear Fuel Assembly. Anatomy Motion Explainer

A code-driven, anatomy-style motion explainer of a nuclear fuel assembly. 34 seconds, 30 fps, 1,020 frames (0–1019), rendered as a pure function of frame number. Scrub to any frame and the picture is always the same.

**Live:** https://mizcausevic-dev.github.io/nuclear-fuel-assembly/
**Article:** [`article/medium-article-Cursor.md`](article/medium-article-Cursor.md)
**Source reference:** U.S. NRC, [Nuclear Fuel](https://www.nrc.gov/reading-rm/basic-ref/students/fuel.html)

## The five phases

| Frames | Time | Phase |
|---|---|---|
| 0–149 | 0–5s | Fuel rods and spacer grids revealed, coolant pathway marked |
| 150–299 | 5–10s | One rod in longitudinal section: UO2 pellet stack, cladding, gap, plenum |
| 300–509 | 10–17s | Neutron moderation and fission, as an explicitly labeled schematic |
| 510–749 | 17–25s | Burnup progression, qualitative only, time compressed |
| 750–1019 | 25–34s | Pull back to the core lattice, stable complete-system end view |

Colors are explanatory overlays, not literal emission. Cyan marks the primary pathway, gold marks actuation and energy, violet marks sensing and state change. Every scale change, slow-motion segment, and time compression is labeled on the stage.

## Run locally

```bash
npm install
npm run dev     # http://127.0.0.1:4319
npm run build   # production build in dist/
```

Open any frame directly with `?frame=412` (paused on that frame). Keyboard: space plays or pauses, arrow keys step one frame.

## Accuracy scope

Generic UO2 ceramic only. No enrichment figures, no failure mechanisms, no invented specifications or performance claims. Working brief, not a certified engineering reference. Verify subject-specific details before publication.

## GitHub

- **About:** Code-driven anatomy motion explainer of a nuclear fuel assembly. 1,020 deterministic frames covering rods, pellets, moderation, burnup, and the core lattice.
- **Topics:** `nuclear-energy` `fuel-assembly` `science-communication` `canvas-animation` `engineering-education` `vite` `typescript` `data-visualization`

## License

Code MIT. Article and images © Kinetic Gain LLC, all rights reserved.
