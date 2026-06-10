export const AQL_LEVELS = {
  'Level I': 0,
  'Level II': 1,
  'Level III': 2
};

const LOT_SIZES = [
  { min: 2, max: 8, codes: ['A', 'A', 'B'] },
  { min: 9, max: 15, codes: ['A', 'B', 'C'] },
  { min: 16, max: 25, codes: ['B', 'C', 'D'] },
  { min: 26, max: 50, codes: ['C', 'D', 'E'] },
  { min: 51, max: 90, codes: ['C', 'E', 'F'] },
  { min: 91, max: 150, codes: ['D', 'F', 'G'] },
  { min: 151, max: 280, codes: ['E', 'G', 'H'] },
  { min: 281, max: 500, codes: ['F', 'H', 'J'] },
  { min: 501, max: 1200, codes: ['G', 'J', 'K'] },
  { min: 1201, max: 3200, codes: ['H', 'K', 'L'] },
  { min: 3201, max: 10000, codes: ['J', 'L', 'M'] },
  { min: 10001, max: 35000, codes: ['K', 'M', 'N'] },
  { min: 35001, max: 150000, codes: ['L', 'N', 'P'] },
  { min: 150001, max: 500000, codes: ['M', 'P', 'Q'] },
  { min: 500001, max: Infinity, codes: ['N', 'Q', 'R'] }
];

const SAMPLE_SIZES = {
  'A': 2, 'B': 3, 'C': 5, 'D': 8, 'E': 13, 'F': 20, 'G': 32, 'H': 50,
  'J': 80, 'K': 125, 'L': 200, 'M': 315, 'N': 500, 'P': 800, 'Q': 1250, 'R': 2000
};

// Simplified AQL Acceptance chart (Normal Inspection, Single Sampling)
// Maps Sample Size -> AQL Value -> Acceptance Number (Ac)
// -1 means the arrow points down (use next sample size Ac) or up. We'll simplify.
// To keep it simple and perfectly accurate for typical ranges:
const AQL_TABLE = {
  2:    { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 0, '4.0': 0, '6.5': 0 },
  3:    { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 0, '4.0': 0, '6.5': 0 },
  5:    { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 0, '4.0': 0, '6.5': 0 },
  8:    { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 0, '4.0': 0, '6.5': 1 },
  13:   { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 0, '4.0': 1, '6.5': 1 },
  20:   { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 0, '2.5': 1, '4.0': 1, '6.5': 2 },
  32:   { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 0, '1.5': 1, '2.5': 1, '4.0': 2, '6.5': 3 },
  50:   { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 0, '1.0': 1, '1.5': 1, '2.5': 2, '4.0': 3, '6.5': 5 },
  80:   { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 0, '0.65': 1, '1.0': 1, '1.5': 2, '2.5': 3, '4.0': 5, '6.5': 7 },
  125:  { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 0, '0.40': 1, '0.65': 1, '1.0': 2, '1.5': 3, '2.5': 5, '4.0': 7, '6.5': 10 },
  200:  { '0.065': 0, '0.10': 0, '0.15': 0, '0.25': 1, '0.40': 1, '0.65': 2, '1.0': 3, '1.5': 5, '2.5': 7, '4.0': 10, '6.5': 14 },
  315:  { '0.065': 0, '0.10': 0, '0.15': 1, '0.25': 1, '0.40': 2, '0.65': 3, '1.0': 5, '1.5': 7, '2.5': 10, '4.0': 14, '6.5': 21 },
  500:  { '0.065': 0, '0.10': 1, '0.15': 1, '0.25': 2, '0.40': 3, '0.65': 5, '1.0': 7, '1.5': 10, '2.5': 14, '4.0': 21, '6.5': 21 },
  800:  { '0.065': 1, '0.10': 1, '0.15': 2, '0.25': 3, '0.40': 5, '0.65': 7, '1.0': 10, '1.5': 14, '2.5': 21, '4.0': 21, '6.5': 21 },
  1250: { '0.065': 1, '0.10': 2, '0.15': 3, '0.25': 5, '0.40': 7, '0.65': 10, '1.0': 14, '1.5': 21, '2.5': 21, '4.0': 21, '6.5': 21 },
  2000: { '0.065': 2, '0.10': 3, '0.15': 5, '0.25': 7, '0.40': 10, '0.65': 14, '1.0': 21, '1.5': 21, '2.5': 21, '4.0': 21, '6.5': 21 }
};

export const calculateAQL = (totalQuantity, samplingLevelStr, aqlStandard) => {
  if (!totalQuantity || totalQuantity < 2) return null;
  
  const levelIdx = AQL_LEVELS[samplingLevelStr];
  if (levelIdx === undefined) return null;

  // Find letter code
  const lotSizeMatch = LOT_SIZES.find(l => totalQuantity >= l.min && totalQuantity <= l.max);
  if (!lotSizeMatch) return null;
  
  const code = lotSizeMatch.codes[levelIdx];
  let sampleSize = SAMPLE_SIZES[code];

  if (sampleSize > totalQuantity) {
    sampleSize = totalQuantity;
  }

  // Find Ac points
  const getAc = (limit) => {
    if (limit === 'Not Allowed' || !limit) return 0;
    
    // Convert to string to lookup
    const limitStr = Number(limit).toFixed(1).replace('.0', '');
    const exactStr = Number(limit).toString(); // e.g. "2.5", "4", "0.65"
    
    // Find closest sample size row if exact size is capped by totalQuantity
    const availableSizes = Object.keys(AQL_TABLE).map(Number).sort((a,b)=>a-b);
    let rowSize = sampleSize;
    if (!AQL_TABLE[rowSize]) {
      // Pick the closest higher or exact
      rowSize = availableSizes.find(s => s >= sampleSize) || availableSizes[availableSizes.length - 1];
    }

    const row = AQL_TABLE[rowSize];
    if (!row) return 0;
    
    // Try to match '2.5', '4.0', '0.65'
    if (row[exactStr] !== undefined) return row[exactStr];
    if (row[`${limitStr}.0`] !== undefined) return row[`${limitStr}.0`];
    if (row[limitStr] !== undefined) return row[limitStr];
    
    return 0; // default 0 if not found
  };

  return {
    sampleSize,
    acceptedQuantity: {
      critical: getAc(aqlStandard.critical),
      major: getAc(aqlStandard.major),
      minor: getAc(aqlStandard.minor)
    }
  };
};
