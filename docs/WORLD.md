# 3D world architecture

## Scene composition

```text
WorldCanvas
├── EnvironmentController      day/night, sky, fog, weather budget
├── StaticWorld                terrain, roads, plaza, district landmarks
├── ChunkManager               fetch/cancel/cache active chunk ring
│   └── ChunkRenderer          instanced buildings, trees, lamps, props
├── PlayerController           input, acceleration, jump, collisions
├── CameraRig                  spring follow, orbit/zoom constraints
├── MultiplayerLayer           interpolated remote avatars and tags
├── InteractionLayer           raycast/proximity, selection, teleport
├── InteriorScene              reusable template loaded on demand
└── WorldEffects               particles, signs, traffic, portals by preset
```

The DOM HUD (search, profile card, settings, notifications, minimap, touch controls) stays outside the WebGL canvas for accessibility, predictable focus, and lower render coupling.

## Coordinates and chunks

- Right-handed Three.js coordinates: `x/z` ground plane, `y` elevation.
- Chunk size: 128 units initially. Active radius depends on preset: low 1 ring, medium 2, high 3.
- Central plaza owns reserved chunks around origin; districts are deterministic sectors with themed palettes/props.
- Static street layouts derive from a world seed. User building lots are allocated by the server and stored.
- Chunk responses contain only public projection fields and an asset/archetype key, not full profiles.

## Building representation

Height uses bounded logarithmic normalization:

```text
height = clamp(6 + log10(followers + 1) × 7, 6, 48)
```

Follower bands select archetype complexity independently of height: shop/house, apartment, mid-rise, tower, skyscraper. The renderer groups buildings by geometry/material/archetype into instanced meshes. Near selected buildings can promote to an individual high-detail mesh; medium/far bands reduce facade details and disable labels. Online state is an instance color/emissive attribute update, not a React tree rebuild.

## Movement and collision

Keyboard, pointer, gamepad-later, and touch joystick normalize into a shared intent vector. A fixed-step controller applies acceleration, deceleration, run speed, gravity, coyote-time jump, and capsule-vs-static colliders. Server checks prevent impossible remote transforms, but local prediction keeps controls responsive. Teleport uses fade/portal particles, server-approved position, then camera easing.

## Rendering budget

| Preset | DPR | Chunk rings | Shadows | Weather | Remote avatars |
|---|---:|---:|---|---|---:|
| Low | 1.0 | 1 | off | off | 12 |
| Medium | 1.25 | 2 | plaza/player | light | 30 |
| High | up to 1.75 | 3 | selected lights | full | 60 |

Frustum culling, pooled objects, reused textures/geometries, compressed assets, low-frequency minimap updates, capped HTML labels, and no per-frame React state are mandatory. Frame-time sampling may automatically step down a preset after sustained load. Reduced-motion disables large camera/teleport animations; all core social actions remain available outside 3D.

## Interiors

Entering a building switches to one of a small set of lazy-loaded GLTF templates. Content mounts into named anchors (lobby, gallery, achievements, social board, statistics screen). Only the selected profile payload and a paginated first gallery page load. Leaving disposes template-specific resources and restores the cached exterior position.
