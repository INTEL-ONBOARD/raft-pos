// src/main/services/scanner.service.ts
// USB HID barcode scanner integration.
// Most USB barcode scanners present as HID keyboard devices.
// The scanner sends keycodes one by one; Enter (usage 0x28) terminates the sequence.
// This service accumulates those keycodes into a string buffer, then fires
// IPC.SCANNER_BARCODE_SCANNED as a push event to all renderer windows.

import { BrowserWindow } from 'electron'
import HID from 'node-hid'
import { IPC } from '@shared/types/ipc.types'

// HID usage → ASCII character map for a US keyboard layout.
// Covers digits, uppercase letters, and common barcode characters.
const HID_USAGE_TO_CHAR: Record<number, string> = {
  0x04: 'A', 0x05: 'B', 0x06: 'C', 0x07: 'D', 0x08: 'E', 0x09: 'F',
  0x0A: 'G', 0x0B: 'H', 0x0C: 'I', 0x0D: 'J', 0x0E: 'K', 0x0F: 'L',
  0x10: 'M', 0x11: 'N', 0x12: 'O', 0x13: 'P', 0x14: 'Q', 0x15: 'R',
  0x16: 'S', 0x17: 'T', 0x18: 'U', 0x19: 'V', 0x1A: 'W', 0x1B: 'X',
  0x1C: 'Y', 0x1D: 'Z',
  0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4', 0x22: '5',
  0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9', 0x27: '0',
  0x2D: '-', 0x2E: '=', 0x2F: '[', 0x30: ']', 0x31: '\\',
  0x33: ';', 0x34: "'", 0x36: ',', 0x37: '.', 0x38: '/'
}

const ENTER_KEYCODE = 0x28

let scannerDevice: HID.HID | null = null
let buffer = ''

function broadcastBarcode(barcode: string): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.SCANNER_BARCODE_SCANNED, barcode)
    }
  }
}

const SCANNER_KEYWORDS = ['scan', 'barcode', 'reader', 'symbol', 'zebra', 'honeywell', 'datalogic', 'metrologic', 'opticon', 'newland']

function isScannerDevice(d: HID.Device): boolean {
  const name = `${d.product ?? ''} ${d.manufacturer ?? ''}`.toLowerCase()
  return SCANNER_KEYWORDS.some(kw => name.includes(kw))
}

export function initScanner(): void {
  try {
    // Find a HID device that looks like a barcode scanner.
    // Most USB HID scanners use usage page 0x01 (Generic Desktop) and usage 0x06 (Keyboard).
    // Prefer devices whose product/manufacturer name contains scanner keywords to avoid
    // accidentally consuming the system keyboard.
    const devices = HID.devices()
    const keyboards = devices.filter((d) => d.usagePage === 0x01 && d.usage === 0x06)

    // First: prefer a device that identifies itself as a scanner by name
    let scannerInfo = keyboards.find(isScannerDevice)
    // Fallback: use the first keyboard-like device only if there is exactly one
    // (avoids grabbing the user's keyboard when multiple HID keyboards are present)
    if (!scannerInfo && keyboards.length === 1) {
      scannerInfo = keyboards[0]
    }

    if (!scannerInfo || !scannerInfo.path) {
      console.warn('[Scanner] No HID barcode scanner found. Attach a USB scanner and restart.')
      broadcastUnavailable()
      return
    }

    scannerDevice = new HID.HID(scannerInfo.path)
    buffer = ''

    scannerDevice.on('data', (data: Buffer) => {
      // HID keyboard report: byte 0 = modifier, byte 1 = reserved, bytes 2-7 = keycodes
      for (let i = 2; i < data.length; i++) {
        const keycode = data[i]
        if (keycode === 0x00) continue  // key up / no key

        if (keycode === ENTER_KEYCODE) {
          if (buffer.length > 0) {
            broadcastBarcode(buffer)
            buffer = ''
          }
        } else {
          // Reset if buffer grows too large (malfunction protection)
          if (buffer.length >= 128) {
            buffer = ''
          }
          const char = HID_USAGE_TO_CHAR[keycode]
          if (char) buffer += char
        }
      }
    })

    scannerDevice.on('error', (err: Error) => {
      console.error('[Scanner] HID error:', err.message)
      scannerDevice = null
      broadcastUnavailable()
    })

    console.log('[Scanner] HID scanner initialized:', scannerInfo.product ?? scannerInfo.path)
  } catch (err: any) {
    console.warn('[Scanner] Failed to initialize HID scanner:', err.message)
    broadcastUnavailable()
  }
}

function broadcastUnavailable(): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.SCANNER_UNAVAILABLE)
    }
  }
}

export function closeScanner(): void {
  if (scannerDevice) {
    try { scannerDevice.close() } catch { /* ignore */ }
    scannerDevice = null
  }
}
