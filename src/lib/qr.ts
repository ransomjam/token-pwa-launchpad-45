const SIZE = 21;
const DATA_CODEWORDS = 16;
const EC_CODEWORDS = 10;
const MAX_BITS = DATA_CODEWORDS * 8;

const G15 = 0b10100110111;
const G15_MASK = 0b101010000010010;

const maskFunctions = [
  (row: number, col: number) => (row + col) % 2 === 0,
  (row: number) => row % 2 === 0,
  (_row: number, col: number) => col % 3 === 0,
  (row: number, col: number) => (row + col) % 3 === 0,
  (row: number, col: number) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  (row: number, col: number) => ((row * col) % 2 + (row * col) % 3) === 0,
  (row: number, col: number) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
  (row: number, col: number) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0,
];

const expTable: number[] = new Array(512);
const logTable: number[] = new Array(256);

(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    expTable[i] = x;
    logTable[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    expTable[i] = expTable[i - 255];
  }
})();

const gfMul = (a: number, b: number) => {
  if (a === 0 || b === 0) return 0;
  return expTable[(logTable[a] + logTable[b]) % 255];
};

const polynomialMultiply = (a: number[], b: number[]) => {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return result;
};

const generatorPolynomial = (ecCount: number) => {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    poly = polynomialMultiply(poly, [1, expTable[i]]);
  }
  return poly;
};

const calculateErrorCorrection = (data: number[], ecCount: number) => {
  const generator = generatorPolynomial(ecCount);
  const buffer = data.concat(new Array(ecCount).fill(0));

  for (let i = 0; i < data.length; i++) {
    const factor = buffer[i];
    if (factor === 0) continue;
    for (let j = 0; j < generator.length; j++) {
      buffer[i + j] ^= gfMul(generator[j], factor);
    }
  }

  return buffer.slice(data.length);
};

const bitsToBytes = (bits: number[]) => {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j++) {
      value = (value << 1) | (bits[i + j] ?? 0);
    }
    bytes.push(value);
  }
  return bytes;
};

const makeBitStream = (data: string) => {
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(data));
  const bits: number[] = [];
  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8);

  for (const byte of bytes) {
    pushBits(byte, 8);
  }

  if (bits.length > MAX_BITS) {
    throw new Error('Data too long for QR version 1');
  }

  const remaining = MAX_BITS - bits.length;
  const terminator = Math.min(4, remaining);
  for (let i = 0; i < terminator; i++) {
    bits.push(0);
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataBytes = bitsToBytes(bits);
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (dataBytes.length < DATA_CODEWORDS) {
    dataBytes.push(padBytes[padIndex % 2]);
    padIndex += 1;
  }

  const ecBytes = calculateErrorCorrection(dataBytes, EC_CODEWORDS);
  const finalBits: number[] = [];
  for (const byte of dataBytes.concat(ecBytes)) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((byte >> i) & 1);
    }
  }
  return finalBits;
};

const cloneMatrix = (matrix: (boolean | null)[][]) => matrix.map(row => row.slice());

const calculateFormatBits = (mask: number) => {
  const data = (0b00 << 3) | mask; // level M
  let value = data << 10;
  for (let i = 14; i >= 10; i--) {
    if (((value >> i) & 1) === 1) {
      value ^= G15 << (i - 10);
    }
  }
  const combined = ((data << 10) | (value & 0x3ff)) ^ G15_MASK;
  return combined;
};

const setFormatInfo = (matrix: (boolean | null)[][], mask: number) => {
  const formatBits = calculateFormatBits(mask);
  const positionsA: [number, number][] = [];
  for (let col = 0; col <= 8; col++) {
    if (col === 6) continue;
    positionsA.push([8, col]);
  }
  for (let row = 7; row >= 0; row--) {
    if (row === 6) continue;
    positionsA.push([row, 8]);
  }

  const positionsB: [number, number][] = [];
  for (let col = SIZE - 1; col >= SIZE - 8; col--) {
    positionsB.push([8, col]);
  }
  for (let row = SIZE - 7; row < SIZE; row++) {
    positionsB.push([row, 8]);
  }

  for (let i = 0; i < positionsA.length; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    const [row, col] = positionsA[i];
    matrix[row][col] = bit;
  }
  for (let i = 0; i < positionsB.length; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    const [row, col] = positionsB[i];
    matrix[row][col] = bit;
  }
};

const penaltyRule1 = (matrix: boolean[][]) => {
  let penalty = 0;
  for (const row of matrix) {
    let current = row[0];
    let count = 1;
    for (let col = 1; col < matrix.length; col++) {
      if (row[col] === current) {
        count += 1;
      } else {
        if (count >= 5) penalty += 3 + (count - 5);
        current = row[col];
        count = 1;
      }
    }
    if (count >= 5) penalty += 3 + (count - 5);
  }

  for (let col = 0; col < matrix.length; col++) {
    let current = matrix[0][col];
    let count = 1;
    for (let row = 1; row < matrix.length; row++) {
      if (matrix[row][col] === current) {
        count += 1;
      } else {
        if (count >= 5) penalty += 3 + (count - 5);
        current = matrix[row][col];
        count = 1;
      }
    }
    if (count >= 5) penalty += 3 + (count - 5);
  }
  return penalty;
};

const penaltyRule2 = (matrix: boolean[][]) => {
  let penalty = 0;
  for (let row = 0; row < matrix.length - 1; row++) {
    for (let col = 0; col < matrix.length - 1; col++) {
      const value = matrix[row][col];
      if (
        value === matrix[row][col + 1] &&
        value === matrix[row + 1][col] &&
        value === matrix[row + 1][col + 1]
      ) {
        penalty += 3;
      }
    }
  }
  return penalty;
};

