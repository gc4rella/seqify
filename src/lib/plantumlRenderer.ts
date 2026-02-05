const CHEERPJ_LOADER_URL = "https://cjrtnc.leaningtech.com/2.3/loader.js";
const PLANTUML_APP_PATH = "/app/plantuml-core.jar";
const PLANTUML_JAR_PATH = "/plantuml-core.jar";
const PLANTUML_JAR_JS_PATH = "/plantuml-core.jar.js";
const INIT_TIMEOUT_MS = 20000;
const RENDER_TIMEOUT_MS = 20000;

let initPromise: Promise<void> | null = null;
let assetsChecked = false;

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string) => {
  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
};

const ensureCheerpj = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!window.cheerpjRunMain || !window.cjCall) {
      await loadScript(CHEERPJ_LOADER_URL);
    }

    if (!window.cheerpjRunMain || !window.cjCall) {
      throw new Error("CheerpJ runtime failed to initialize.");
    }

    if (window.cheerpjInit) {
      await window.cheerpjInit();
    }

    if (!assetsChecked) {
      const jarRes = await fetch(PLANTUML_JAR_PATH, { method: "HEAD" }).catch(() => null);
      const jarJsRes = await fetch(PLANTUML_JAR_JS_PATH, { method: "HEAD" }).catch(() => null);
      if (!jarRes?.ok) {
        throw new Error("Missing PlantUML core assets.");
      }
      if (!jarJsRes?.ok) {
        throw new Error("Missing PlantUML core assets.");
      }

      assetsChecked = true;
    }

    const exitCode = await withTimeout(
      Promise.resolve(
        window.cheerpjRunMain("com.plantuml.api.cheerpj.v1.RunInit", PLANTUML_APP_PATH) as
          | Promise<number>
          | number
      ),
      INIT_TIMEOUT_MS,
      "PlantUML initialization"
    );

    if (typeof exitCode === "number" && exitCode !== 0) {
      throw new Error(`PlantUML initialization failed (exit code ${exitCode}).`);
    }
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
};

const extractError = (payload: string) => {
  const trimmed = payload.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as { error?: string; message?: string };
    return parsed.error || parsed.message || null;
  } catch {
    return null;
  }
};

export const renderPlantumlSvg = async (code: string, mode: "light" | "dark") => {
  await ensureCheerpj();

  const result = await withTimeout(
    Promise.resolve(
      window.cjCall!("com.plantuml.api.cheerpj.v1.Svg", "convert", mode, code) as
        | Promise<unknown>
        | unknown
    ),
    RENDER_TIMEOUT_MS,
    "PlantUML render"
  );
  const output = typeof result === "string" ? result : String(result ?? "");
  const trimmed = output.trim();

  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    return output;
  }

  const errorMessage = extractError(output);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  throw new Error("Failed to render diagram.");
};

export const PLANTUML_ASSET_HINT =
  "Add plantuml-core.jar and plantuml-core.jar.js to the public/ root (served at /plantuml-core.jar).";
