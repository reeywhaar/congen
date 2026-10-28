import { Dom } from "./Dom";
import { SerializableState } from "./SerializableState";
import { Step } from "./Chain";
import { parseDecimal } from "./tools";

export class Prefs {
  source: string;
  maskTileSize: number;
  distribution: number;
  scale: number;
  steps: Step[];

  constructor(dom: Dom, steps: Step[]) {
    this.source = dom.source.value;
    this.maskTileSize = parseInt(dom.maskTileSize.value, 10) || 0;
    this.distribution = 0;
    this.scale = parseDecimal(dom.scale.value) || 1;
    this.steps = steps;
  }

  restore(state: SerializableState) {
    if (typeof state.source !== "undefined") this.source = state.source;
    if (typeof state.scale !== "undefined") this.scale = state.scale;
    if (typeof state.maskTileSize !== "undefined")
      this.maskTileSize = state.maskTileSize;
    if (typeof state.steps !== "undefined") this.steps = state.steps;
  }
}
