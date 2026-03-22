import { create } from 'zustand'
import type { IProduct } from '@shared/types/product.types'

interface ProductState {
  products: IProduct[]
  total: number
  setProducts: (products: IProduct[], total: number) => void
  updateProduct: (product: IProduct) => void
  addProduct: (product: IProduct) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  total: 0,
  setProducts: (products, total) => set({ products, total }),
  updateProduct: (product) =>
    set(state => ({
      products: state.products.map(p => p._id === product._id ? product : p)
    })),
  addProduct: (product) =>
    set(state => ({ products: [product, ...state.products], total: state.total + 1 }))
}))
