import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root',
})
export class authGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    console.log('AuthGuard checking session');
    const session = await this.supabaseService.getSession();
    if (session) {
      console.log('Session found, allowing access');
      return true;
    } else {
      console.log('No session, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}