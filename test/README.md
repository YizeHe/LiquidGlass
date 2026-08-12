# test/ — baseline snapshot for comparison

## `showcase-clear-v5/`

Exported from git **`HEAD~5` = `e18775b`**  
(“Add background scenes with large overlapping 3D orbs”).

```bash
# re-extract
git worktree add test/wt-v5 HEAD~5
# copy test/wt-v5/showcase-clear → test/showcase-clear-v5
```

## What regressed after this commit (diff summary)

Later commits added light-mode **fill opacity** (milky panels ~0.42 white, opaque nested chips). Nested **Explore / Save** use `backdrop-filter` against the **card**, not the page — so a milky card makes them look solid even when button CSS is “transparent”.

| Area | e18775b (good glass) | Broken later |
|------|----------------------|--------------|
| Light scene | Only **color** on chrome; `.lg-surface` fill unchanged | `mode-clear` panels forced **0.42–0.28** white |
| Buttons | Same `.lg-surface` + light `btn-primary` wash | Card chips got `!important` opaque fills |
| Seg thumb | ~0.12–0.04 white | ~0.98 white in light mode |

## Local check

- Baseline: open `test/showcase-clear-v5/index.html` via HTTP from repo root  
- Fixed current: `showcase-clear/index.html` (浅色 mode should match baseline transparency again)
