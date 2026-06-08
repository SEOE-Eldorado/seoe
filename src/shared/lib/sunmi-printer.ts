export interface FinePrintData {
  plate: string
  type: string
  amount: number
  location: string
  date: string
  inspectorName?: string
  actaNumber?: string
  qrData?: string
}

export async function printFineTicket(data: FinePrintData): Promise<void> {
  const isNative = typeof window !== 'undefined' &&
    typeof (window as any).Capacitor !== 'undefined'

  if (isNative) {
    try {
      const { SunmiPrinter } = await import('@kduma-autoid/capacitor-sunmi-printer')
      // Ensure printer service is bound before printing
      try {
        await SunmiPrinter.bindService()
      } catch (_) {
        // May already be bound — ignore
      }
      await printNative(SunmiPrinter, data)
      return
    } catch (e) {
      console.warn('Native print failed, falling back to web print:', e)
    }
  }

  printWeb(data)
}

async function printNative(SunmiPrinter: any, data: FinePrintData): Promise<void> {
  await SunmiPrinter.enterPrinterBuffer({ clean: true })

  try {
    // Header
    await SunmiPrinter.printText({ text: '\n' })
    await SunmiPrinter.printText({ text: '══════════════════════════\n' })
    await SunmiPrinter.printText({ text: '  MUNICIPALIDAD ELDORADO\n' })
    await SunmiPrinter.printText({ text: '   SISTEMA SEOE - ACTA\n' })
    await SunmiPrinter.printText({ text: '══════════════════════════\n\n' })

    // Acta number
    if (data.actaNumber) {
      await SunmiPrinter.printText({ text: `Nro Acta: ${data.actaNumber}\n` })
    }

    // Inspector
    if (data.inspectorName) {
      await SunmiPrinter.printText({ text: `Inspector: ${data.inspectorName}\n` })
    }

    await SunmiPrinter.printText({ text: `Fecha: ${data.date}\n` })
    await SunmiPrinter.printText({ text: '──────────────────────────\n\n' })

    // Vehicle info
    await SunmiPrinter.printText({ text: `  PATENTE: ${data.plate}\n` })
    await SunmiPrinter.printText({ text: `  INFRACCION: ${data.type}\n` })
    await SunmiPrinter.printText({ text: `  LUGAR: ${data.location}\n\n` })

    await SunmiPrinter.printText({ text: '──────────────────────────\n' })
    await SunmiPrinter.printText({ text: '       MONTO A ABONAR\n' })
    await SunmiPrinter.printText({ text: `     $ ${data.amount.toLocaleString('es-AR')}\n` })
    await SunmiPrinter.printText({ text: '──────────────────────────\n\n' })

    // Payment instructions
    await SunmiPrinter.printText({ text: '  Regularice desde:\n' })
    await SunmiPrinter.printText({ text: '  • App SEOE Wallet\n' })
    await SunmiPrinter.printText({ text: '  • Oficinas municipales\n\n' })

    // QR hint
    if (data.qrData) {
      await SunmiPrinter.printText({ text: '  Escanee QR para pagar ↓\n\n' })
      await SunmiPrinter.printQRCode({ content: data.qrData, size: 6 })
      await SunmiPrinter.printText({ text: '\n' })
    }

    await SunmiPrinter.printText({ text: '══════════════════════════\n' })
    await SunmiPrinter.printText({ text: '  Conserve este comprobante\n' })
    await SunmiPrinter.printText({ text: '══════════════════════════\n' })
    await SunmiPrinter.lineWrap({ lines: 3 })

    await SunmiPrinter.commitPrinterBuffer()
  } catch (e) {
    await SunmiPrinter.exitPrinterBuffer({ commit: false })
    throw e
  }
}

function printWeb(data: FinePrintData): void {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) return

  const headerHtml = data.inspectorName
    ? `<p style="margin:0;font-size:10px;">Inspector: <b>${data.inspectorName}</b></p>`
    : ''

  const actaHtml = data.actaNumber
    ? `<p style="margin:0;font-size:11px;">Acta Nro: <b>${data.actaNumber}</b></p>`
    : ''

  const qrHtml = data.qrData
    ? `<div class="center" style="margin:10px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.qrData)}" style="width:100px;height:100px;" alt="QR Pago"><p style="font-size:9px;margin:3px 0;">Escanee para pagar</p></div>`
    : ''

  const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { margin: 0; size: 58mm auto; }
    body { font-family: 'Courier New', monospace; width: 48mm; margin: 0 auto; padding: 8px 0; font-size: 12px; line-height: 1.35; }
    .center { text-align: center; } .bold { font-weight: bold; }
    .divider { border-bottom: 1.5px dashed black; margin: 8px 0; }
    .dbl-divider { border-top: 2px solid black; border-bottom: 2px solid black; padding: 4px 0; margin: 8px 0; }
  </style></head><body>
    <div class="center dbl-divider">
      <p class="bold" style="font-size:15px;margin:0;">MUNICIPALIDAD</p>
      <p style="font-size:10px;margin:0;">SISTEMA SEOE</p>
    </div>
    ${actaHtml}
    ${headerHtml}
    <p style="margin:3px 0;font-size:10px;">Fecha: ${data.date}</p>
    <div class="divider"></div>
    <p style="margin:3px 0;">PATENTE: <b style="font-size:15px;">${data.plate}</b></p>
    <p style="margin:3px 0;">Infraccion: <b>${data.type}</b></p>
    <p style="margin:3px 0;font-size:10px;">Lugar: ${data.location}</p>
    <div class="dbl-divider center">
      <p style="font-size:10px;margin:0;">MONTO A ABONAR</p>
      <p class="bold" style="font-size:20px;margin:0;">$ ${data.amount.toLocaleString('es-AR')}</p>
    </div>
    ${qrHtml}
    <p class="center" style="font-size:9px;margin:8px 0;">Regularice desde la app SEOE Wallet<br>o en oficinas municipales.</p>
    <div class="divider"></div>
    <p class="center" style="font-size:8px;">Conserve este comprobante</p>
  </body></html>`

  doc.open()
  doc.write(content)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 500)
}
