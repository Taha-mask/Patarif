import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase.service';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterModule],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}
