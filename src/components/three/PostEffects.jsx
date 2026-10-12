import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function PostEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.82}
        luminanceSmoothing={0.3}
        intensity={0.45}
        radius={0.5}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.35} />
    </EffectComposer>
  );
}

export default PostEffects;
