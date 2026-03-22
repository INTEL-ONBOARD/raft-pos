import { Product } from '../models/product.model'
import { Inventory } from '../models/inventory.model'
import type { IProduct, CreateProductInput, UpdateProductInput } from '@shared/types/product.types'

function toShared(doc: any): IProduct {
  return {
    _id: doc._id.toString(),
    sku: doc.sku,
    name: doc.name,
    description: doc.description,
    categoryId: doc.categoryId ? doc.categoryId.toString() : null,
    unit: doc.unit,
    costPrice: doc.costPrice,
    sellingPrice: doc.sellingPrice,
    barcode: doc.barcode,
    imageUrl: doc.imageUrl ?? null,
    taxRate: doc.taxRate,
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? ''
  }
}

export async function getAllProducts(opts: {
  search?: string
  categoryId?: string
  isActive?: boolean
  limit?: number
  skip?: number
}): Promise<{ data: IProduct[]; total: number }> {
  const query: any = {}
  if (opts.isActive !== undefined) query.isActive = opts.isActive
  if (opts.categoryId) query.categoryId = opts.categoryId
  if (opts.search) query.$text = { $search: opts.search }

  const [data, total] = await Promise.all([
    Product.find(query)
      .sort({ name: 1 })
      .skip(opts.skip ?? 0)
      .limit(opts.limit ?? 100)
      .lean(),
    Product.countDocuments(query)
  ])
  return { data: data.map(toShared), total }
}

export async function getProductById(id: string): Promise<IProduct | null> {
  const p = await Product.findById(id).lean()
  return p ? toShared(p) : null
}

export async function getProductByBarcode(barcode: string): Promise<IProduct | null> {
  const p = await Product.findOne({ barcode, isActive: true }).lean()
  return p ? toShared(p) : null
}

export async function createProduct(input: CreateProductInput, branchId: string): Promise<IProduct> {
  // Check SKU uniqueness
  const existing = await Product.findOne({ sku: input.sku.toUpperCase() })
  if (existing) throw new Error(`SKU "${input.sku}" already exists`)

  const product = await Product.create({
    sku: input.sku.toUpperCase(),
    name: input.name,
    description: input.description ?? '',
    categoryId: input.categoryId ?? null,
    unit: input.unit,
    costPrice: input.costPrice,
    sellingPrice: input.sellingPrice,
    barcode: input.barcode ?? '',
    imageUrl: input.imageUrl ?? null,
    taxRate: input.taxRate ?? null,
    isActive: true
  })

  // Create inventory record for the creating user's branch at 0 stock.
  // Note: this only creates a record for ONE branch. In a multi-branch setup,
  // inventory records for other branches are created when that branch first
  // receives stock via a Purchase Order receive or stock transfer — those flows
  // (Phase 5 and Phase 6) will upsert inventory records as needed. The POS screen
  // (Phase 4) must handle the case where no inventory record exists for a branch yet.
  await Inventory.create({
    productId: product._id,
    branchId,
    quantity: 0,
    lowStockThreshold: 5,
    reorderPoint: 10
  })

  return toShared(product)
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<IProduct | null> {
  if (input.sku) {
    const conflict = await Product.findOne({ sku: input.sku.toUpperCase(), _id: { $ne: id } })
    if (conflict) throw new Error(`SKU "${input.sku}" already exists`)
    input = { ...input, sku: input.sku.toUpperCase() }
  }
  const p = await Product.findByIdAndUpdate(id, { $set: input }, { new: true }).lean()
  return p ? toShared(p) : null
}

export async function deactivateProduct(id: string): Promise<boolean> {
  const result = await Product.findByIdAndUpdate(id, { isActive: false })
  return result !== null
}

export interface CsvImportRow {
  sku: string
  name: string
  description?: string
  categoryId?: string
  unit: string
  costPrice: string
  sellingPrice: string
  barcode?: string
  taxRate?: string
}

export interface CsvImportResult {
  imported: number
  errors: Array<{ row: number; sku: string; error: string }>
}

export async function importProductsFromCsv(
  rows: CsvImportRow[],
  branchId: string
): Promise<CsvImportResult> {
  const VALID_UNITS = ['pcs', 'kg', 'm', 'box', 'roll', 'set', 'pair']
  const errors: CsvImportResult['errors'] = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2  // +2 because row 1 is header

    // Validate required fields
    if (!row.sku?.trim()) { errors.push({ row: rowNum, sku: row.sku ?? '', error: 'SKU is required' }); continue }
    if (!row.name?.trim()) { errors.push({ row: rowNum, sku: row.sku, error: 'Name is required' }); continue }
    if (!VALID_UNITS.includes(row.unit)) { errors.push({ row: rowNum, sku: row.sku, error: `Unit must be one of: ${VALID_UNITS.join(', ')}` }); continue }

    const costPrice = parseFloat(row.costPrice)
    const sellingPrice = parseFloat(row.sellingPrice)
    if (isNaN(costPrice) || costPrice < 0) { errors.push({ row: rowNum, sku: row.sku, error: 'costPrice must be a non-negative number' }); continue }
    if (isNaN(sellingPrice) || sellingPrice < 0) { errors.push({ row: rowNum, sku: row.sku, error: 'sellingPrice must be a non-negative number' }); continue }

    try {
      await createProduct({
        sku: row.sku.trim(),
        name: row.name.trim(),
        description: row.description?.trim(),
        categoryId: row.categoryId?.trim() || null,
        unit: row.unit as any,
        costPrice,
        sellingPrice,
        barcode: row.barcode?.trim(),
        taxRate: row.taxRate ? parseFloat(row.taxRate) : null
      }, branchId)
      imported++
    } catch (err: any) {
      errors.push({ row: rowNum, sku: row.sku, error: err.message ?? 'Failed to import' })
    }
  }

  return { imported, errors }
}
