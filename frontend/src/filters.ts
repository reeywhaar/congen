export type Filter = {
  name: string;
  arr: Float32Array;
};

// 3x3 convolution kernels; each is divided by its sum when applied, so only the proportions matter
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
    name: "blur box",
    // prettier-ignore
    arr: new Float32Array([
      1, 1, 1,
      1, 1, 1,
      1, 1, 1,
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
    name: "sharpen diag",
    // prettier-ignore
    arr: new Float32Array([
       9, -1, -1,
      -1,  1,  0,
      -1, -1, -1,
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
    name: "knit",
    // prettier-ignore
    arr: new Float32Array([
      -2,  4, -2,
       4, -2,  4,
      -2,  4, -2,
    ]),
  },
];
