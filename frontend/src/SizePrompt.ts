import { Dom } from "./Dom";
import { LocalStorageManager } from "./LocalStorageManager";
import { closeOnBackdropClick } from "./tools";

/** A missing dimension means "use the screen size". */
type StoredSize = [number | null, number | null];

export class SizePrompt {
  private sizeLocalStorage = new LocalStorageManager<StoredSize | null>(
    "gen__size",
    (value) => JSON.stringify(value),
    (value) => (value ? JSON.parse(value) : null),
  );

  constructor(private dom: Dom) {
    closeOnBackdropClick(dom.sizeDialog);
  }

  /** Asks for the download size; empty fields fall back to the screen size. */
  prompt(
    screenWidth: number,
    screenHeight: number,
  ): Promise<[number, number] | null> {
    const { sizeDialog, sizeWidth, sizeHeight } = this.dom;
    const [storedWidth, storedHeight] = this.sizeLocalStorage.get() ?? [];
    sizeWidth.placeholder = `${screenWidth} (screen width)`;
    sizeHeight.placeholder = `${screenHeight} (screen height)`;
    sizeWidth.value = storedWidth ? String(storedWidth) : "";
    sizeHeight.value = storedHeight ? String(storedHeight) : "";

    sizeDialog.returnValue = "";
    sizeDialog.showModal();
    sizeWidth.select();

    return new Promise((resolve) => {
      sizeDialog.addEventListener(
        "close",
        () => {
          // returnValue is the submit button's value; Esc, × and the backdrop leave it empty
          if (sizeDialog.returnValue !== "download") {
            resolve(null);
            return;
          }
          const width = parseFloat(sizeWidth.value) || null;
          const height = parseFloat(sizeHeight.value) || null;
          this.sizeLocalStorage.set(width || height ? [width, height] : null);
          resolve([width ?? screenWidth, height ?? screenHeight]);
        },
        { once: true },
      );
    });
  }
}
