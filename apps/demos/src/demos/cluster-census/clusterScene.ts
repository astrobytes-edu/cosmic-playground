/*
 * The cluster panel, on the GPU.
 *
 * Why three.js and not the Canvas 2D renderer this replaced:
 *
 * The look that makes a star field read as light rather than as dots is ADDITIVE
 * blending plus a soft radial falloff per star -- overlapping stars sum instead of
 * painting over one another, so a dense core glows rather than turning into a flat
 * disc of the last colour drawn. Canvas 2D can do that (`globalCompositeOperation =
 * "lighter"` plus a radial gradient per star), but a gradient per star per frame is
 * expensive enough that the reference implementation has to fall back to plain squares
 * for anything under 1.6 px, which is most of an IMF-sampled cluster. On the GPU the
 * falloff is two lines of fragment shader and every star gets it, at 20,000 stars,
 * while the camera is moving.
 *
 * That also buys the interaction: real orbit, zoom and pan, and a 2-D view that is the
 * same scene with the camera locked overhead rather than a second renderer to keep in
 * step.
 *
 * Coordinates are parsecs throughout. The scene is not rescaled; the camera moves.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ClusterViewMode = "2D" | "3D";

export interface SceneStar {
  id: number;
  /** Position in parsecs, centred on the cluster. */
  x: number;
  y: number;
  z: number;
  /** Core radius in device-independent pixels at unit distance. */
  sizePx: number;
  /** 0..255 per channel. */
  rgb: [number, number, number];
  alpha: number;
}

export interface ClusterScene {
  setStars(stars: readonly SceneStar[], plotRadiusPc: number): void;
  setMode(mode: ClusterViewMode): void;
  getMode(): ClusterViewMode;
  setHighlight(id: number | null, pinned: boolean): void;
  getHighlight(): { id: number | null; pinned: boolean };
  /** Called whenever the camera moves, so the overlay can be redrawn in step. */
  onChange(handler: () => void): void;
  /** Screen positions of every star under the current camera, for hit testing. */
  projectAll(): { id: number; x: number; y: number; radiusPx: number }[];
  /** Parsecs per pixel at the centre of the view, for the scale bar. */
  parsecsPerPixel(): number;
  resetView(): void;
  resize(): void;
  dispose(): void;
  readonly canvas: HTMLCanvasElement;
}

/*
 * A star is one point sprite. The vertex shader sizes it; the fragment shader shapes it.
 *
 * `sizeAttenuation` is done by hand rather than with PointsMaterial so the 2-D
 * orthographic view can opt out of it: under an orthographic camera "nearer looks
 * bigger" is not a depth cue, it is a lie about the projection.
 */
const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uAttenuate;
  uniform float uSizeScale;
  uniform float uReferenceDepth;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    // Depth cue, NORMALISED to the cluster centre: a star at the camera's focal distance
    // is drawn at exactly its 2-D size, nearer ones larger and farther ones smaller. The
    // raw three.js attenuation (a fixed scale over -z) would be ~19x here, because that
    // constant assumes a scene measured in units of roughly one, not sixteen parsecs.
    float depth = max(-viewPosition.z, uReferenceDepth * 0.05);
    float attenuation = mix(1.0, clamp(uReferenceDepth / depth, 0.35, 2.6), uAttenuate);
    gl_PointSize = aSize * uSizeScale * uPixelRatio * attenuation;
    // A star that has shrunk below a pixel fades instead of flickering in and out as
    // the point rasteriser rounds its size.
    vAlpha = aAlpha * clamp(gl_PointSize / uPixelRatio, 0.0, 1.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Distance from the sprite centre, 0 at the core and 1 at the edge.
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (d > 1.0) discard;
    // A hard-ish core inside a soft halo: one smoothstep would give a fuzzy blob with
    // no star in it. The core is what you see; the halo is what makes it glow.
    float core = 1.0 - smoothstep(0.0, 0.30, d);
    float halo = pow(1.0 - d, 3.0);
    // Additive blending accumulates, so each star contributes a fraction of full
    // brightness. At the earlier values 800 stars summed to a flat white disc: the core
    // of a cluster is bright, but it is made of stars, and it has to still look like it.
    float intensity = core * 0.9 + halo * 0.26;
    gl_FragColor = vec4(vColor * intensity, intensity * vAlpha);
  }
