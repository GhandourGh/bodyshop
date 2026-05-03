export type DamageType = 'dent' | 'scratch' | 'crack' | 'paint' | 'multiple'

export interface DamageGuideEntry {
  label: string
  parts: { name: string; note?: string }[]
  actions: string[]
  yoloHints: string[]
}

export const damageGuide: Record<DamageType, DamageGuideEntry> = {
  dent: {
    label: 'Dent / Panel Deformation',
    yoloHints: ['dent', 'ding', 'deform'],
    parts: [
      { name: 'Body filler / putty', note: 'Per panel; feather edge' },
      { name: 'Glazing putty', note: 'Pinholes' },
      { name: 'Primer surfacer', note: '2K recommended' },
      { name: 'Flex additive', note: 'If plastic bumper' },
      { name: 'Sandpaper P80–P400', note: 'Block sanding' },
    ],
    actions: [
      'Assess PDR vs conventional repair',
      'Clean & degrease panel',
      'Pull / tap down high metal',
      'Fill, block sand, prime',
      'Color match & blend adjacent panels',
    ],
  },
  scratch: {
    label: 'Scratch / Clearcoat Damage',
    yoloHints: ['scratch', 'scuff', 'abrasion'],
    parts: [
      { name: 'Cutting compound', note: 'If clearcoat only' },
      { name: 'Fine sandpaper P1500–P3000', note: 'Wet sand' },
      { name: 'Basecoat / touch-up', note: 'Match OEM code' },
      { name: 'Clearcoat', note: 'Blend panel edge' },
      { name: 'Polish & wax', note: 'Final finish' },
    ],
    actions: [
      'Measure scratch depth (clear vs base)',
      'Compound polish or wet sand & refinish',
      'Mask adjacent panels for blend',
      'Apply base + clear, bake per data sheet',
      'Final machine polish',
    ],
  },
  crack: {
    label: 'Crack / Glass / Structural',
    yoloHints: ['crack', 'glass', 'lamp'],
    parts: [
      { name: 'Replacement glass / lens', note: 'If safety-critical' },
      { name: 'Urethane adhesive kit', note: 'Windshield bond' },
      { name: 'Structural adhesive / rivets', note: 'OEM procedure' },
      { name: 'Primer & sealer', note: 'Corrosion protection' },
    ],
    actions: [
      'Identify structural vs cosmetic crack',
      'Replace vs repair per OEM bulletin',
      'ADAS calibration if windshield/camera affected',
      'Apply corrosion protection on bare metal',
      'Document pre/post photos for insurance',
    ],
  },
  paint: {
    label: 'Paint / Refinish',
    yoloHints: ['paint', 'fade', 'peel'],
    parts: [
      { name: 'Basecoat (OEM color code)', note: 'Exact match required' },
      { name: 'Clearcoat 2K', note: 'UV-resistant' },
      { name: 'Primer surfacer', note: 'Adhesion layer' },
      { name: 'Masking tape & paper', note: 'Protect adjacent panels' },
      { name: 'Solvent / thinners', note: 'Per manufacturer ratio' },
    ],
    actions: [
      'Identify paint code from VIN plate',
      'Wet sand & degrease surface',
      'Apply primer, let cure',
      'Apply basecoat in 2–3 coats',
      'Apply clearcoat, bake at 60°C',
      'Polish & inspect color match',
    ],
  },
  multiple: {
    label: 'Multiple / Combined Damage',
    yoloHints: ['multiple', 'complex'],
    parts: [
      { name: 'Full panel repair kit', note: 'As assessed per zone' },
      { name: 'Body filler + primer', note: 'Deformed sections' },
      { name: 'Replacement glass / trim', note: 'If cracked/broken' },
      { name: 'Basecoat + clearcoat', note: 'Full refinish' },
      { name: 'Structural adhesive', note: 'If load-bearing' },
    ],
    actions: [
      'Perform full damage assessment per zone',
      'Prioritize structural repairs first',
      'Address dents before paint work',
      'Replace broken components (glass, lamps)',
      'Refinish all affected panels',
      'Final quality check & customer review',
    ],
  },
}

export function getGuide(damageType: string): DamageGuideEntry | null {
  return damageGuide[damageType as DamageType] ?? null
}
