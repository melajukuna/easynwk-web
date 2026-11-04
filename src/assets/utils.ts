function download(filename: string, dataURL: string): void {
  // based on https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  const element = document.createElement("a");
  element.setAttribute("href", dataURL);
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function downloadText(filename: string, text: string): void {
  download(
    filename,
    "data:text/plain;charset=utf-8,\ufeff" + encodeURIComponent(text)
  );
}

/** Diese Eigenschaften braucht die Karte, um als Bild ohne die Stylesheets der Seite gleich auszusehen */
const BILD_STILE = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "paint-order",
  "stop-color",
  "stop-opacity",
  "vector-effect",
];
const BILD_PIXEL = 1600;

/**
 * Karte als PNG. Das Original hängt alle Stylesheets der Seite ins Bild, das scheitert an einer großen Seite
 * (Zeichen wie < in Regeln machen das SVG ungültig). Deshalb eine Kopie mit festen Stilen, immer in hellen Farben.
 */
export function downloadSVGasPNG(filename: string, svgSelector: string): void {
  const svgElem = document.querySelector(svgSelector);
  if (!svgElem) return;

  const huelle = document.createElement("div");
  huelle.className = "nwk nwk-hell nwk-bildkopie";
  const kopie = svgElem.cloneNode(true) as SVGSVGElement;
  kopie.querySelectorAll("#brush, #position").forEach((e) => e.remove());
  huelle.append(kopie);
  document.body.append(huelle);

  const elemente = [kopie, ...Array.from(kopie.querySelectorAll<SVGElement>("*"))];
  const stile = elemente.map((e) => {
    const berechnet = getComputedStyle(e);
    return BILD_STILE.map((n) => n + ":" + berechnet.getPropertyValue(n)).join(";");
  });
  elemente.forEach((e, i) => e.setAttribute("style", stile[i]));
  huelle.remove();

  kopie.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  kopie.setAttribute("width", String(BILD_PIXEL));
  kopie.setAttribute("height", String(BILD_PIXEL));

  const svgData = new XMLSerializer().serializeToString(kopie);
  const svgUrl = URL.createObjectURL(
    new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
  );

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = BILD_PIXEL;
    canvas.height = BILD_PIXEL;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, BILD_PIXEL, BILD_PIXEL);
      ctx.drawImage(img, 0, 0, BILD_PIXEL, BILD_PIXEL);
    }
    URL.revokeObjectURL(svgUrl);
    download(filename, canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  };
  img.src = svgUrl;
}

export const SYMBOL_DECEASED = "+"; // "💀";

/** Zahl mit festen Stellen in der Sprache der Seite (5,7 statt 5.7), ohne Wert ein Strich statt NaN */
export function zahl(wert: number, stellen = 1): string {
  if (!Number.isFinite(wert)) return "–";
  return wert.toLocaleString(document.documentElement.lang || "de", {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  });
}
