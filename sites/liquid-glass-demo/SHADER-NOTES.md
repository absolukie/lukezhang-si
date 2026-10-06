# Liquid Glass — Shader Research Notes

How Apple's iOS 26 Liquid Glass is recreated in real WebGL/GLSL (not CSS `backdrop-filter` fakes).
Researched 2026-10-03. Primary references: archisvaze/liquid-glass (WebGL), liquid-glass-studio docs,
KLYNT RESEARCH.md, apple-style SKILL.md (WWDC25 219 anatomy), el-gladiador/liquid-glass-react,
imxsquash/liquid-glass-tailwind (displacement-map builder), prism-liquid-glass.

## The core idea

Liquid Glass is a **refractive slab**, not a blur. Every pixel asks: "am I inside the glass, and if so,
which way does the surface tilt here?" The background is sampled with a per-pixel UV offset along the
surface normal — light bends at the bevel, stays clean in the center. Blur is secondary (a light
diffusion); the *lensing* is what reads as glass.

## 1. Shape: rounded-rect SDF (iq's formula)

```glsl
float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

- Negative inside, zero on the edge, positive outside. One scalar drives silhouette, AA edge,
  shadow falloff, and the refraction field.
- `distFromEdge = -sd` inside the glass; normalize by a **bezel width** → `t = clamp(distFromEdge / bezel, 0, 1)`.

## 2. Surface normal: gradient of the SDF (finite differences)

Because the shape is an analytical distance field, the normal is just its normalized gradient:

```glsl
vec2 eps = vec2(0.5, 0.0);
vec2 grad = vec2(
  sdRoundedRect(p + eps.xy, halfSize, r) - sd,
  sdRoundedRect(p + eps.yx, halfSize, r) - sd);
grad = normalize(grad);
```

This gives infinite-precision normals — no polygon stepping, no edge aliasing. (liquid-glass-studio,
KLYNT both use exactly this.)

## 3. The lens profile: height field over the bevel

Apple's glass is a **thick bevel**: flat-ish in the middle, curving steeply at the rim like a lens.
archisvaze models the surface height as a function of the edge parameter `t`:

```glsl
float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s*s*s*s, 0.25);   // 0 at the rim → 1 in the flat center
}
```

- Differentiate it numerically (`dh = (h(t+dt) - h(t)) / dt`) to get the surface slope.
- Scale slope by `uThickness / bezel`: thicker glass or narrower bezel = steeper lens = stronger bend.

## 4. Refraction: Snell's law per pixel

```glsl
float slopeAngle = atan(dh * (uThickness / bezel));
float sinR = clamp(sin(slopeAngle) / uIOR, -1.0, 1.0);
float thetaR = asin(sinR);
float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));
vec2 offset = -grad * displacement / uResolution;
vec2 refractedUV = screenUV + offset;
```

- `uIOR` (index of refraction, ~1.0–3.0) controls bend strength. Higher IOR → light bends more.
- The offset points **along the surface normal** (outward), so long capsules bend at their flat
  edges instead of smearing toward the center (this is what the SVG `feDisplacementMap` version
  gets wrong when it displaces radially).
- Center stays clean because `h → 1` but `dh → 0` in the middle — flat surface, no bend.

KLYNT's equivalent shorthand: `bend = edge² * 14 * intensity`, offset along the SDF normal.

## 5. Chromatic aberration (dispersion)

Thick glass splits wavelengths. Two equivalent implementations:

- **Per-channel UV scaling** (apple-style): sample the background 3× with the refraction offset
  scaled per channel — R ×1.14, G ×1.0, B ×0.86 — then recombine one channel from each tap.
- **Normal-scaled split** (KLYNT): `caOffset = normal * bend * dispersion`, sample R at `uv + ca`,
  B at `uv - ca`, G at `uv`.

Keep the split **rim-weighted** (multiply by the bevel factor) so the center stays clean — real
glass only fringes where the surface curves.

## 6. Blur: multi-tap Poisson/Gaussian, in-shader

- archisvaze: 16-tap Poisson-disk blur of the background texture, radius = `uBlur` px.
  Skip entirely when radius < 0.5 (branch saves the taps).
- el-gladiador: 13-tap real Gaussian kernel in-shader.
- Apple pairs blur with a **luminosity re-level** (`saturate(1.6) brightness(1.06) contrast(1.04)`)
  so refracted content stays punchy instead of milky — worth copying: after blur, do
  `color = (color - 0.5) * 1.04 + 0.5; color *= 1.06;` plus a saturation bump.

## 7. Specular / rim light

A virtual overhead light; the rim brightens where the surface normal faces the light:

```glsl
vec2 lightDir = normalize(vec2(0.5, -0.7));
float rimDot = abs(dot(grad, lightDir));
float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
float spec = pow(rimDot * rimFalloff, 1.5) * uSpecular;
color += vec3(spec);
```

Plus a faint **inner rim ring** (`smoothstep(0,2,d) * (1 - smoothstep(2,5,d))`) and a subtle
**inner shadow** darkening (`color *= mix(1.0, 0.7, innerShadow * 0.3)`) for thickness.
apple-style notes the highlight should be **directional** (one dominant arc on the lit side, a
whisper on the far edge — not a uniform outline) and ideally track the pointer.

## 8. Fresnel edge

Grazing-angle rim: `fresnel = pow(1 - saturate(dot(viewDir, normal3D)), k)` approximated in 2D
as a function of `distFromEdge` — brightens the outer perimeter. liquid-glass-studio exposes
`fresnel / fresnelRange / fresnelHardness` as separate uniforms.

## 9. Shadows & tint

- **Outer shadow**: outside the glass (`sd > 0`), `exp(-sd²/800) * uShadow` black with soft falloff.
- **Tint**: `mix(color, tintColor, uTint)` — Apple's tint maps to background brightness, never solid.
- **Alpha edge**: `smoothstep(0, 1.5, distFromEdge)` for antialiased silhouette.

## 10. Pipeline (for multi-card pages)

prism-liquid-glass pattern, which we adopt:
1. **Background pass** → render the animated scene into an offscreen FBO (physical pixels, ×dpr).
2. **Glass pass** → fullscreen quad; per pixel, test each glass rect's SDF; inside → Snell offset +
   CA + blur taps against the FBO texture; add specular/rim/tint; alpha-composite.
3. DOM text sits **above** the canvas — content inside glass is never refracted (matches iOS).

Cheap alternative we explicitly reject: CSS `backdrop-filter: blur()` — uniform blur, no lensing,
no dispersion, no directional specular. The demo's comparison toggle shows this side by side.

## Parameter cheat sheet (what the lab sliders map to)

| Slider | Uniform | Effect |
|---|---|---|
| Refraction | `uIOR` 1.0–3.0 | Snell bend strength at the bevel |
| Lens thickness | `uThickness` | Height-field scale; steeper lens |
| Bezel width | `uBezel` px | How far the curved rim extends inward |
| Blur | `uBlur` px | Poisson-disk diffusion radius |
| Chromatic aberration | `uDispersion` | Per-channel UV split at the rim |
| Edge highlight | `uSpecular` | Directional rim-light intensity |
| Corner radius | `uRadius` px | SDF rounded-rect corner radius |
| Tint | `uTint` | Mix toward white/dark absorption color |
