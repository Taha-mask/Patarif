// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.developer';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase_client?: SupabaseClient;

  // 🔹 Get client instance
  private getClient(): SupabaseClient {
    if (!this.supabase_client) {
      this.supabase_client = createClient(
        environment.supabase.url,
        environment.supabase.key
      );
    }
    return this.supabase_client;
  }

  // 🔹 Auth
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

  // 🔹 Add product with colors & sizes
  
}
