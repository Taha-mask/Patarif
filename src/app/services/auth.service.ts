import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root'  
})
export class AuthService {

   constructor(private supabaseService: SupabaseService) {}

  async isLoggedIn(): Promise<boolean> {
    const user = await this.supabaseService.getCurrentUser();
    return !!user;
  }

  async getUser() {
    return await this.supabaseService.getCurrentUser();
  }

  async logout() {
    return this.supabaseService.signOut();
  }

  
}
