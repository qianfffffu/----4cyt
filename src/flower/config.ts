export const FLOWER_CONFIG = {
  particleTargetDesktop: 48000,
  particleTargetMobile: 24000,
  pixelSize: 0.86,
  pixelGap: 0.12,
  growthDuration: 5.4,
  growthEasing: 'smoothstep',
  pointerRadius: 92,
  pointerForce: 54,
  pointerVelocityInfluence: 0.17,
  returnDuration: 0.95,
  pointerSampleLifetime: 0.95,
  backgroundTolerance: 25,
  edgeGradientLimit: 17,
  maskFeather: 2.2,
  // CSS-aligned pixels keep square particles crisp and avoid WebGL compositor offsets.
  maxDpr: 1,
  pointerSamples: 16,
} as const;

export const BACKGROUND_TOLERANCE = FLOWER_CONFIG.backgroundTolerance;
export const EDGE_GRADIENT_LIMIT = FLOWER_CONFIG.edgeGradientLimit;
export const TARGET_PARTICLE_COUNT = FLOWER_CONFIG.particleTargetDesktop;
export const MASK_FEATHER = FLOWER_CONFIG.maskFeather;
