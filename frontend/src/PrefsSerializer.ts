import { Step } from "./Chain";
import { filters } from "./filters";
import { Prefs } from "./Prefs";
import { SerializableState } from "./SerializableState";

export class PrefsSerializer {
  serialize(prefs: Prefs): SerializableState {
    return {
      source: prefs.source,
      scale: prefs.scale,
      steps: prefs.steps,
      maskTileSize: prefs.maskTileSize,
    };
  }

  parse(data?: Record<string, any>): SerializableState | null {
    if (!data) return null;

    return {
      source: data.source,
      scale: typeof data.scale === "number" ? data.scale : undefined,
      steps: Array.isArray(data.steps)
        ? data.steps.flatMap((step) => this.parseStep(step) ?? [])
        : undefined,
      maskTileSize:
        typeof data.maskTileSize === "number" ? data.maskTileSize : undefined,
    };
  }

  private parseStep(data: any): Step | null {
    if (data?.type === "filter") {
      return filters.some((f) => f.name === data.name)
        ? { type: "filter", name: data.name }
        : null;
    }
    if (data?.type === "adjust") {
      const number = (x: unknown) => (typeof x === "number" ? x : 0);
      return {
        type: "adjust",
        brightness: number(data.brightness),
        contrast: number(data.contrast),
        saturation: number(data.saturation),
      };
    }
    return null;
  }
}
