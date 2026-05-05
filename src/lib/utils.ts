import sanitize from "sanitize-html";

const STRIP_CONFIG: sanitize.IOptions = { allowedTags: [], allowedAttributes: {} };

const HTML_CONFIG: sanitize.IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat([
    "img",
    "figure",
    "figcaption",
    "iframe",
    "video",
    "source",
    "picture",
  ]),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: ["src", "alt", "title", "width", "height", "loading", "decoding", "class"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title", "class"],
    video: ["src", "width", "height", "controls", "autoplay", "muted", "loop", "class"],
    source: ["src", "type"],
    figure: ["class"],
    figcaption: ["class"],
    div: ["class"],
    span: ["class"],
    p: ["class"],
    a: ["href", "target", "rel", "class"],
    "*": ["class"],
  },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
};

export function stripHtml(html: string): string {
  return sanitize(html, STRIP_CONFIG).trim();
}

export function sanitizeHtml(html: string): string {
  return sanitize(html, HTML_CONFIG);
}

const SVG_TAGS: string[] = [
  "svg",
  "path",
  "circle",
  "ellipse",
  "line",
  "polygon",
  "polyline",
  "rect",
  "g",
  "defs",
  "clipPath",
  "use",
  "symbol",
  "text",
  "tspan",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feMerge",
  "feMergeNode",
  "feColorMatrix",
  "feBlend",
];

const SVG_ATTRS: string[] = [
  "viewBox",
  "xmlns",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "width",
  "height",
  "points",
  "transform",
  "opacity",
  "clip-path",
  "clip-rule",
  "fill-rule",
  "fill-opacity",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "id",
  "class",
  "href",
  "gradientUnits",
  "gradientTransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "spreadMethod",
  "xlink:href",
  "mask",
  "filter",
  "result",
  "in",
  "in2",
  "stdDeviation",
  "dx",
  "dy",
  "values",
  "type",
  "mode",
];

// SVG is case-sensitive; preserve original casing
const SVG_CONFIG: sanitize.IOptions = {
  allowedTags: SVG_TAGS,
  allowedAttributes: { "*": SVG_ATTRS },
  parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
};

export function sanitizeSvg(svg: string): string {
  return sanitize(svg, SVG_CONFIG);
}
