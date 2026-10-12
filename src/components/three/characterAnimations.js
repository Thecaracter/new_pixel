/**
 * Dimensions and baselines for 3D Stylized Characters
 */
export const CHARACTER_DIMENSIONS = {
  legHeight: 0.5,
  legRadius: 0.08,
  bodyHeight: 0.6,
  bodyWidth: 0.5,
  bodyDepth: 0.3,
  armRadius: 0.06,
  armHeight: 0.45,
  headRadius: 0.22,
  // Sitting baseline matches office chair & meeting chair heights
  sittingHipY: 0.48,
  standingHipY: 0.5,
};

/**
 * Calculate explicit positional baselines for standing vs sitting poses.
 * Sitting: pelvis/torso/head sit stably on chair; calves reach down to floor.
 * Standing: legs upright from ground (Y=0) to hip (Y=0.5).
 */
export function getCharacterBaselines(sitting = false) {
  const {
    sittingHipY,
    standingHipY,
    bodyHeight,
    headRadius,
  } = CHARACTER_DIMENSIONS;

  const hipY = sitting ? sittingHipY : standingHipY;
  const bodyCenterY = hipY + bodyHeight / 2;
  const shoulderY = hipY + bodyHeight - 0.08;
  const headCenterY = hipY + bodyHeight + headRadius + 0.04;

  return {
    hipY,
    bodyCenterY,
    shoulderY,
    headCenterY,
  };
}

/**
 * Reusable animation presets shared by all character instances.
 * Each preset adapts seamlessly to both standing and sitting poses.
 */
