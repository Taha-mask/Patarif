// product.model.ts
export interface ProductSize {
  id?: string;
  created_at?: string;
  color_id?: string;
  size_name: string;
  stock: number;
}

export interface ProductColor {
  id?: string;
  created_at?: string;
  product_id?: string;
  color_name: string;
  color_code: string;
  sizes?: ProductSize[];
}

export interface Product {
  id?: string;
  created_at?: string;
  title: string;
  subtitle: string;
  price: number;
  discount: number;
  final_price: number;
  code: string;
  category: string;
  description: string;
  images?: string[];
  rate?: number;
  product_stock?: number;
  colors?: ProductColor[];
}
