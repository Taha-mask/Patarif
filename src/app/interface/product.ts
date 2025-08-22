import { ProductColor } from "./ProductColor";

export interface Product {
  id: string;              
  title: string;
  subtitle?: string;      
  rating?: number;         
  price: number;
  discount?: number;       
  final_price?: number;   
  stock?: number;         
  code?: string;
  category?: string;
  description?: string;
  main_image?: string;
  images?: string[];        
  colors?: ProductColor[];
}
