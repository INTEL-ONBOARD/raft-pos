// src/main/services/settings.service.ts
import { Settings } from '../models/settings.model'
import store from '../store/electron-store'
import type { ISettings, UpdateSettingsInput } from '@shared/types/settings.types'

async function getOrCreateSettings() {
  let doc = await Settings.findOne()
  if (!doc) doc = await Settings.create({})
  return doc
}

export async function getSettings(): Promise<ISettings> {
  const doc = await getOrCreateSettings()
  return {
    storeName: doc.storeName,
    receiptHeader: doc.receiptHeader,
    receiptFooter: doc.receiptFooter,
    globalTaxRate: doc.globalTaxRate,
    currencySymbol: doc.currencySymbol,
    lowStockDefaultThreshold: doc.lowStockDefaultThreshold,
    terminalId: store.get('terminalId') ?? ''
  }
}

export async function updateSettings(input: UpdateSettingsInput, terminalId?: string): Promise<ISettings> {
  const doc = await getOrCreateSettings()
  if (input.storeName !== undefined) doc.storeName = input.storeName.trim()
  if (input.receiptHeader !== undefined) doc.receiptHeader = input.receiptHeader
  if (input.receiptFooter !== undefined) doc.receiptFooter = input.receiptFooter
  if (input.globalTaxRate !== undefined) doc.globalTaxRate = input.globalTaxRate
  if (input.currencySymbol !== undefined) doc.currencySymbol = input.currencySymbol.trim()
  if (input.lowStockDefaultThreshold !== undefined) doc.lowStockDefaultThreshold = input.lowStockDefaultThreshold
  if (terminalId !== undefined) store.set('terminalId', terminalId)
  await doc.save()
  return getSettings()
}
