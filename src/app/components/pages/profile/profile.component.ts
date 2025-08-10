import { Component } from '@angular/core';
import { SupabaseService } from '../../../supabase.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

 displayName: string = '';
  email: string = '';

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.displayName = user.user_metadata?.['display_name'] ?? 'name not found';
      this.email = user.email ?? 'email not found';
    };
  };
}
