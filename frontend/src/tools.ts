export function invariant(e: Error): never {
  throw e;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false,
): (...args: Parameters<T>) => void {
  var timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: any) {
    var context = this,
      args = arguments as unknown as any[];
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function randomInt(min: number, max: number, rng?: () => number) {
  const rand = rng ? rng() : Math.random();
  return Math.floor(rand * (max - min + 1)) + min;
}

export function* counter() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

export function* range(max: number) {
  for (let i = 0; i < max; i++) {
    yield i;
  }
}

export function* gmap<T, B>(it: IterableIterator<T>, fn: (x: T) => B) {
  for (let item of it) {
    yield fn(item);
  }
}

export function sleep(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}

export function ensureType<T>(v: T): T {
  return v;
}

export const createSortHandler = <T extends any>(
  weightsExtractor: (a: T) => number[],
) => {
  const cache = new Map<T, number[]>();
  return (a: T, b: T) => {
    if (!cache.has(a)) cache.set(a, weightsExtractor(a));
    if (!cache.has(b)) cache.set(b, weightsExtractor(b));

    const ak = cache.get(a)!;
    const bk = cache.get(b)!;

    for (let i = 0; i < ak.length; i++) {
      const p1 = ak[i];
      const p2 = bk[i];
      const r = p2 - p1;
      if (r !== 0) return r;
    }

    return 0;
  };
};

export function promptImage() {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve(input.files[0]);
      } else {
        resolve(null);
      }
      document.body.removeChild(input);
    };

    input.hidden = true;
    document.body.appendChild(input);

    input.click();
  });
}

export function readImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      if (image.width === 0 || image.height === 0) {
        reject(new Error(`Unable to get image ${url}`));
        return;
      }
      resolve(image);
    });
    image.addEventListener("error", (e) => {
      reject(new Error(`Unable to get image ${url}`));
    });
    image.src = url;
    setTimeout(() => {
      reject(new Error(`Unable to get image ${url}`));
    }, 2000);
  });
}

/**
 * Exposes a range input's value and its zero point as 0..1 fractions for CSS,
 * and shows the value in its `<output for="...">`.
 */
export function syncRange(input: HTMLInputElement) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const value = parseFloat(input.value);
  const fraction = (value: number) => (value - min) / (max - min);
  input.style.setProperty("--value", String(fraction(value)));
  input.style.setProperty(
    "--origin",
    String(fraction(Math.min(Math.max(0, min), max))),
  );

  const output = document.querySelector<HTMLOutputElement>(
    `output[for="${input.id}"]`,
  );
  if (output) {
    output.value = (value > 0 ? "+" : "") + value.toFixed(2).replace("-", "−");
  }
}

/*
 * Number fields are text inputs, so they always show a dot as the decimal separator
 * (number inputs follow the system locale). They're described by data attributes:
 * `data-min`, `data-max`, `data-decimals`, and either `data-step` (added or subtracted,
 * snapping to multiples of it) or `data-step-factor` (multiplied or divided by).
 */

/** Reads a decimal typed with either a dot or a comma. */
export function parseDecimal(value: string) {
  return parseFloat(value.replace(",", "."));
}

/** Clamps the value to the field's range and shows it with the field's decimals. */
export function setNumberField(input: HTMLInputElement, value: number) {
  const attr = (name: string, fallback: number) => {
    const parsed = parseFloat(input.dataset[name] ?? "");
    return Number.isNaN(parsed) ? fallback : parsed;
  };
  const clamped = Math.min(
    Math.max(value, attr("min", -Infinity)),
    attr("max", Infinity),
  );
  input.value = clamped.toFixed(attr("decimals", 0));
}

/** Re-formats what was typed; anything unreadable falls back to the default. */
export function normalizeNumberField(input: HTMLInputElement) {
  const value = parseDecimal(input.value);
  setNumberField(
    input,
    Number.isNaN(value) ? parseDecimal(input.defaultValue) : value,
  );
}

/**
 * Drops anything but digits, and a decimal separator if the field has decimals,
 * as it's typed or pasted, keeping the caret in place.
 */
export function filterNumberField(input: HTMLInputElement) {
  const disallowed =
    parseFloat(input.dataset.decimals ?? "0") > 0 ? /[^\d.,]/g : /\D/g;
  const caret = input.selectionStart ?? input.value.length;
  const before = input.value.slice(0, caret).replace(disallowed, "");
  const after = input.value.slice(caret).replace(disallowed, "");
  if (before + after === input.value) return;
  input.value = before + after;
  input.setSelectionRange(before.length, before.length);
}

/** Steps the field one step up (direction > 0) or down. */
export function stepNumberField(input: HTMLInputElement, direction: number) {
  const parsed = parseDecimal(input.value);
  const value = Number.isNaN(parsed)
    ? parseDecimal(input.defaultValue)
    : parsed;
  const factor = parseFloat(input.dataset.stepFactor ?? "");
  if (factor) {
    setNumberField(input, value * factor ** Math.sign(direction));
    return;
  }
  const step = parseFloat(input.dataset.step ?? "1");
  // the epsilon absorbs float error, so a value already on the grid moves a whole step
  const steps =
    direction > 0
      ? Math.floor(value / step + 1e-9) + 1
      : Math.ceil(value / step - 1e-9) - 1;
  setNumberField(input, steps * step);
}

/** Closes the dialog on clicks outside its content. Its body must fill it (no dialog padding). */
export function closeOnBackdropClick(dialog: HTMLDialogElement) {
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}
