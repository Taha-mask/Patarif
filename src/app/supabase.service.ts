// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';
import { CartItem } from './services/data.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'

})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() { this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey) }

  get client() {
    return this.supabase;
  }
  //  Auth
  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('User not found');

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.role === 'admin') {
      return { ...data, isAdmin: true };
    } else {
      return { ...data, isAdmin: false };
    }
  }

  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: `${firstName} ${lastName}`
        }
      }
    });
  }
  // providers [google]
  // login with Google
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });

      if (error) {
        console.error('Error:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }


  // get user data
  getUser() {
    return this.supabase.auth.getSession();
  }

  // change password
  async changePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  }


  signOut() {
    return this.supabase.auth.signOut();
  }
  // add new record in carts , cart_items [insert to supabase]  
async createCart(
  userEmail: string,
  name: string,
  phone: string,
  department: string,
  note: string,
  subtotal: number,
  total: number,
  count: number
) {
  const shipping = Number((total - subtotal).toFixed(2)); // ensure numeric, 2 decimals

  const { data, error } = await this.supabase
    .from('carts')
    .insert([
      {
        user_email: userEmail,
        user_name: name,
        user_phone: phone,
        subtotal,
        shipping,
        estimate_for: department,
        note,
        total,
        count,
        isDelivered: false
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
async addCartItems(cartId: string, items: any[]) {
  // ensure each item has cart_id set (you do that in checkout)
  const { error } = await this.supabase
    .from('cart_items')
    .insert(items);

  if (error) throw error;
}


  // add to favourites:

  async addToFavourites(userEmail: string, productId: string) {
    const { data, error } = await this.supabase
      .from('favourites')
      .insert([
        {
          user_email: userEmail,
          product_id: productId
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeFromFavourites(userEmail: string, productId: string) {
    const { data, error } = await this.supabase
      .from('favourites')
      .delete()
      .eq('user_email', userEmail)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async isInFavourites(userEmail: string, productId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('favourites')
      .select('id')
      .eq('user_email', userEmail)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;

    return data !== null; // true لو لقى، false لو مش موجود
  }

  //get products from favourites

  async getUserFavouriteProductIds(userEmail: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('favourites')
      .select('product_id')
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error fetching favourite product ids:', error);
      return [];
    }

    return data.map((fav: any) => fav.product_id);
  }

  async getProductsByIds(productIds: string[]) {
    if (productIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data;
  }

  async loadUserFavourites(userEmail: string) {
    const productIds = await this.getUserFavouriteProductIds(userEmail);
    return this.getProductsByIds(productIds);
  }
  // profile image
  async uploadProfileImage(file: File, userId: string): Promise<string | null> {
    try {
      const folderPath = `avatars/${userId}`;
      const filePath = `${folderPath}/${Date.now()}_${file.name}`;

      // geting folder which have images
      const { data: files, error: listError } = await this.supabase.storage
        .from('avatars')
        .list(folderPath);

      if (listError) {
        console.error('Error listing files:', listError.message);
      } else if (files && files.length > 0) {
        // delete old image
        const filesToRemove = files.map(f => `${folderPath}/${f.name}`);
        const { error: removeError } = await this.supabase.storage
          .from('avatars')
          .remove(filesToRemove);

        if (removeError) {
          console.error('Error deleting old files:', removeError.message);
        } else {
          console.log('Old files deleted:', filesToRemove);
        }
      }

      // upload new image
      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        return null;
      }

      // get img url
      const { data } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;

    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }

  // get profile image for navbar , ..etc

  // get profile image by userId
  async getProfileImage(userId: string): Promise<string> {
    try {
      const folderPath = `avatars/${userId}`;

      // 1️⃣ جيب كل الملفات اللي موجودة
      const { data: files, error } = await this.supabase.storage
        .from('avatars')
        .list(folderPath);

      if (error) {
        console.error("Error listing files:", error.message);
        return "images/background.png";
      }

      if (!files || files.length === 0) {
        return "images/background.png";
      }

      const latestFile = files.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      )[0];

      const filePath = `${folderPath}/${latestFile.name}`;

      const { data: publicData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicData.publicUrl || "images/background.png";
    } catch (err) {
      console.error("Unexpected error:", err);
      return "images/background.png";
    }
  }


  // french departments [for select place for ordering] french_departments

  async getFrenchDepartments(): Promise<{ code: string; name: string }[]> {
    const { data, error } = await this.supabase
      .from('french_departments')
      .select('*');

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    return data as { code: string; name: string }[];
  }

  // ------------------ Insert a cart ------------------
  async insertCart(cart: any) {
    const { data, error } = await this.supabase
      .from('carts')
      .insert([cart]);
    if (error) throw error;
    return data;
  }


  // ======= get carts & car items =====


  // get cart with items
  
  async getAllOrders() {
    const { data, error } = await this.supabase
      .from('carts')
      .select(`
        *,
        cart_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async markAsDelivered(cartId: string) {
    const { data, error } = await this.supabase
      .from('carts')
      .update({ isDelivered: true })
      .eq('id', cartId)
      .select();

    if (error) throw error;
    return data;
  }

}


