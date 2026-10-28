import { Dom } from "./Dom";
import { filters } from "./filters";
import { formatSigned, syncRange } from "./tools";

export type AdjustStep = {
  type: "adjust";
  brightness: number;
  contrast: number;
  saturation: number;
};

export type Step = { type: "filter"; name: string } | AdjustStep;

const adjustKeys = ["brightness", "contrast", "saturation"] as const;

/**
 * The filters and adjustments applied to the texture, in order. Adjust and Filter
 * open a panel under the chain to add steps. An adjustment being edited is part of
 * `steps`, so it's previewed, until it's applied or cancelled.
 */
export class Chain {
  onChange?: () => void;
  private committed: Step[] = [];
  /** an index past the end of `committed` means a new adjustment */
  private editing: { index: number; step: AdjustStep } | null = null;

  constructor(private dom: Dom) {
    dom.chainAddAdjust.addEventListener("click", () =>
      this.editAdjust(this.committed.length),
    );
    dom.chainAddFilter.addEventListener("click", () =>
      this.showMenu(dom.chainFilters),
    );

    dom.chainFilterList.replaceChildren(
      ...filters.map((filter) => {
        const chip = this.createChip(filter.name);
        chip.addEventListener("click", () => {
          this.committed = [
            ...this.committed,
            { type: "filter", name: filter.name },
          ];
          this.update();
        });
        return chip;
      }),
    );

    for (const key of adjustKeys) {
      const input = dom[key];
      syncRange(input);
      input.addEventListener("input", () => {
        syncRange(input);
        if (!this.editing) return;
        this.editing.step[key] = parseFloat(input.value);
        // no render: the chip's label would change length, and rewrapping the chain moves the slider under the pointer
        this.onChange?.();
      });
    }

    dom.chainApply.addEventListener("click", () => {
      const { index, step } = this.editing!;
      // a new adjustment left at zero would do nothing
      if (
        index < this.committed.length ||
        adjustKeys.some((key) => step[key] !== 0)
      ) {
        this.committed = this.steps;
      }
      this.close();
    });
    dom.chainCancel.addEventListener("click", () => this.close());
    dom.chainRemove.addEventListener("click", () => {
      const { index } = this.editing!;
      this.committed = this.committed.filter((_, i) => i !== index);
      this.close();
    });
    dom.chainClose.addEventListener("click", () => this.close());
    dom.chainReset.addEventListener("click", () => {
      this.committed = [];
      this.close();
      this.update();
    });
    dom.chainMenu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    this.render();
  }

  get steps(): Step[] {
    if (!this.editing) return this.committed;
    const steps = [...this.committed];
    steps.splice(this.editing.index, 1, this.editing.step);
    return steps;
  }

  set(steps: Step[]) {
    this.committed = steps;
    this.render();
  }

  private editAdjust(index: number) {
    if (this.editing?.index === index) return;
    const current = this.committed[index];
    const step: AdjustStep =
      current?.type === "adjust"
        ? { ...current }
        : { type: "adjust", brightness: 0, contrast: 0, saturation: 0 };
    this.editing = { index, step };
    for (const key of adjustKeys) {
      this.dom[key].value = String(step[key]);
      syncRange(this.dom[key]);
    }
    this.showMenu(this.dom.chainAdjust);
    this.update();
  }

  private removeFilter(index: number) {
    this.committed = this.committed.filter((_, i) => i !== index);
    if (this.editing && index < this.editing.index) this.editing.index--;
    this.update();
  }

  private showMenu(panel: HTMLElement) {
    const { chainAdd, chainMenu, chainFilters, chainAdjust } = this.dom;
    chainAdd.hidden = true;
    chainMenu.hidden = false;
    chainFilters.hidden = panel !== chainFilters;
    chainAdjust.hidden = panel !== chainAdjust;
    this.dom.chainRemove.hidden =
      !this.editing || this.editing.index >= this.committed.length;
    panel.querySelector<HTMLElement>("button, input")?.focus();
  }

  /** An adjustment that wasn't applied is dropped. */
  private close() {
    const {
      chainAdd,
      chainAddAdjust,
      chainAddFilter,
      chainFilters,
      chainMenu,
    } = this.dom;
    const hadFocus = chainMenu.contains(document.activeElement);
    chainMenu.hidden = true;
    chainAdd.hidden = false;
    if (hadFocus)
      (chainFilters.hidden ? chainAddAdjust : chainAddFilter).focus();
    if (!this.editing) return;
    this.editing = null;
    this.update();
  }

  private update() {
    this.render();
    this.onChange?.();
  }

  private render() {
    const chips = this.steps.map((step, index) => {
      const chip = this.createChip(
        step.type === "filter" ? step.name : this.adjustLabel(step),
      );
      chip.classList.add("chain__step", `chain__step_${step.type}`);
      if (index === this.editing?.index) {
        chip.classList.add("chain__step_pending");
      }
      chip.dataset.index = String(index);
      chip.addEventListener("pointerdown", (e) => this.drag(e, chip));
      chip.addEventListener("click", () =>
        step.type === "filter"
          ? this.removeFilter(index)
          : this.editAdjust(index),
      );
      return chip;
    });
    this.dom.chain.replaceChildren(...chips);
    this.dom.chainReset.hidden = this.committed.length === 0;
  }

  /** A press that moves becomes a drag that reorders the chain; one that doesn't stays a click. */
  private drag(e: PointerEvent, chip: HTMLElement) {
    if (this.editing || e.button !== 0) return;
    const { chain } = this.dom;
    const start = { x: e.clientX, y: e.clientY };
    const from = Number(chip.dataset.index);
    const others = this.stepChips().filter((el) => el !== chip);
    const marker = document.createElement("div");
    marker.className = "chain__marker";
    let dragging = false;
    let to = from;

    const move = (e: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4) return;
        dragging = true;
        chip.classList.add("chain__step_dragging");
      }
      // chips wrap, so "before the pointer" is reading order: rows above, then the left half of its row
      to = others.filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.bottom < e.clientY ||
          (r.top <= e.clientY && r.left + r.width / 2 < e.clientX)
        );
      }).length;
      if (to === from) {
        marker.remove();
        return;
      }
      const next = others[to];
      const r = (next ?? others[others.length - 1]).getBoundingClientRect();
      const bounds = chain.getBoundingClientRect();
      const halfGap = parseFloat(getComputedStyle(chain).columnGap) / 2;
      const x = next ? r.left - halfGap : r.right + halfGap;
      marker.style.left = `${x - bounds.left}px`;
      marker.style.top = `${r.top - bounds.top}px`;
      marker.style.height = `${r.height}px`;
      chain.append(marker);
    };

    const end = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (!dragging) return;
      marker.remove();
      chip.classList.remove("chain__step_dragging");
      // the release would otherwise click the chip, removing or opening it
      const swallow = (e: Event) => e.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() =>
        window.removeEventListener("click", swallow, { capture: true }),
      );
      if (e.type === "pointercancel" || to === from) return;
      const order = others.map((el) => Number(el.dataset.index));
      order.splice(to, 0, from);
      this.committed = order.map((index) => this.committed[index]);
      this.update();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  private stepChips() {
    return Array.from(
      this.dom.chain.querySelectorAll<HTMLElement>(".chain__step"),
    );
  }

  private adjustLabel(step: AdjustStep) {
    const label = adjustKeys
      .filter((key) => step[key] !== 0)
      .map((key) => `${key[0]}${formatSigned(step[key])}`)
      .join(" ");
    return label || "adjust";
  }

  private createChip(label: string) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = label;
    return chip;
  }
}
