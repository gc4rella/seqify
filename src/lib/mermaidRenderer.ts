type MermaidMode = "light" | "dark";
type MermaidTheme = "default" | "dark";

let activeTheme: MermaidTheme | null = null;
let mermaidPromise: Promise<import("mermaid").default> | null = null;

const loadMermaid = async () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((module) => module.default);
  }
  return mermaidPromise;
};

const getTheme = (mode: MermaidMode): MermaidTheme => (mode === "dark" ? "dark" : "default");

const ensureInitialized = (mermaid: import("mermaid").default, mode: MermaidMode) => {
  const theme = getTheme(mode);
  if (theme === activeTheme) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme,
  });

  activeTheme = theme;
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Failed to render Mermaid diagram.";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const maybeMessage = "message" in error ? error.message : null;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeStr = "str" in error ? error.str : null;
    if (typeof maybeStr === "string" && maybeStr.trim()) {
      return maybeStr;
    }
  }

  return "Failed to render Mermaid diagram.";
};

export const renderMermaidSvg = async (code: string, mode: MermaidMode) => {
  const mermaid = await loadMermaid();
  ensureInitialized(mermaid, mode);

  const renderId = `seqify-mermaid-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const { svg } = await mermaid.render(renderId, code);
    return svg;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
