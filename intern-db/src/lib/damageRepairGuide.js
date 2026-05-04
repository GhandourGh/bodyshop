/**
 * Phase 10 — Rule-based repair guidance: canonical damage_type → suggested parts & labor actions.
 * (YOLO class strings vary by model; map high-level damage_type for planning & UI.)
 */

export const DAMAGE_TYPES = ['dent', 'scratch', 'crack', 'paint', 'multiple'];

/** @type {Record<string, { label: string; parts: { name: string; note?: string }[]; actions: string[]; yoloHints?: string[] }>} */
export const damageRepairGuide = {
  dent: {
    label: 'Dent / panel deformation',
    yoloHints: ['dent', 'ding', 'deform'],
    parts: [
      { name: 'Body filler / putty', note: 'Per panel; feather edge' },
      { name: 'Glazing putty', note: 'Pinholes' },
      { name: 'Primer surfacer', note: '2K recommended' },
      { name: 'Flex additive', note: 'If plastic bumper' },
    ],
    actions: [
      'Assess PDR vs conventional',
      'Clean & degrease panel',
      'Pull / tap down high metal',
      'Fill, block sand, prime',
      'Color match & blend adjacent panels',
    ],
  },
  scratch: {
    label: 'Scratch / clearcoat damage',
    yoloHints: ['scratch', 'scuff', 'abrasion'],
    parts: [
      { name: 'Cutting compound', note: 'If clearcoat only' },
      { name: 'Fine sandpaper (P1500–P3000)', note: 'Wet sand' },
      { name: 'Basecoat / touch-up', note: 'Match OEM code' },
      { name: 'Clearcoat', note: 'Blend panel edge' },
    ],
    actions: [
      'Measure depth (clear vs base)',
      'Compound polish or sand & refinish',
      'Mask adjacent panels for blend',
      'Bake / flash per product data sheet',
    ],
  },
  crack: {
    label: 'Crack / glass / structural',
    yoloHints: ['crack', 'glass', 'lamp'],
    parts: [
      { name: 'Replacement glass / lens', note: 'If safety-critical' },
      { name: 'Urethane adhesive kit', note: 'Windshield bond' },
      { name: 'Structural adhesive / rivets', note: 'OEM procedure' },
    ],
    actions: [
      'Identify structural vs cosmetic',
      'Replace vs repair per OEM bulletin',
      'ADAS calibration if windshield/camera',
      'Document pre/post photos',
    ],
  },
  paint: {
    label: 'Paint / refinish',
    yoloHints: ['paint', 'fade', 'peel'],
    parts: [
      { name: 'OEM color basecoat', note: 'Mix to code' },
      { name: 'Clearcoat', note: 'HS or UHS' },
      { name: 'Reducer / hardener', note: 'Climate-specific' },
    ],
    actions: [
      'Substrate prep (wash, scuff, tack)',
      'Sealer if bare plastic/metal',
      'Spray base in coats; flash',
      'Clear and polish',
    ],
  },
  multiple: {
    label: 'Mixed / severe damage',
    yoloHints: ['multiple', 'severe'],
    parts: [
      { name: 'Panel assembly / skin', note: 'If beyond repair' },
      { name: 'Structural consumables', note: 'Weld-bond primer, cavity wax' },
      { name: 'Refinish bundle', note: 'Base + clear + blend' },
    ],
    actions: [
      'Full teardown inspection',
      'Structural measure / pull frame',
      'Section or replace panels per OEM',
      'Multi-stage refinish + reassembly',
      'Alignment & ADAS checks',
    ],
  },
};

/**
 * @param {string} damageType
 */
export function getGuideForDamageType(damageType) {
  const key = (damageType || '').toLowerCase();
  if (damageRepairGuide[key]) return { damageType: key, ...damageRepairGuide[key] };
  return { damageType: key || 'unknown', ...damageRepairGuide.dent, fallback: true };
}
