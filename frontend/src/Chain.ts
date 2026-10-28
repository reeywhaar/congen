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

type Editing =
  /** an index past the end of `committed` means a new adjustment */
  | { type: "adjust"; index: number; step: AdjustStep }
  /** picked filters go after the committed steps, in the order they were picked */
  | { type: "filters"; names: string[] };

const adjustKeys = ["brightness", "contrast", "saturation"] as const;

/**
 * The filters and adjustments applied to the texture, in order. Adjust and Filter
 * open a panel under the chain to add steps. What's being edited is part of
 * `steps`, so it's previewed, until it's applied or cancelled.
 */
export class Chain {
  onChange?: () => void;
  private committed: Step[] = [];
  private editing: Editing | null = null;
  private pickerChips: HTMLButtonElement[];

  constructor(private dom: Dom) {
    dom.chainAddAdjust.addEventListener("click", () =>
      this.editAdjust(this.committed.length),
    );
    dom.chainAddFilter.addEventListener("click", () => {
      this.editing = { type: "filters", names: [] };
      this.showMenu(dom.chainFilters);
      this.render();
    });

    this.pickerChips = filters.map((filter) => {
      const chip = this.createChip(filter.name);
      chip.addEventListener("click", () => this.togglePick(filter.name));
      return chip;
    });
    dom.chainFilters.replaceChildren(...this.pickerChips);

    for (const key of adjustKeys) {
      const input = dom[key];
      syncRange(input);
      input.addEventListener("input", () => {
        syncRange(input);
        if (this.editing?.type !== "adjust") return;
        this.editing.step[key] = parseFloat(input.value);
        this.update();
      });
    }

    dom.chainApply.addEventListener("click", () => {
      const editing = this.editing;
      // a new adjustment left at zero would do nothing
      const isEmptyAdjust =
        editing?.type === "adjust" &&
        editing.index >= this.committed.length &&
        adjustKeys.every((key) => editing.step[key] === 0);
      if (!isEmptyAdjust) this.committed = this.steps;
      this.close();
    });
    dom.chainCancel.addEventListener("click", () => this.close());
    dom.chainRemove.addEventListener("click", () => {
      if (this.editing?.type !== "adjust") return;
      const { index } = this.editing;
      this.committed = this.committed.filter((_, i) => i !== index);
      this.close();
    });
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
    if (this.editing?.type === "adjust") {
      const steps = [...this.committed];
      steps.splice(this.editing.index, 1, this.editing.step);
      return steps;
    }
    if (this.editing?.type === "filters") {
      return [
        ...this.committed,
        ...this.editing.names.map((name): Step => ({ type: "filter", name })),
      ];
    }
    return this.committed;
  }

  set(steps: Step[]) {
    this.committed = steps;
    this.render();
  }

  private editAdjust(index: number) {
    if (this.editing?.type === "adjust" && this.editing.index === index) return;
    const current = this.committed[index];
    const step: AdjustStep =
      current?.type === "adjust"
        ? { ...current }
        : { type: "adjust", brightness: 0, contrast: 0, saturation: 0 };
    this.editing = { type: "adjust", index, step };
    for (const key of adjustKeys) {
      this.dom[key].value = String(step[key]);
      syncRange(this.dom[key]);
    }
    this.showMenu(this.dom.chainAdjust);
    this.update();
  }

  private togglePick(name: string) {
    if (this.editing?.type !== "filters") return;
    const { names } = this.editing;
    this.editing.names = names.includes(name)
      ? names.filter((x) => x !== name)
      : [...names, name];
    this.update();
  }

  private removeFilter(index: number) {
    const pick = index - this.committed.length;
    if (this.editing?.type === "filters" && pick >= 0) {
      this.togglePick(this.editing.names[pick]);
      return;
    }
    this.committed = this.committed.filter((_, i) => i !== index);
    if (this.editing?.type === "adjust" && index < this.editing.index) {
      this.editing.index--;
    }
    this.update();
  }

  private showMenu(panel: HTMLElement) {
    const { chainAdd, chainMenu, chainFilters, chainAdjust } = this.dom;
    chainAdd.hidden = true;
    chainMenu.hidden = false;
    chainFilters.hidden = panel !== chainFilters;
    chainAdjust.hidden = panel !== chainAdjust;
    this.dom.chainRemove.hidden = !(
      this.editing?.type === "adjust" &&
      this.editing.index < this.committed.length
    );
    panel.querySelector<HTMLElement>("button, input")?.focus();
  }

  /** Whatever wasn't applied is dropped. */
  private close() {
    const { chainAdd, chainAddAdjust, chainAddFilter, chainMenu } = this.dom;
    const hadFocus = chainMenu.contains(document.activeElement);
    chainMenu.hidden = true;
    chainAdd.hidden = false;
    if (hadFocus) {
      (this.editing?.type === "filters"
        ? chainAddFilter
        : chainAddAdjust
      ).focus();
    }
    if (!this.editing) return;
    this.editing = null;
    this.update();
  }

  private update() {
    this.render();
    this.onChange?.();
  }

  private isPending(index: number) {
    if (this.editing?.type === "adjust") return index === this.editing.index;
    return this.editing?.type === "filters" && index >= this.committed.length;
  }

  private render() {
    const chips = this.steps.map((step, index) => {
      const chip = this.createChip(
        step.type === "filter" ? step.name : this.adjustLabel(step),
      );
      chip.classList.add("chain__step", `chain__step_${step.type}`);
      if (this.isPending(index)) chip.classList.add("chain__step_pending");
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

    const picked = this.editing?.type === "filters" ? this.editing.names : [];
    this.pickerChips.forEach((chip, i) => {
      chip.setAttribute(
        "aria-pressed",
        String(picked.includes(filters[i].name)),
      );
    });
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
      .map((key) => `${key[0]} ${formatSigned(step[key])}`)
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
