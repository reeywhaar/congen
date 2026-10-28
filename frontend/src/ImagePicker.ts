import { Dom } from "./Dom";
import { closeOnBackdropClick } from "./tools";

/**
 * Shows the images listed in the (hidden) source select as a grid in a dialog.
 * The select stays the source of truth: picking an image sets its value and
 * dispatches "change". Options carry their preview url in `data-thumb`.
 */
export class ImagePicker {
  onUpload?: () => void;
  onRemove?: (option: HTMLOptionElement) => Promise<void>;

  constructor(private dom: Dom) {
    dom.sourceButton.addEventListener("click", () => this.open());
    dom.source.addEventListener("change", () => {
      this.update();
      // an image dropped or pasted while the dialog is open shows up in it
      if (dom.imagePicker.open) this.render();
    });
    closeOnBackdropClick(dom.imagePicker);
  }

  update() {
    const option = this.dom.source.selectedOptions[0];
    if (!option) return;
    this.dom.sourceButtonThumb.src = option.dataset.thumb ?? "";
    this.dom.sourceButtonName.textContent = option.text;
  }

  private open() {
    this.render();
    this.dom.imagePicker.showModal();
    this.focusSelected();
  }

  private render() {
    this.dom.imagePickerGrid.replaceChildren(
      ...Array.from(this.dom.source.options).map((option) =>
        this.createItem(option),
      ),
      this.createUploadItem(),
    );
    if (this.dom.imagePicker.open) this.focusSelected();
  }

  private focusSelected() {
    this.dom.imagePickerGrid
      .querySelector<HTMLElement>("[aria-pressed=true]")
      ?.focus();
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
    if (option.dataset.custom !== "true") return item;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "image-picker__remove";
    remove.setAttribute("aria-label", `Remove ${option.text}`);
    remove.addEventListener("click", async () => {
      await this.onRemove?.(option);
      this.render();
    });

    const cell = document.createElement("div");
    cell.className = "image-picker__cell";
    cell.append(item, remove);
    return cell;
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
