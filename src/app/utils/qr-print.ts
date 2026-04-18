import QRCode from "qrcode";

/**
 * Generates a printable HTML page with a 2×2 cm QR code and opens the
 * browser's print dialog. Works without any external PDF library — the user
 * can "Save as PDF" from the print dialog.
 *
 * @param text  The string to encode in the QR code (e.g. shipment ID or PO number)
 * @param label Descriptive label shown beneath the QR code
 */
export async function printQRCode(text: string, label: string): Promise<void> {
  // Render QR code to a data URL at a high resolution so it stays sharp when
  // the browser scales it to 2 cm × 2 cm on paper.
  const dataUrl = await QRCode.toDataURL(text, {
    width: 300,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Code – ${text}</title>
  <style>
    @page {
      size: auto;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: monospace;
      background: #fff;
    }
    .qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px;
      border: 1px solid #ccc;
    }
    img {
      /* 2 cm × 2 cm */
      width:  75.6px;  /* 2cm at 96 dpi */
      height: 75.6px;
      image-rendering: pixelated;
    }
    p {
      font-size: 9px;
      text-align: center;
      max-width: 90px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="qr-wrap">
    <img src="${dataUrl}" alt="QR Code for ${text}" />
    <p>${label}</p>
  </div>
  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=400,height=400");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
