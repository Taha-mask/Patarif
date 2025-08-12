import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.developer';
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
    private supabase_client?: SupabaseClient;
    //get current user
    async getCurrentUser() {
      const { data } = await this.getClient().auth.getUser();
      return data.user;
    }
    async getSession() {
      const { data } = await this.getClient().auth.getSession();
      return data.session;
    }

    // get user from database
    private getClient(): SupabaseClient {
      if (!this.supabase_client) {
        this.supabase_client = createClient(
          environment.supabase.url,
          environment.supabase.key
        );
      }
      return this.supabase_client;
    }
  // sign in
  async signIn(email: string, password: string) {
    const { data, error } = await this.getClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }
  // sing up
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

}