const hasPattern = (sequence: boolean[], pattern: boolean[]) => {
  for (let i = 0; i <= sequence.length - pattern.length; i++) {
    let matched = true;
    for (let j = 0; j < pattern.length; j++) {
      if (sequence[i + j] !== pattern[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
};

const penaltyRule3 = (matrix: boolean[][]) => {
  const pattern1 = [true, false, true, true, true, false, true];
  const pattern2 = [false, true, false, false, false, true, false];
  let penalty = 0;

  for (const row of matrix) {
    if (hasPattern(row, pattern1) || hasPattern(row, pattern2)) {
      penalty += 40;
    }
  }

  const columnBuffer: boolean[] = new Array(matrix.length);
  for (let col = 0; col < matrix.length; col++) {
    for (let row = 0; row < matrix.length; row++) {
      columnBuffer[row] = matrix[row][col];
    }
    if (hasPattern(columnBuffer, pattern1) || hasPattern(columnBuffer, pattern2)) {
      penalty += 40;
    }
  }

  return penalty;
};

const penaltyRule4 = (matrix: boolean[][]) => {
  const total = matrix.length * matrix.length;
  let darkCount = 0;
  for (const row of matrix) {
    for (const value of row) {
      if (value) darkCount += 1;
    }
  }
  const ratio = (darkCount * 100) / total;
  const fivePercentSteps = Math.abs(ratio - 50) / 5;
  return Math.floor(fivePercentSteps) * 10;
};

const calculatePenalty = (matrix: boolean[][]) => {
  return penaltyRule1(matrix) + penaltyRule2(matrix) + penaltyRule3(matrix) + penaltyRule4(matrix);
};

const applyMask = (
  matrix: (boolean | null)[][],
  mask: number,
  functionModules: boolean[][],
) => {
  const fn = maskFunctions[mask];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (functionModules[row][col]) continue;
      const value = matrix[row][col];
      const shouldFlip = fn(row, col);
      matrix[row][col] = (value ?? false) !== shouldFlip;
    }
  }
};

const placeFinder = (
  matrix: (boolean | null)[][],
  functionModules: boolean[][],
  row: number,
  col: number,
) => {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const value = isBorder || isCenter;
      matrix[row + r][col + c] = value;
      functionModules[row + r][col + c] = true;
    }
  }
};

const reserveModule = (
  matrix: (boolean | null)[][],
  functionModules: boolean[][],
  row: number,
  col: number,
  value = false,
) => {
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
  matrix[row][col] = value;
  functionModules[row][col] = true;
};

const placeTimingPatterns = (
  matrix: (boolean | null)[][],
  functionModules: boolean[][],
) => {
  for (let col = 8; col < SIZE - 8; col++) {
    const value = col % 2 === 0;
    reserveModule(matrix, functionModules, 6, col, value);
  }
  for (let row = 8; row < SIZE - 8; row++) {
    const value = row % 2 === 0;
    reserveModule(matrix, functionModules, row, 6, value);
  }
};

const reserveFormatAreas = (
  matrix: (boolean | null)[][],
  functionModules: boolean[][],
) => {
  for (let i = 0; i < SIZE; i++) {
    if (i === 6) continue;
    reserveModule(matrix, functionModules, i, 8);
    reserveModule(matrix, functionModules, 8, i);
  }
  for (let i = 0; i < 7; i++) {
    reserveModule(matrix, functionModules, SIZE - 1 - i, 8);
  }
  for (let i = 0; i < 8; i++) {
    reserveModule(matrix, functionModules, 8, SIZE - 1 - i);
  }
};

const placeDataBits = (
  matrix: (boolean | null)[][],
  functionModules: boolean[][],
  bits: number[],
) => {
  let bitIndex = 0;
  let upward = true;

  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let rowOffset = 0; rowOffset < SIZE; rowOffset++) {
      const row = upward ? SIZE - 1 - rowOffset : rowOffset;
      for (let c = 0; c < 2; c++) {
        const targetCol = col - c;
        if (functionModules[row][targetCol]) continue;
        const bit = bits[bitIndex] ?? 0;
        matrix[row][targetCol] = bit === 1;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
};

export const generateQrMatrix = (data: string) => {
  const modules: (boolean | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const functionModules: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

  placeFinder(modules, functionModules, 0, 0);
  placeFinder(modules, functionModules, 0, SIZE - 7);
  placeFinder(modules, functionModules, SIZE - 7, 0);

  for (let i = 0; i < 7; i++) {
    reserveModule(modules, functionModules, i, 7);
    reserveModule(modules, functionModules, 7, i);
    reserveModule(modules, functionModules, SIZE - 1 - i, 7);
    reserveModule(modules, functionModules, SIZE - 8, i);
    reserveModule(modules, functionModules, i, SIZE - 8);
    reserveModule(modules, functionModules, 7, SIZE - 1 - i);
  }

  placeTimingPatterns(modules, functionModules);
  reserveFormatAreas(modules, functionModules);
  reserveModule(modules, functionModules, SIZE - 8, 8, true); // dark module

  const bits = makeBitStream(data);
  placeDataBits(modules, functionModules, bits);

  let bestMatrix: (boolean | null)[][] | null = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < maskFunctions.length; mask++) {
    const candidate = cloneMatrix(modules);
    applyMask(candidate, mask, functionModules);
    setFormatInfo(candidate, mask);
    const concrete = candidate.map(row => row.map(cell => cell ?? false));
    const penalty = calculatePenalty(concrete);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate;
    }
  }

  if (!bestMatrix) {
    throw new Error('Unable to build QR matrix');
  }

  return bestMatrix.map(row => row.map(cell => cell ?? false));
};
