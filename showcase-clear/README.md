# Liquid Glass — Clear Center Showcase

**Independent copy** of `../showcase/`. The original showcase and `liquid-glass/` sources are **not modified**.

## Idea

| Mode | Middle | Edge |
|------|--------|------|
| **澄澈 Clear** (default) | Near-zero backdrop blur + wide neutral band → photo stays sharp through the center | Natural optical warp + light prism |
| **虚化 Frosted** | Classic frosted blur + denser tint | Softer rim refraction |

Optics still use `../liquid-glass/liquid-glass.js`. Clarity is controlled by:

- `blur: 0` (clear) vs `blur: 10` (frosted)
- `border: ~0.17` wide edge-only displacement (clear) vs `~0.07` (frosted)
- Lighter CSS tint in clear mode so the fill does not black out the middle

## Run

Serve the **repo root**:

```bash
python -m http.server 8080
```

Open:

```
http://localhost:8080/showcase-clear/
```

Use the **澄澈 / 虚化** dock (top-right, or bottom on mobile) to switch every glass surface live. Preference is stored in `localStorage`.

## Components

Same set as the main showcase: buttons, icon buttons, dropdown, card, inputs, search, navbar, tabs, toggles, modal, toast, slider, segmented droplet, float card, chips, tooltip — all remount when the mode changes.

## API (debug)

```js
showcaseGlass.setGlassMode("clear");   // or "frosted"
showcaseGlass.getMode();
showcaseGlass.remountAllGlass();
```
