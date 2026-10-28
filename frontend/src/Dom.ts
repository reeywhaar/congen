export class Dom {
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
  chain = this.qs<HTMLDivElement>(".chain");
  chainAdd = this.qs<HTMLDivElement>(".chain-add");
  chainAddAdjust = this.qs<HTMLButtonElement>(".chain-add__adjust");
  chainAddFilter = this.qs<HTMLButtonElement>(".chain-add__filter");
  chainReset = this.qs<HTMLButtonElement>(".chain-reset");
  chainMenu = this.qs<HTMLDivElement>(".chain-menu");
  chainFilters = this.qs<HTMLDivElement>(".chain-menu__filters");
  chainAdjust = this.qs<HTMLDivElement>(".chain-menu__adjust");
  chainApply = this.qs<HTMLButtonElement>(".chain-menu__apply");
  chainCancel = this.qs<HTMLButtonElement>(".chain-menu__cancel");
  chainRemove = this.qs<HTMLButtonElement>(".chain-menu__remove");
  generate = this.qs<HTMLButtonElement>(".genb");
  maskTileSize = this.qs<HTMLInputElement>(".mask-tiles__value");
  saturation = this.qs<HTMLInputElement>(".saturationInput");
  contrast = this.qs<HTMLInputElement>(".contrastInput");
  brightness = this.qs<HTMLInputElement>(".brightnessInput");
  download = this.qs<HTMLButtonElement>(".downloadb");
}
