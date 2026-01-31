# @cosmic/physics

Physics utilities and teaching models for Cosmic Playground.

## Symbol conventions (important)

We sometimes use single-letter symbols in **model notes**, **UI copy**, and **exported results**. To avoid ambiguity, we use these conventions consistently:

- **D**: physical **diameter** (km unless otherwise stated)
- **d**: **distance** from observer to object (km unless otherwise stated)
- **θ**: **angular diameter** (degrees in UI, radians only when explicitly labeled)
- **R**: radius (km)
- **r**: orbital distance (km or AU, depending on the model)
- **a**: semi-major axis (AU in our Kepler “teaching units” models)
- **P**: period (years in our Kepler “teaching units” models)

If a quantity is not one of the above, prefer a descriptive name (e.g. `distanceToSunKm`) rather than reusing **D**/**d**.

### Example: angular diameter model

Angular diameter depends on an object’s physical diameter and its distance from the observer:

**θ = 2 arctan(D / (2d))**

Let’s unpack each piece:
- **θ** is the angular diameter (degrees in UI)
- **D** is the object’s physical diameter (km)
- **d** is the distance from the observer to the object (km)

Small-angle regime (when **D ≪ d**): **θ (radians) ≈ D / d**.

