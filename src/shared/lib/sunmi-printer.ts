export interface FinePrintData {
  plate: string;
  type: string;
  amount: number;
  location: string;
  date: string;
}

export async function printFineTicket(data: FinePrintData): Promise<void> {
  const isCapacitor = typeof window !== 'undefined' &&
    (window as any).SunmiPrinter !== undefined;

  if (isCapacitor) {
    try {
      const { SunmiPrinter } = await import('@kduma-autoid/capacitor-sunmi-printer');
      await printNative(SunmiPrinter, data);
      return;
    } catch (e) {
      console.warn('Native print failed, falling back to web print:', e);
    }
  }

  printWeb(data);
}

async function printNative(SunmiPrinter: any, data: FinePrintData): Promise<void> {
  await SunmiPrinter.enterPrinterBuffer(true);

  try {
    await SunmiPrinter.printText({ text: 'SISTEMA SEOE\n' });
    await SunmiPrinter.printText({ text: 'MUNICIPALIDAD - FISCALIZACION\n\n' });
    await SunmiPrinter.printText({ text: '────────────────────\n' });
    await SunmiPrinter.printText({ text: '  ACTA DE INFRACCION\n' });
    await SunmiPrinter.printText({ text: '────────────────────\n\n' });
    await SunmiPrinter.printText({ text: `Fecha: ${data.date}\n` });
    await SunmiPrinter.printText({ text: `Patente: ${data.plate}\n` });
    await SunmiPrinter.printText({ text: `Infraccion: ${data.type}\n` });
    await SunmiPrinter.printText({ text: `Ubicacion: ${data.location}\n\n` });
    await SunmiPrinter.printText({ text: '────────────────────\n' });
    await SunmiPrinter.printText({ text: '  MONTO A ABONAR\n' });
    await SunmiPrinter.printText({ text: `  $${data.amount.toLocaleString('es-AR')}\n` });
    await SunmiPrinter.printText({ text: '────────────────────\n\n' });
    await SunmiPrinter.printText({ text: 'Regularice su situacion desde\n' });
    await SunmiPrinter.printText({ text: 'la app SEOE Wallet o en oficinas.\n\n' });
    await SunmiPrinter.lineWrap({ lines: 3 });
    await SunmiPrinter.commitPrinterBuffer();
  } catch (e) {
    await SunmiPrinter.exitPrinterBuffer(false);
    throw e;
  }
}

function printWeb(data: FinePrintData): void {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { margin: 0; size: 58mm auto; }
    body { font-family: 'Courier New', monospace; width: 48mm; margin: 0 auto; padding: 10px 0; font-size: 13px; line-height: 1.4; }
    .center { text-align: center; } .bold { font-weight: bold; }
    .divider { border-bottom: 2px dashed black; margin: 10px 0; }
  </style></head><body>
    <div class="center bold"><h1 style="font-size:16px;margin:0 0 5px;">SISTEMA SEOE</h1>
    <p style="margin:0;font-size:11px;">MUNICIPALIDAD - FISCALIZACION</p></div>
    <div class="divider"></div>
    <p class="center bold" style="font-size:14px;">ACTA DE INFRACCION</p>
    <div class="divider"></div>
    <p>Fecha: <b>${data.date}</b></p>
    <p>Patente: <b style="font-size:16px;">${data.plate}</b></p>
    <p>Infraccion:</p><p class="bold">${data.type}</p>
    <p>Ubicacion: ${data.location}</p>
    <div class="divider"></div>
    <p class="center">MONTO A ABONAR</p>
    <p class="center bold" style="font-size:18px;">$${data.amount.toLocaleString('es-AR')}</p>
    <div class="divider"></div>
    <p class="center" style="font-size:10px;margin-top:15px;">Regularice su situacion desde la<br>app SEOE Wallet o en oficinas.</p>
  </body></html>`;

  doc.open();
  doc.write(content);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
}
