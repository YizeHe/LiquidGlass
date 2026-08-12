# Liquid Glass — Clear Center Showcase

**Independent copy** of `../showcase/`. The original showcase and `liquid-glass/` sources are **not modified**.

## Idea

| Mode | Middle | Edge |
|------|--------|------|
| **澄澈 Clear** (default) | Near-zero backdrop blur + wide neutral band → photo stays sharp through the center | Natural optical warp + light prism |
| **虚化 Frosted** | Classic frosted blur + denser tint | Softer rim refraction |

Optics still use `../liquid-glass/liquid-glass.js`. Clarity is controlled by:

- `blur: 0` (clear) vs `blur: 10` (frosted)
- `border: ~0.085` + `mapBlur: ~7.5` for a thin rim warp in clear (≈½ the earlier clear band) vs `border: ~0.07` / `mapBlur: ~11` frosted
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

Use the docks (top-right, or bottom on mobile):

| Dock | Options |
|------|---------|
| Glass | **澄澈 Clear** / **虚化 Frosted** |
| Background | **图片 Photo** / **浅色 Light + orbs** / **深色 Dark + orbs** |

On light/dark scenes, two large overlapping 3D orbs fill the frame: **pink under, blue on top** (top-left blue overlaps bottom-right pink). Preferences persist in `localStorage`.

## Components

Same set as the main showcase: buttons, icon buttons, dropdown, card, inputs, search, navbar, tabs, toggles, modal, toast, slider, segmented droplet, float card, chips, tooltip — all remount when the mode changes.

## API (debug)

```js
showcaseGlass.setGlassMode("clear");   // or "frosted"
showcaseGlass.setBgScene("light");     // "photo" | "light" | "dark"
showcaseGlass.getMode();
showcaseGlass.getBgScene();
showcaseGlass.remountAllGlass();
```
