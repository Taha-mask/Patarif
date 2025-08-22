import { ProductSize } from "./ProductSize";

export interface ProductColor {
  id: string;              
  product_id: string;       
  color_name: string;
  color_code?: string;      
  stock?: number;           
  sizes?: ProductSize[];    
}
