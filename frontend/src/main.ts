import * as tools from "./tools";
import { C } from "./ctools";
import { filters } from "./filters";
import images from "./list";
import { alea } from "seedrandom";
import { LocalStorageManager } from "./LocalStorageManager";
import { Database, DatabaseFile } from "./Database";
import { PrefsSerializer } from "./PrefsSerializer";
import { Prefs } from "./Prefs";
import { Dom } from "./Dom";
import { SerializableState } from "./SerializableState";
import { SizePrompt } from "./SizePrompt";
import { ImagePicker } from "./ImagePicker";
import { Chain } from "./Chain";

async function main() {
  const canvas = document.querySelector("canvas")!;
  const size = getSafeAreaSize();
  canvas.width = size.width;
  canvas.height = size.height;
  let seed = Math.random();

  const dom = new Dom();
  const imagePicker = new ImagePicker(dom);
  const sizePrompt = new SizePrompt(dom);
  const chain = new Chain(dom);

  const db = new Database();
  await db.initialize();

  const storedPrefsState = stateLocalStorage.get();
  if (storedPrefsState) {
    const prefs = new Prefs(dom, chain.steps);
    prefs.restore(storedPrefsState);

    tools.setNumberField(dom.scale, prefs.scale);
    tools.setNumberField(dom.maskTileSize, prefs.maskTileSize);
    chain.set(prefs.steps);
  }

  const update = tools.debounce(() => {
    stateLocalStorage.set(
      new PrefsSerializer().serialize(new Prefs(dom, chain.steps)),
    );
    const size = getSafeAreaSize();
    generate(canvas, size.width, size.height);
  }, 200);

  chain.onChange = update;

  dom.download.addEventListener("click", async () => {
    const ocanvas = new OffscreenCanvas(100, 100);
    const size = await sizePrompt.prompt(canvas.width, canvas.height);
    if (!size) return;
    const [width, height] = size;

    await generate(ocanvas, width, height);
    const blob = await ocanvas.convertToBlob({
      quality: 0.9,
      type: "image/jpeg",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "congen-texture.jpg";
    a.style.display = "none";
    a.href = url;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  [dom.scale, dom.maskTileSize].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if ((e as any).which === 71) e.preventDefault();
      if ((e as any).which === 13) {
        tools.normalizeNumberField(input);
        update();
      }
    });
    input.addEventListener("input", () => tools.filterNumberField(input));
    input.addEventListener("change", () => tools.normalizeNumberField(input));
  });

  [dom.scale, dom.maskTileSize].forEach((input) => {
    input.parentElement
      ?.querySelectorAll<HTMLButtonElement>(".stepper__button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          tools.stepNumberField(input, Number(button.dataset.direction));
          update();
        });
      });
    // arrow keys step the same way as the buttons
    input.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      tools.stepNumberField(input, e.key === "ArrowUp" ? 1 : -1);
      update();
    });
  });

  document.addEventListener("keydown", (e) => {
    // 71 is g
    if (e.which === 71) update();
  });

  window.addEventListener(
    "resize",
    tools.debounce((e) => {
      update();
    }, 200),
  );

  images.forEach((src) => {
    const opt = document.createElement("option");
    opt.value = src;
    opt.innerText = displayName(src.substring(src.lastIndexOf("/") + 1));
    opt.dataset.thumb = src.replace(/^img\//, "img/thumbs/");
    dom.source.appendChild(opt);
  });

  const droppedImages: Record<string, HTMLImageElement> = {};

  let selectedImage = [
    dom.source.selectedIndex,
    await tools.readImage(dom.source.options[dom.source.selectedIndex].value),
  ] as const;

  const selectChangeHandler = tools.debounce(
    async () => {
      const selectedOption = dom.source.options[dom.source.selectedIndex];
      const name = selectedOption.value;
      selectedImage = [
        dom.source.selectedIndex,
        selectedOption.dataset.custom === "true"
          ? droppedImages[name]
          : await tools.readImage(name),
      ];
      update();
    },
    100,
    true,
  );

  dom.source.addEventListener("change", selectChangeHandler);

  document.body.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  const addDatabaseFileToSelect = async (file: DatabaseFile) => {
    const url = URL.createObjectURL(file);
    const id = file.dbid;
    const image = await tools.readImage(url);

    droppedImages[id] = image;

    const selectItem = document.createElement("option");
    selectItem.value = id;
    selectItem.innerText = displayName(file.name);
    selectItem.dataset.custom = "true";
    selectItem.dataset.thumb = url;
    dom.source.appendChild(selectItem);
  };

  const addFile = async (file: File) => {
    const dbfile = await db.addImage(file);
    await addDatabaseFileToSelect(dbfile);
    dom.source.value = dbfile.dbid;
    dom.source.dispatchEvent(new Event("change"));
  };

  imagePicker.onRemove = async (option) => {
    await db.removeImage(option.value);
    URL.revokeObjectURL(option.dataset.thumb ?? "");
    delete droppedImages[option.value];
    const wasSelected = option.selected;
    option.remove();
    if (wasSelected) {
      dom.source.selectedIndex = 0;
      dom.source.dispatchEvent(new Event("change"));
    }
  };

  imagePicker.onUpload = async () => {
    const file = await tools.promptImage();
    if (file) addFile(file);
  };

  try {
    const images = await db.getImages();
    await Promise.all(images.map((file) => addDatabaseFileToSelect(file)));
  } catch (e) {
    console.warn(e);
  }

  if (storedPrefsState) {
    const prefs = new Prefs(dom, chain.steps);
    prefs.restore(storedPrefsState);
    if (prefs.source) {
      const ind = Array.from(dom.source.options).findIndex(
        (o) => o.value === prefs.source,
      );
      if (ind !== -1) {
        dom.source.selectedIndex = ind;
        dom.source.dispatchEvent(new Event("change"));
      }
    }
  }
  imagePicker.update();

  document.body.addEventListener("drop", async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;

    await addFile(file);
  });

  document.addEventListener("paste", async (e) => {
    const file = Array.from(e.clipboardData?.items ?? [])
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    e.preventDefault();
    // clipboard images are all called image.png
    const extension = file.name.match(/\.[^.]+$/)?.[0] ?? "";
    const name = (await tools.hashName(file)) + extension;
    await addFile(new File([file], name, { type: file.type }));
  });

  const generate = async (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number,
  ) => {
    const max = 20000;
    canvas.width = Math.min(width, max);
    canvas.height = Math.min(height, max);
    const prefs = new Prefs(dom, chain.steps);

    const rng = alea(String(seed));

    const c = new C(
      canvas.getContext("webgl", {
        preserveDrawingBuffer:
          location.search.indexOf("nopreserve") > -1 ? false : true,
      }) ?? tools.invariant(new Error("WebGL not supported")),
      rng,
    );

    const tileX = tools.randomInt(
      selectedImage[1].width * 0.2,
      selectedImage[1].width - prefs.maskTileSize,
      rng,
    );
    const tileY = tools.randomInt(
      selectedImage[1].height * 0.2,
      selectedImage[1].height - prefs.maskTileSize,
      rng,
    );

    let texture = await c.tile(c.createTexture(selectedImage[1]), {
      scale: prefs.scale,
      srcWidth: tileX,
      srcHeight: tileY,
      dstWidth: canvas.width + prefs.distribution * 2,
      dstHeight: canvas.height + prefs.distribution * 2,
    });
    if (prefs.maskTileSize > 0) {
      texture = c.maskTiles(
        texture,
        tileX * prefs.scale,
        tileY * prefs.scale,
        prefs.maskTileSize,
      );
    }
    if (prefs.distribution > 0) {
      texture = c.diffuse(texture, prefs.distribution);
    }
    for (const step of prefs.steps) {
      texture =
        step.type === "filter"
          ? c.convolve(
              texture,
              filters.find((filter) => filter.name === step.name)!.arr,
            )
          : c.adjust(texture, step.saturation, step.contrast, step.brightness);
    }
    c.render(texture, {
      srcX: prefs.distribution,
      srcY: -prefs.distribution,
    });
  };

  dom.generate.addEventListener("click", async (e) => {
    ++seed;
    generate(canvas, window.innerWidth, window.innerHeight);
  });

  dom.generate.click();
}

const stateLocalStorage = new LocalStorageManager<SerializableState | null>(
  "gen__state",
  (value) => JSON.stringify(value),
  (value) => new PrefsSerializer().parse(JSON.parse(value)),
);

function displayName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function getSafeAreaSize() {
  return document.body.getBoundingClientRect();
}

main().catch((e) => {
  console.error(e);
});
