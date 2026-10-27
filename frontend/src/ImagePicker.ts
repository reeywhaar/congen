import { Dom } from "./Dom";
import { closeOnBackdropClick } from "./tools";

/**
 * Shows the images listed in the (hidden) source select as a grid in a dialog.
 * The select stays the source of truth: picking an image sets its value and
 * dispatches "change". Options carry their preview url in `data-thumb`.
 */
export class ImagePicker {
  onUpload?: () => void;

  constructor(private dom: Dom) {
    dom.sourceButton.addEventListener("click", () => this.open());
    dom.source.addEventListener("change", () => this.update());
    closeOnBackdropClick(dom.imagePicker);
  }

  update() {
    const option = this.dom.source.selectedOptions[0];
    if (!option) return;
    this.dom.sourceButtonThumb.src = option.dataset.thumb ?? "";
    this.dom.sourceButtonName.textContent = option.text;
  }

  private open() {
    const grid = this.dom.imagePickerGrid;
    grid.replaceChildren(
      ...Array.from(this.dom.source.options).map((option) =>
        this.createItem(option),
      ),
      this.createUploadItem(),
    );
    this.dom.imagePicker.showModal();
    grid.querySelector<HTMLElement>("[aria-pressed=true]")?.focus();
  }

  private createItem(option: HTMLOptionElement) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "image-picker__item";
    item.setAttribute("aria-pressed", String(option.selected));

    const thumb = document.createElement("img");
    thumb.className = "image-picker__thumb";
    thumb.alt = "";
    thumb.src = option.dataset.thumb ?? "";

    const name = document.createElement("span");
    name.className = "image-picker__name";
    name.textContent = option.text;

    item.append(thumb, name);
    item.addEventListener("click", () => {
      this.dom.imagePicker.close();
      if (option.selected) return;
      this.dom.source.value = option.value;
      this.dom.source.dispatchEvent(new Event("change"));
    });
    return item;
  }

  private createUploadItem() {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "image-picker__item image-picker__item_upload";

    const icon = document.createElement("span");
    icon.className = "image-picker__thumb";
    icon.textContent = "+";

    const name = document.createElement("span");
    name.className = "image-picker__name";
    name.textContent = "Upload image…";

    item.append(icon, name);
    item.addEventListener("click", () => {
      this.dom.imagePicker.close();
      this.onUpload?.();
    });
    return item;
  }
}
