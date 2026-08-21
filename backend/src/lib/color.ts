/**
 * Generate a random pastel color as a hex string (#rrggbb).
 * Used to assign an initial color to a newly created tag.
 * The color is frozen at creation time and never regenerated automatically.
 * Hex is used to match the native HTML5 color picker format end-to-end.
 */
export function randomPastel(): string {
  const hue = Math.floor(Math.random() * 360);
  return hslToHex(hue, 70, 80);
}

/**
 * Convert HSL values to a hex color string (#rrggbb).
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const hue = h / 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (sat === 0) {
    r = g = b = light;
  } else {
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    r = hue2rgb(p, q, hue + 1 / 3);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1 / 3);
  }

  const toHex = (c: number) =>
    Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
