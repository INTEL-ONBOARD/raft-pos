import { Schema, model, Document, Types } from 'mongoose'

export interface IInventory extends Document {
  productId: Types.ObjectId
  branchId: Types.ObjectId
  quantity: number
  lowStockThreshold: number
  reorderPoint: number
}

const inventorySchema = new Schema<IInventory>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    reorderPoint: { type: Number, default: 10, min: 0 }
  }
)

// One inventory doc per {productId, branchId}
inventorySchema.index({ productId: 1, branchId: 1 }, { unique: true })
inventorySchema.index({ branchId: 1 })
inventorySchema.index({ quantity: 1 })

export const Inventory = model<IInventory>('Inventory', inventorySchema)
