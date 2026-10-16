// Prepares the on-device face-tracking assets so webcam control works offline.
// Runs automatically after `npm install` (postinstall). It:
//   1. copies the MediaPipe tasks-vision WASM runtime out of node_modules into
//      public/mediapipe/wasm (served to the browser at /mediapipe/wasm), and
//   2. downloads the Face Landmarker model into public/mediapipe once.
// These assets are gitignored (WASM is ~32 MB) and recreated on each install,
// so nothing heavy lives in the repo and nothing is fetched at runtime.
import { cp, mkdir, access, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const wasmSrc = join(here, "..", "node_modules", "@mediapipe", "tasks-vision", "wasm");
const destDir = join(here, "..", "public", "mediapipe");
const wasmDest = join(destDir, "wasm");
const modelDest = join(destDir, "face_landmarker.task");
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const exists = async (p) => access(p).then(() => true).catch(() => false);

async function copyWasm() {
  if (!(await exists(wasmSrc))) {
    console.warn("[mediapipe] WASM not found in node_modules; skipping copy.");
    return;
  }
  await mkdir(wasmDest, { recursive: true });
  await cp(wasmSrc, wasmDest, { recursive: true });
  console.log("[mediapipe] Copied WASM runtime -> public/mediapipe/wasm");
}

async function downloadModel() {
  if (await exists(modelDest)) {
    console.log("[mediapipe] Model already present; skipping download.");
    return;
  }
  await mkdir(destDir, { recursive: true });
  console.log("[mediapipe] Downloading Face Landmarker model (~3.8 MB)...");
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  await new Promise((resolve, reject) => {
    const file = createWriteStream(modelDest);
    Readable.fromWeb(res.body).pipe(file).on("finish", resolve).on("error", reject);
  });
  const { size } = await stat(modelDest);
  console.log(`[mediapipe] Saved model (${(size / 1e6).toFixed(1)} MB).`);
}

try {
  await copyWasm();
  await downloadModel();
} catch (err) {
  console.warn(
    `[mediapipe] Setup incomplete: ${err.message}\n` +
      "Webcam control needs these assets. Re-run with: npm run setup:mediapipe",
  );
}
