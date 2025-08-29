import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private supabase: SupabaseClient;
  private productsCache: any[] = [];

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
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
        *
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




  // admin - dashboard

  async getTotalCarts() {
    const { count, error } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact' });

    if (error) {
      console.error(error);
      return 0;
    }

    return count;
  }


  async getDeliveredCarts() {
    const { count, error } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact' })
      .eq('isDelivered', true);

    if (error) {
      console.error(error);
      return 0;
    }

    return count;
  }



  async getNewProfilesThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', endOfMonth.toISOString());

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  }



async getTop3CartItemNames() {
  const { data, error } = await this.supabase
    .from('cart_items')
    .select('name');

  if (error) {
    console.error('Error fetching cart items:', error.message);
    return [];
  }

  if (!data) return [];

  // ✨ حساب التكرارات
  const nameCount: Record<string, number> = {};
  data.forEach(item => {
    if (item.name) {
      nameCount[item.name] = (nameCount[item.name] || 0) + 1;
    }
  });

  // ✨ ترتيب + أخذ أول 3
  const top3 = Object.entries(nameCount)
    .sort((a, b) => b[1] - a[1]) // ترتيب تنازلي حسب العدد
    .slice(0, 3) // أول 3
    .map(([name, count]) => ({ name, count }));

  return top3;
}


  async getLowStockProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .lt('product_stock', 10)
      .neq('product_stock', 0);
    if (error) {
      console.error(error);
      return [];
    }

    return data;
  }


  async getOutOfStockProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('product_stock', 0);

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  }

  // get the percent value between last day and current day of requests
  async getTodayAndYesterdayOrders() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const yesterdayEnd = todayStart;

    const { count: yesterdayOrders } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', yesterdayEnd.toISOString());

    const { count: todayOrders } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString());

    const totalOrders = (yesterdayOrders ?? 0) + (todayOrders ?? 0);
    const percentage =
      totalOrders > 0 ? ((todayOrders ?? 0) / totalOrders) * 100 : 0;

    let trend: 'up' | 'down' | 'equal' = 'equal';
    if ((todayOrders ?? 0) > (yesterdayOrders ?? 0)) trend = 'up';
    else if ((todayOrders ?? 0) < (yesterdayOrders ?? 0)) trend = 'down';

    return {
      yesterdayOrders: yesterdayOrders ?? 0,
      todayOrders: todayOrders ?? 0,
      totalOrders,
      percentage,
      trend,
    };
  }

  // supabase.service.ts

  // ====================
  // state of (profiles)
  // ====================
  async getUsersThisAndLastMonth() {
    const now = new Date();

    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { count: thisMonth, error: err1 } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startThisMonth.toISOString())
      .lt('created_at', startNextMonth.toISOString());

    if (err1) throw err1;

    const { count: lastMonth, error: err2 } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startLastMonth.toISOString())
      .lt('created_at', startThisMonth.toISOString());

    if (err2) throw err2;

    const total = (thisMonth ?? 0) + (lastMonth ?? 0);
    const percentage = total > 0 ? ((thisMonth ?? 0) / total) * 100 : 0;

    let trend: 'up' | 'down' | 'equal' = 'equal';
    if ((thisMonth ?? 0) > (lastMonth ?? 0)) trend = 'up';
    else if ((thisMonth ?? 0) < (lastMonth ?? 0)) trend = 'down';

    return {
      thisMonth: thisMonth ?? 0,
      lastMonth: lastMonth ?? 0,
      total,
      percentage,
      trend,
    };
  }

  // ====================
  // state of (carts)
  // ====================
  async getDeliveredTodayAndYesterday() {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const yesterdayEnd = todayStart;
    const { count: yesterdayDelivered } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .eq('isDelivered', true)
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', yesterdayEnd.toISOString());

    const { count: todayDelivered } = await this.supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .eq('isDelivered', true)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString());

    const total = (yesterdayDelivered ?? 0) + (todayDelivered ?? 0);
    const percentage = total > 0 ? ((todayDelivered ?? 0) / total) * 100 : 0;

    let trend: 'up' | 'down' | 'equal' = 'equal';
    if ((todayDelivered ?? 0) > (yesterdayDelivered ?? 0)) trend = 'up';
    else if ((todayDelivered ?? 0) < (yesterdayDelivered ?? 0)) trend = 'down';

    return {
      todayDelivered: todayDelivered ?? 0,
      yesterdayDelivered: yesterdayDelivered ?? 0,
      total,
      percentage,
      trend,
    };
  }



}