`;

/**
 * Sprite size multiplier: `gl_PointSize` is a DIAMETER, and the core occupies the inner
 * 30 percent of the radius. At 7.0 a star's bright core comes out at roughly the dot
 * radius the old 2-D renderer used, with the halo extending past it.
 */
const SPRITE_SCALE = 7.0;

/** Camera distance as a multiple of the plot radius. Gentle perspective, not a fisheye. */
const CAMERA_DISTANCE_FACTOR = 3.2;

/**
 * Build the scene, or return null if this browser cannot give us WebGL.
 *
 * Returning null rather than throwing matters: the scene is constructed at module scope,
 * so an exception here would take the readouts, the HR diagram and the histogram down
 * with it. A reader without WebGL should lose one panel, not the whole instrument.
 */
export function createClusterScene(canvas: HTMLCanvasElement): ClusterScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  let plotRadiusPc = 5;
  let mode: ClusterViewMode = "2D";
  let stars: readonly SceneStar[] = [];
  let points: Points | null = null;
  let highlightId: number | null = null;
  let highlightPinned = false;
  let needsRender = true;
  /** Told to the host so the 2-D overlay can repaint in step with the camera. */
  let onHighlightChange: (() => void) | null = null;

  const perspective = new PerspectiveCamera(38, 1, 0.01, 10_000);
  const orthographic = new OrthographicCamera(-1, 1, 1, -1, -10_000, 10_000);

  const controls = new OrbitControls(perspective, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Panning must move the cluster across the view, not slide along the ground plane --
  // OrbitControls' default screenSpacePanning: false is for terrain, not for an object
  // you are turning over in your hands.
  controls.screenSpacePanning = true;
  controls.addEventListener("change", () => {
    needsRender = true;
  });

  function activeCamera(): PerspectiveCamera | OrthographicCamera {
    return mode === "3D" ? perspective : orthographic;
  }

  function cssSize(): { width: number; height: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height))
    };
  }

  function frameCameras(): void {
    const { width, height } = cssSize();
    const aspect = width / height;
    const distance = plotRadiusPc * CAMERA_DISTANCE_FACTOR;

    perspective.aspect = aspect;
    perspective.near = Math.max(0.01, distance / 100);
    perspective.far = distance * 20;
    perspective.updateProjectionMatrix();

    // The orthographic half-height matches what the perspective camera sees at the
    // cluster centre, so switching modes does not jump the apparent size.
    const halfHeight = plotRadiusPc;
    orthographic.left = -halfHeight * aspect;
    orthographic.right = halfHeight * aspect;
    orthographic.top = halfHeight;
    orthographic.bottom = -halfHeight;
    orthographic.updateProjectionMatrix();
  }

  function placeCameras(): void {
    const distance = plotRadiusPc * CAMERA_DISTANCE_FACTOR;
    perspective.position.set(distance * 0.42, distance * 0.32, distance * 0.85);
    perspective.lookAt(0, 0, 0);
    orthographic.position.set(0, 0, distance);
    orthographic.up.set(0, 1, 0);
    orthographic.lookAt(0, 0, 0);
    // OrbitControls zooms a PERSPECTIVE camera by moving it and an ORTHOGRAPHIC one by
    // changing camera.zoom. Repositioning alone therefore resets the first and silently
    // leaves the second wherever the reader left it, so "Reset view" only half worked.
    perspective.zoom = 1;
    orthographic.zoom = 1;
    perspective.updateProjectionMatrix();
    orthographic.updateProjectionMatrix();
  }

  function syncControls(): void {
    controls.object = activeCamera();
    // 2-D is the same scene seen from directly overhead. Rotating it would silently turn
    // it back into a 3-D view wearing a 2-D label.
    controls.enableRotate = mode === "3D";
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function buildPoints(): void {
    if (points) {
      scene.remove(points);
      points.geometry.dispose();
      points = null;
    }
    if (stars.length === 0) return;

    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const alphas = new Float32Array(stars.length);
    const colour = new Color();

    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;
      // setRGB expects 0..1 in the working colour space; three converts for us.
      colour.setRGB(star.rgb[0] / 255, star.rgb[1] / 255, star.rgb[2] / 255);
      colors[i * 3] = colour.r;
      colors[i * 3 + 1] = colour.g;
      colors[i * 3 + 2] = colour.b;
      sizes[i] = star.sizePx;
      alphas[i] = star.alpha;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new BufferAttribute(alphas, 1));
    points = new Points(geometry, material);
    // Additive blending has no depth order to respect, and sorting 20,000 points per
    // frame on the CPU is exactly the cost this renderer exists to avoid.
    points.frustumCulled = false;
    scene.add(points);
  }

  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uAttenuate: { value: 0 },
      uSizeScale: { value: SPRITE_SCALE },
      uReferenceDepth: { value: 1 }
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending
  });

  const projected = new Vector3();

  function project(star: SceneStar, width: number, height: number) {
    projected.set(star.x, star.y, star.z).project(activeCamera());
    return {
      x: ((projected.x + 1) / 2) * width,
      y: ((1 - projected.y) / 2) * height
    };
  }

  function render(): void {
    const { width, height } = cssSize();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    material.uniforms.uPixelRatio.value = pixelRatio;
    material.uniforms.uAttenuate.value = mode === "3D" ? 1 : 0;
    // Distance from the camera to what it is looking at, so the depth cue is normalised
    // to the cluster centre whatever the reader has done with the zoom.
    material.uniforms.uReferenceDepth.value = Math.max(
      0.001,
      perspective.position.distanceTo(controls.target)
    );
    renderer.render(scene, activeCamera());
  }

  let frame = 0;
  function loop(): void {
    frame = requestAnimationFrame(loop);
    // Damping keeps moving the camera for a few frames after the pointer stops, so the
    // loop has to keep drawing while it settles -- but only then.
    const moving = controls.enableDamping && controls.update();
    if (needsRender || moving) {
      needsRender = false;
      render();
      if (moving) onHighlightChange?.();
    }
  }
  frame = requestAnimationFrame(loop);

  frameCameras();
  placeCameras();
  syncControls();

  return {
    canvas,

    setStars(next, radiusPc) {
      stars = next;
      plotRadiusPc = Math.max(0.05, radiusPc);
      frameCameras();
      buildPoints();
      needsRender = true;
    },

    setMode(next) {
      if (next === mode) return;
      mode = next;
      placeCameras();
      frameCameras();
      syncControls();
      needsRender = true;
    },

    getMode: () => mode,

    setHighlight(id, pinned) {
      highlightId = id;
      highlightPinned = pinned;
      onHighlightChange?.();
    },

    getHighlight: () => ({ id: highlightId, pinned: highlightPinned }),

    onChange(handler: () => void) {
      onHighlightChange = handler;
      controls.addEventListener("change", handler);
    },

    projectAll() {
      const { width, height } = cssSize();
      activeCamera().updateMatrixWorld();
      const out: { id: number; x: number; y: number; radiusPx: number }[] = [];
      for (const star of stars) {
        const p = project(star, width, height);
        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) continue;
        out.push({ id: star.id, x: p.x, y: p.y, radiusPx: Math.max(2.5, star.sizePx * 0.8) });
      }
      return out;
    },

    parsecsPerPixel() {
      const { height } = cssSize();
      if (mode === "2D") {
        // OrbitControls zooms an orthographic camera through camera.zoom, not by moving
        // it, so a scale bar that ignores zoom keeps its label while the reader zooms
        // straight past it.
        return (orthographic.top - orthographic.bottom) / orthographic.zoom / height;
      }
      // At the cluster centre, which is what the scale bar is measuring.
      const distance = perspective.position.length();
      const visibleHeight = 2 * distance * Math.tan(((perspective.fov / 2) * Math.PI) / 180);
      return visibleHeight / height;
    },

    resetView() {
      placeCameras();
      syncControls();
      needsRender = true;
    },

    resize() {
      frameCameras();
      needsRender = true;
    },

    dispose() {
      cancelAnimationFrame(frame);
      controls.dispose();
      points?.geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}
