# Visual ledger

Every look used so far, so no episode repeats another (learnings L13). Read it before planning
shots; add the new episode's rows after it renders. "Retired" means do not reuse as-is.

Brand elements that may repeat: the HUD, the pixel bird mascot, the "SAVING... / GAME SAVED!"
text and the floppy disk icon (but not the background behind them).

| Look | Engine | Used in | Status |
| --- | --- | --- | --- |
| Earth from space, day, shaded globe | `drawPlanet` | ep001, ep002, ep003, ep004 | Retired |
| Earth at night with city lights and airglow | `drawPlanet` night | ep002 | Retired |
| Outro: small spinning globe over starfield | `drawPlanet` + `drawSpace` | ep001-ep004 | Retired: end card uses the episode's own world |
| Starfield with nebula | `drawSpace` | ep001-ep004 | Use only when the story is in space |
| Mode-7 ocean surface (day, dusk) | `drawOcean` | ep001, ep004 | Retired |
| Underwater cross-section with light rays | `drawUnderwater` | ep001 | Retired |
| Bathtub metaphor (water, duck, tiles) | `drawTub` | ep001, ep004 | Retired |
| Hurricane spiral seen from above | `drawStorm` | ep002 | Retired |
| Airglow ripples | `drawAirglowRipples` | ep002 | Retired |
| Chimney metaphor | `drawChimney` | ep002 | Retired |
| Hurricane cloud tower cross-section | `drawUpdraft` | ep002 | Retired |
| Moon close-up, Orion capsule | `drawMoon`, `drawOrion` | ep003 | Retired |
| Rubber-sheet gravity grid | `drawWellGrid` | ep003 | Retired |
| Earth-Moon map with dotted path | `drawPath` | ep003 | Retired |
| Bay side view, cliff, forest slope, run-up | `drawBay` | ep004 | Retired |
| Brick dropped in a tub | `drawBrick` | ep004 | Retired |
| Crater lake on a forested hill, valley village, night and dawn | `drawNyos` | ep005 | Retired |
| Geological cut: magma pocket, cracks, gas layer in a lake | `drawGeoCut` | ep005 | Retired |
| Soda bottle metaphor on a table | `drawSoda` | ep005 | Retired |
| Solar surface close-up: granules, sunspots, flare loop, CME | `drawSunSurface` | ep006 | Retired |
| Garden hose and umbrella metaphor, fence, utility wire | `drawShield` | ep006 | Retired |
| 1859 telegraph office interior with aurora window | `drawOffice` | ep006 | Retired |
| Aurora curtain (folded hem, rays) | `aurora` | ep006 | Use only with a new setting and palette |
| City skyline at night with pylons and transformer | `drawCityNight` | ep006 | Retired |
| Sun, Earth's orbit and a passing CME | `drawNearMiss` | ep006 | Retired |
| City street grid at night from above | `drawCityGrid` | ep006 | Retired |
| Night prairie under a storm: lone tree, farmhouse, rain | `drawPrairie` | ep007 | Retired |
| Inside a thundercloud: ice and hail, charge colours | `drawCloudInside` | ep007 | Retired |
| Balloon pop metaphor with pressure rings | `drawBalloon` | ep007 | Retired |
| Lightning channel close-up next to the Sun | `drawChannel` | ep007 | Retired |
| Burning forest edge with smoke | `drawPrairie` forest | ep007 | Retired |
