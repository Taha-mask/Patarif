import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment.developer';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private supabase: SupabaseClient;
  private productsCache: any[] = [];

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  // جلب كل المنتجات
  async getAllProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        id,
        title,
        final_price,
        category,
        images
      `);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data;
  }

  // جلب كل المنتجات بكاش
  async getAllProductsCached() {
    if (this.productsCache.length > 0) {
      return this.productsCache;
    }
    const products = await this.getAllProducts();
    this.productsCache = products;
    return products;
  }

  // جلب المنتجات حسب الفئة
  async getProductsByCategory(category: string) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
        id,
        title,
        final_price,
        category,
        rate,
        images
      `)
        .eq('category', category);

      if (error) {
        console.error('Supabase error getProductsByCategory:', error);
        return [];
      }

      return data ?? [];
      console.log('Products by category:', data);
    } catch (err) {
      console.error('Unexpected error in getProductsByCategory:', err);
      return [];
    }
  }

  getImageUrl(path: string) {
    return this.supabase.storage.from('products').getPublicUrl(path).data.publicUrl;
    console.log('Image URL:', this.supabase.storage.from('products').getPublicUrl(path).data.publicUrl);
    console.log('Image path:', path);
  }
  // one product by id// one product by id
  async getProductById(productId: string) {
    if (!productId || !/^[0-9a-f-]{36}$/i.test(productId)) {
      throw new Error('Invalid product ID');
    }

    const select = `
   *,
    product_colors (
     *)
  `;
    console.log('Fetching product with ID:', productId);
    console.log('Select query:', select);
    const { data, error } = await this.supabase
      .from('products')
      .select(select)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    // تأكد إنهم Arrays حتى لو راجعين null
    data.product_colors = data.product_colors || [];
    for (const c of data.product_colors) c.product_sizes = c.product_sizes || [];

    return data;
  }

  // supabase.service.ts

  async getSizesByColorId(colorId: string) {
    if (!colorId || !/^[0-9a-f-]{36}$/i.test(colorId)) {
      throw new Error('Invalid color ID');
    }

    const { data, error } = await this.supabase
      .from('product_sizes')
      .select('id, size_name, stock')
      .eq('color_id', colorId);

    if (error) {
      console.error('Error fetching sizes:', error);
      throw error;
    }

    return data || [];
  }

}
