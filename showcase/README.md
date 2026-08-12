# Liquid Glass — Component Showcase

Self-contained demo of [liquid-glass](../liquid-glass/) applied to everyday UI components. Optics come from `liquid-glass.js`; material dressing (tint, inset highlight, border, shadow) is CSS on `.lg-surface`.

## Run

Serve the **repo root** (not only `showcase/`) so relative paths resolve:

```bash
# from liquidglass2/
npx serve .
# or: python -m http.server 8080
```

Then open:

```
http://localhost:3000/showcase/
```

(or the port your server prints). Opening `index.html` via `file://` may break the photo path or filters in some browsers — prefer HTTP.

**Best experience:** Chromium (Chrome, Edge, Arc, Brave) for live edge refraction. Safari/Firefox get frosted-blur fallback.

## Components

| # | Component | Interaction |
|---|-----------|-------------|
| 1 | **Button** | Primary / secondary / ghost glass buttons |
| 2 | **Icon button** | Circular glass icon actions |
| 3 | **Dropdown** | Account menu open/close, Escape, outside click |
| 4 | **Card** | Content card with badge + actions |
| 5 | **Text input** | Glass fields with labels |
| 6 | **Search bar** | Icon + clear control |
| 7 | **Navbar** | Sticky glass nav (brand, links, CTA) |
| 8 | **Tabs** | Tablist with keyboard arrows |
| 9 | **Toggle / Switch** | Interactive on/off switches |
| 10 | **Modal** | Dialog + backdrop; open from Buttons area / nav |
| 11 | **Toast** | Timed glass notification |
| 12 | **Slider** | Volume range control |
| — | **Segmented** | Day / Week / Month with **liquid droplet** thumb (magnify, travel stretch, landing squash; drag or tap) |
| — | **Float card** | Original demo: spring-physics draggable glass card over the photo |
| — | **Progress & chips** | Progress bar + filter chips |
| — | **Tooltip** | Hover/focus tip |

## Notes

- Library path: `../liquid-glass/liquid-glass.js`
- Background: `../liquid-glass/demo/meadow-tall.jpg` (CSS gradient fallback if the image fails)
- `applyGlass(el, opts)` in `app.js` stores instances, re-applies safely, and supports `refresh()` after dropdown/modal open
- Keep glass surfaces under ~800px per side (library guidance)
- No frameworks, no CDN dependencies
