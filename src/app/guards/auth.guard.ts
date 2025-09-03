import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  async canActivate(): Promise<boolean> {
    const { data: { session } } = await this.supabase.client.auth.getSession();

    if (!session) {
      this.router.navigate(['/home']);
      return false;
    }

    const { data: { user } } = await this.supabase.client.auth.getUser();

    if (!user) {
      this.router.navigate(['/home']);
      return false;
    }

    // ✅ تحقق من الايميل
    if (user.email === 'patarif.admin@gmail.com') {
      return true;
    } else {
      this.router.navigate(['/']); // لو مش الادمن يرجعه للهوم
      return false;
    }
  }
}
