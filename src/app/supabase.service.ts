// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.developer';
import { CartItem } from './services/data.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  constructor(private router: Router) {
  }
  private supabase_client?: SupabaseClient;

  //  Get client instance
  private getClient(): SupabaseClient {
    if (!this.supabase_client) {
      this.supabase_client = createClient(
        environment.supabase.url,
        environment.supabase.key
      );
    }
    return this.supabase_client;
  }

  //  Auth
  async getCurrentUser() {
    const { data } = await this.getClient().auth.getUser();
    return data.user;
  }

  async getSession() {
    const { data } = await this.getClient().auth.getSession();
    return data.session;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('User not found');

    // جلب الدور من جدول profiles
    const { data: profile, error: profileError } = await this.getClient()
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    // تحقق إذا Admin أو لا
    if (profile.role === 'admin') {
      // لو Admin → رجع قيمة أو نفذ توجيه
      return { ...data, isAdmin: true };
    } else {
      return { ...data, isAdmin: false };
    }
  }

  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.getClient().auth.signUp({
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
    const { data, error } = await this.getClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home` // المكان اللي هيتم إعادة التوجيه ليه بعد Google login
      }
    });

    if (error) {
      console.error('Error:', error.message);
      return null;
    }

    // بعد redirect، Supabase هيملأ session تلقائيًا
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}


  // get user data
  getUser() {
    return this.getClient().auth.getSession();
  }


  signOut() {
    return this.getClient().auth.signOut();
  }
  // add new record in carts , cart_items [insert to supabase]  

  async createCart(userEmail: string, subtotal: number, count: number) {
    const { data, error } = await this.getClient()
      .from('carts')
      .insert([
        {
          user_email: userEmail,
          subtotal,
          shipping: 0,
          total: subtotal,
          count,
          estimate_for: '3 days',
          isDelivered: false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addCartItems(cartId: string, items: any[]) {
    const { error } = await this.getClient()
      .from('cart_items')
      .insert(items);

    if (error) throw error;
  }
}



