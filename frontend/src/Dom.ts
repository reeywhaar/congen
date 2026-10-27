export class Dom {
  onChange?: () => void;

  private qs = <T extends Element = Element>(x: string) => {
    const el = document.querySelector<T>(x);
    if (!el) throw new Error("el is null");
    return el;
  };

  controls = this.qs<HTMLDivElement>(".controls");
  scale = this.qs<HTMLInputElement>(".zinput");
  source = this.qs<HTMLSelectElement>(".src");
  sourceButton = this.qs<HTMLButtonElement>(".src-button");
  sourceButtonThumb = this.qs<HTMLImageElement>(".src-button__thumb");
  sourceButtonName = this.qs<HTMLSpanElement>(".src-button__name");
  imagePicker = this.qs<HTMLDialogElement>(".image-picker");
  imagePickerGrid = this.qs<HTMLDivElement>(".image-picker__grid");
  sizeDialog = this.qs<HTMLDialogElement>(".size-dialog");
  sizeWidth = this.qs<HTMLInputElement>(".size-dialog__width");
  sizeHeight = this.qs<HTMLInputElement>(".size-dialog__height");
  appliedFilters = this.qs<HTMLDivElement>(".applied-filters");
  filterStack = this.qs<HTMLDivElement>(".filter-stack");
  generate = this.qs<HTMLButtonElement>(".genb");
  maskTileSize = this.qs<HTMLInputElement>(".mask-tiles__value");
  saturation = this.qs<HTMLInputElement>(".saturationInput");
  contrast = this.qs<HTMLInputElement>(".contrastInput");
  brightness = this.qs<HTMLInputElement>(".brightnessInput");
  download = this.qs<HTMLButtonElement>(".downloadb");

  addFilter(name: string) {
    const el = document.createElement("button");
    el.type = "button";
    el.innerText = name;
    el.classList.add("filter-item");
    el.addEventListener("click", (e) => {
      this.appliedFilters.removeChild(el);
      this.onChange?.();
    });
    this.appliedFilters.appendChild(el);
  }
}
