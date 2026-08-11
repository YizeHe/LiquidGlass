# LiquidGlass

Apple-style **liquid glass** for the web: real edge refraction (with a faint prism fringe) on everyday UI, powered by a zero-dependency module.

## What’s in this repo

| Path | Description |
|------|-------------|
| [`liquid-glass/`](liquid-glass/) | Core library (`liquid-glass.js`) + original single-card demo |
| [`showcase/`](showcase/) | **Component gallery** — buttons, dropdown, card, inputs, navbar, tabs, modal, toast, slider, and more |

## Quick start

Serve the **repository root** so relative paths resolve:

```bash
python -m http.server 8080
# or: npx serve .
```

Then open:

- Library demo: [http://localhost:8080/liquid-glass/demo/](http://localhost:8080/liquid-glass/demo/)
- Component showcase: [http://localhost:8080/showcase/](http://localhost:8080/showcase/)

**Best in Chromium** (Chrome / Edge / Arc / Brave) for live refraction. Safari and Firefox use a frosted-blur fallback.

## Use the library

```html
<script src="liquid-glass/liquid-glass.js"></script>

<div class="glass">…</div>

<script>
  const glass = liquidGlass(document.querySelector(".glass"));
  // glass.supported  — false on Safari/Firefox
  // glass.refresh()  — after size changes
  // glass.destroy()  — cleanup
</script>
```

Material dressing (tint, specular highlight, border, shadow) is plain CSS — see [`liquid-glass/README.md`](liquid-glass/README.md).

## Showcase components

Buttons, icon buttons, dropdown, card, text inputs, search bar, navbar, tabs, toggles, modal, toast, slider, plus segmented control, progress/chips, and tooltip. Details in [`showcase/README.md`](showcase/README.md).

## Credits

Optics technique informed by [Aave — Building glass for the web](https://aave.com/design/building-glass-for-the-web) and the original [liquid-glass](https://github.com/deepika-builds/liquid-glass) module (MIT).

## License

MIT — see [`liquid-glass/LICENSE`](liquid-glass/LICENSE).
