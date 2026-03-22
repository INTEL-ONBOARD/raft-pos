import { Schema, model, Document, Types } from 'mongoose'

export interface ICategory extends Document {
  name: string
  parentId: Types.ObjectId | null
  order: number
  isActive: boolean
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: false }
)

categorySchema.index({ parentId: 1, order: 1 })

export const Category = model<ICategory>('Category', categorySchema)
