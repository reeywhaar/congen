import { Step } from "./Chain";

export type SerializableState = {
  source?: string;
  scale?: number;
  steps?: Step[];
  maskTileSize?: number;
};