export const CHARACTER_ANIMATION_PRESETS = {
  idle: ({ t, sitting, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;
    const breath = 1 + Math.sin(t * 1.5) * 0.015;

    if (body) {
      body.scale.set(1, breath, 1);
    }
    if (head) {
      head.rotation.x = Math.sin(t * 1.2) * 0.02;
    }

    if (sitting) {
      // Resting naturally on thighs / lap
      if (leftArm) leftArm.rotation.set(-0.35, 0.05, 0.08);
      if (rightArm) rightArm.rotation.set(-0.35, -0.05, -0.08);
    } else {
      // Calm standing posture
      if (leftArm) leftArm.rotation.set(0, 0, 0.04);
      if (rightArm) rightArm.rotation.set(0, 0, -0.04);
      if (leftLeg) leftLeg.rotation.set(0, 0, 0);
      if (rightLeg) rightLeg.rotation.set(0, 0, 0);
    }
  },

  typing: ({ t, sitting, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;
    const tapL = Math.sin(t * 6.0) * 0.025;
    const tapR = Math.sin(t * 6.0 + Math.PI) * 0.025;
    const breath = 1 + Math.sin(t * 1.5) * 0.012;

    if (body) {
      body.scale.set(1, breath, 1);
      // Subtle natural forward posture towards desk when sitting
      body.rotation.x = sitting ? 0.03 : 0;
    }

    if (head) {
      // Focused gaze towards monitor/keyboard
      head.rotation.x = 0.14 + Math.sin(t * 1.4) * 0.015;
    }

    // Both arms reach forward towards desk surface / keyboard
    if (leftArm) {
      leftArm.rotation.set(-1.12 + tapL, 0.12, 0.12);
    }
    if (rightArm) {
      rightArm.rotation.set(-1.12 + tapR, -0.12, -0.12);
    }

    if (!sitting) {
      if (leftLeg) leftLeg.rotation.set(0, 0, 0);
      if (rightLeg) rightLeg.rotation.set(0, 0, 0);
    }
  },

  talking: ({ t, sitting, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;
    const gesture = Math.sin(t * 2.0) * 0.08;
    const breath = 1 + Math.sin(t * 1.5) * 0.012;

    if (body) {
      body.scale.set(1, breath, 1);
    }

    if (head) {
      // Natural nodding and listening during discussion
      head.rotation.set(
        Math.sin(t * 2.2) * 0.04,
        Math.sin(t * 1.5) * 0.06,
        0
      );
    }

    if (sitting) {
      // Right hand explaining, left hand relaxed on lap
      if (rightArm) rightArm.rotation.set(-0.62 + gesture, 0, -0.18);
      if (leftArm) leftArm.rotation.set(-0.35, 0.05, 0.08);
    } else {
      // Standing discussion gestures
      if (rightArm) rightArm.rotation.set(-0.65 + gesture, 0, -0.2);
      if (leftArm) leftArm.rotation.set(-0.15, 0, 0.06);
      if (leftLeg) leftLeg.rotation.set(0, 0, 0.02);
      if (rightLeg) rightLeg.rotation.set(0, 0, -0.02);
    }
  },

  walking: ({ t, sitting, isWalking, baselines, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;

    if (sitting) {
      // Seated characters must NOT perform a walk cycle or elevate body
      if (body) {
        body.position.y = baselines.bodyCenterY;
        body.scale.set(1, 1 + Math.sin(t * 1.5) * 0.012, 1);
      }
      if (head) {
        head.rotation.y = Math.sin(t * 1.5) * 0.03;
      }
      if (leftArm) leftArm.rotation.set(-0.35, 0.05, 0.08);
      if (rightArm) rightArm.rotation.set(-0.4, 0, -0.05);
      return;
    }

    // Standing walker logic
    if (!isWalking) {
      if (leftLeg) leftLeg.rotation.set(0, 0, 0);
      if (rightLeg) rightLeg.rotation.set(0, 0, 0);
      if (leftArm) leftArm.rotation.set(0, 0, 0.04);
      if (rightArm) rightArm.rotation.set(-0.35, 0, -0.05);
      if (body) body.position.y = baselines.bodyCenterY;
      if (head) head.rotation.set(0, 0, 0);
    } else {
      const walkSpeed = 4.2;
      const swingLeg = Math.sin(t * walkSpeed) * 0.32;
      const swingArm = Math.sin(t * walkSpeed) * 0.28;

      if (leftLeg) leftLeg.rotation.x = swingLeg;
      if (rightLeg) rightLeg.rotation.x = -swingLeg;

      if (leftArm) leftArm.rotation.x = -swingArm;
      if (rightArm) rightArm.rotation.set(-0.4, 0, -0.05);

      if (body) {
        body.position.y = baselines.bodyCenterY + Math.abs(Math.sin(t * walkSpeed)) * 0.02;
      }
      if (head) {
        head.rotation.y = Math.sin(t * (walkSpeed / 2)) * 0.03;
      }
    }
  },

  writing: ({ t, sitting, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;
    const writeWave = Math.sin(t * 2.5) * 0.035;

    if (body) {
      body.scale.set(1, 1 + Math.sin(t * 1.5) * 0.012, 1);
    }

    if (sitting) {
      // Writing in notebook on desk
      if (head) head.rotation.x = 0.16 + Math.sin(t * 1.5) * 0.015;
      if (rightArm) rightArm.rotation.set(-1.1 + writeWave, -0.1, -0.12);
      if (leftArm) leftArm.rotation.set(-0.75, 0.1, 0.12);
    } else {
      // Writing on whiteboard
      if (head) head.rotation.x = 0.08 + Math.sin(t * 1.5) * 0.015;
      if (rightArm) rightArm.rotation.set(-1.3 + writeWave, Math.cos(t * 2.0) * 0.04, -0.1);
      if (leftArm) leftArm.rotation.set(0, 0, 0.06);
      if (leftLeg) leftLeg.rotation.set(0, 0, 0);
      if (rightLeg) rightLeg.rotation.set(0, 0, 0);
    }
  },

  phone: ({ t, sitting, refs }) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg } = refs;
    const breath = 1 + Math.sin(t * 1.5) * 0.012;

    if (body) {
      body.scale.set(1, breath, 1);
    }

    // Right arm holds phone up to ear stably
    if (rightArm) {
      rightArm.rotation.set(-2.0, -0.2, -0.45);
    }

    // Head tilts gently towards phone
    if (head) {
      head.rotation.set(0.04, 0, -0.1 + Math.sin(t * 1.2) * 0.02);
    }

    if (sitting) {
      // Left arm rests stably on lap / desk
      if (leftArm) leftArm.rotation.set(-0.35, 0.05, 0.1);
    } else {
      // Left arm hangs relaxed at side
      if (leftArm) leftArm.rotation.set(-0.25, 0, 0.08);
      if (leftLeg) leftLeg.rotation.set(0, 0, 0);
      if (rightLeg) rightLeg.rotation.set(0, 0, 0);
    }
  },
};
