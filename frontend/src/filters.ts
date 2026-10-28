export type Filter = {
  name: string;
  arr: Float32Array;
};

// 3x3 or 5x5 convolution kernels; each is divided by its sum when applied, so only the proportions matter
export const filters: Filter[] = [
  {
    name: "blur",
    // prettier-ignore
    arr: new Float32Array([
      1, 2, 1,
      2, 4, 2,
      1, 2, 1,
    ]),
  },
  {
    name: "blur x2",
    // prettier-ignore
    arr: new Float32Array([
      1,  4,  6,  4, 1,
      4, 16, 24, 16, 4,
      6, 24, 36, 24, 6,
      4, 16, 24, 16, 4,
      1,  4,  6,  4, 1,
    ]),
  },
  {
    name: "blur box",
    // prettier-ignore
    arr: new Float32Array([
      1, 1, 1,
      1, 1, 1,
      1, 1, 1,
    ]),
  },
  {
    name: "blur h",
    // prettier-ignore
    arr: new Float32Array([
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      1, 1, 1, 1, 1,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
    ]),
  },
  {
    name: "blur v",
    // prettier-ignore
    arr: new Float32Array([
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
    ]),
  },
  {
    name: "blur diag",
    // prettier-ignore
    arr: new Float32Array([
       4, -1,  0,
      -1,  1, -1,
       0, -1,  4,
    ]),
  },
  {
    name: "blur diag x2",
    // prettier-ignore
    arr: new Float32Array([
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
      0, 0, 0, 0, 1,
    ]),
  },
  {
    name: "sharpen",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1, -1,
      -1, 16, -1,
      -1, -1, -1,
    ]),
  },
  {
    name: "sharpen x2",
    // prettier-ignore
    arr: new Float32Array([
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0,
    ]),
  },
  {
    name: "sharpen x3",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1,
    ]),
  },
  {
    name: "sharpen wide",
    // prettier-ignore
    arr: new Float32Array([
      -1,  -4,  -6,  -4, -1,
      -4, -16, -24, -16, -4,
      -6, -24, 476, -24, -6,
      -4, -16, -24, -16, -4,
      -1,  -4,  -6,  -4, -1,
    ]),
  },
  {
    name: "sharpen diag",
    // prettier-ignore
    arr: new Float32Array([
       9, -1, -1,
      -1,  1,  0,
      -1, -1, -1,
    ]),
  },
  {
    name: "emboss x1/2",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1,  0,
      -1,  2,  1,
       0,  1,  1,
    ]),
  },
  {
    name: "emboss",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1,  0,
      -1,  1,  1,
       0,  1,  1,
    ]),
  },
  {
    name: "emboss x2",
    // prettier-ignore
    arr: new Float32Array([
      -2, -1,  0,
      -1,  1,  1,
       0,  1,  2,
    ]),
  },
  {
    name: "emboss x3",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1, -1, -1,  0,
      -1, -1, -1,  0,  1,
      -1, -1,  1,  1,  1,
      -1,  0,  1,  1,  1,
       0,  1,  1,  1,  1,
    ]),
  },
  {
    name: "emboss h",
    // prettier-ignore
    arr: new Float32Array([
      -1, -1, -1,
       0,  1,  0,
       1,  1,  1,
    ]),
  },
  {
    name: "knit",
    // prettier-ignore
    arr: new Float32Array([
      -2,  4, -2,
       4, -2,  4,
      -2,  4, -2,
    ]),
  },
  {
    name: "grit",
    // prettier-ignore
    arr: new Float32Array([
       1, -2,  1,
      -2,  5, -2,
       1, -2,  1,
    ]),
  },
];
