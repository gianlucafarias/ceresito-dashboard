import { promises as fs } from "fs";
import path from "path";

import QRCode from "qrcode";
import sharp from "sharp";

const QR_SIZE = 512;
const LOGO_SIZE = 88;
const QR_MARGIN_MODULES = 2;
const CLEAR_ZONE_PADDING = 18;
const LOGO_PATH = path.resolve(process.cwd(), "public", "logo_muni.svg");

let cachedLogoSvg: Promise<string> | null = null;

function normalizeLogoSvg(svg: string) {
  return svg
    .replace(/fill:\s*#fff\b/gi, "fill: #000")
    .replace(/fill:\s*#ffffff\b/gi, "fill: #000")
    .replace(/fill:\s*white\b/gi, "fill: #000")
    .replace(/fill=\"#fff\"/gi, 'fill="#000"')
    .replace(/fill=\"#ffffff\"/gi, 'fill="#000"')
    .replace(/fill=\"white\"/gi, 'fill="#000"');
}

async function loadMunicipalityLogoSvg() {
  if (!cachedLogoSvg) {
    cachedLogoSvg = fs
      .readFile(LOGO_PATH, "utf8")
      .then((svg) => normalizeLogoSvg(svg));
  }

  return cachedLogoSvg;
}

function buildQrSvg(targetUrl: string, includeLogo: boolean) {
  const qr = QRCode.create(targetUrl, {
    errorCorrectionLevel: "H",
  });

  const moduleCount = qr.modules.size;
  const totalModules = moduleCount + QR_MARGIN_MODULES * 2;
  const cellSize = QR_SIZE / totalModules;
  const clearZoneSize = LOGO_SIZE + CLEAR_ZONE_PADDING * 2;
  const clearZoneModules = Math.max(5, Math.ceil(clearZoneSize / cellSize));
  const clearZoneStart = Math.floor((moduleCount - clearZoneModules) / 2);
  const clearZoneEnd = clearZoneStart + clearZoneModules;

  let darkModules = "";

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      const moduleIndex = row * moduleCount + column;
      const isDark = qr.modules.data[moduleIndex];

      if (!isDark) {
        continue;
      }

      if (
        includeLogo &&
        column >= clearZoneStart &&
        column < clearZoneEnd &&
        row >= clearZoneStart &&
        row < clearZoneEnd
      ) {
        continue;
      }

      const x = (column + QR_MARGIN_MODULES) * cellSize;
      const y = (row + QR_MARGIN_MODULES) * cellSize;
      darkModules += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000" />`;
    }
  }

  const clearZonePixelSize = includeLogo ? clearZoneModules * cellSize : 0;
  const clearZonePixelOffset = includeLogo
    ? (clearZoneStart + QR_MARGIN_MODULES) * cellSize
    : 0;
  const clearZoneRect = includeLogo
    ? `
      <rect
        x="${clearZonePixelOffset}"
        y="${clearZonePixelOffset}"
        width="${clearZonePixelSize}"
        height="${clearZonePixelSize}"
        rx="14"
        ry="14"
        fill="#FFFFFF"
      />
    `
    : "";

  const svg = `
    <svg width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect width="${QR_SIZE}" height="${QR_SIZE}" fill="#FFFFFF" />
      ${darkModules}
      ${clearZoneRect}
    </svg>
  `;

  return {
    svg,
    clearZonePixelOffset,
    clearZonePixelSize,
  };
}

export async function generateQrCodePng(
  targetUrl: string,
  options?: {
    includeLogo?: boolean;
  },
) {
  const includeLogo = options?.includeLogo ?? true;

  if (!includeLogo) {
    return QRCode.toBuffer(targetUrl, {
      errorCorrectionLevel: "M",
      margin: QR_MARGIN_MODULES,
      type: "png",
      width: QR_SIZE,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  }

  const qrData = buildQrSvg(targetUrl, true);
  const qrBuffer = await sharp(Buffer.from(qrData.svg)).png().toBuffer();
  const logoSvg = await loadMunicipalityLogoSvg();
  const logoBuffer = await sharp(Buffer.from(logoSvg))
    .resize(LOGO_SIZE, LOGO_SIZE, {
      fit: "contain",
    })
    .png()
    .toBuffer();

  const logoOffset = Math.round(
    qrData.clearZonePixelOffset + (qrData.clearZonePixelSize - LOGO_SIZE) / 2,
  );

  return sharp(qrBuffer)
    .composite([
      {
        input: logoBuffer,
        left: logoOffset,
        top: logoOffset,
      },
    ])
    .png()
    .toBuffer();
}
