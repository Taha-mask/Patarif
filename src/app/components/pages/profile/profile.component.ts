import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';   // 👈 استورد FormsModule
import { SupabaseService } from '../../../supabase.service';
import { BackgroundComponent } from "../../background/background.component";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [BackgroundComponent, FormsModule],   // 👈 أضف FormsModule هنا
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  displayName: string = '';
  email: string = '';
  lastSignIn: string = '';
  createdAt: string = '';
  provider: string = '';

  // الحقول الخاصة بالباسورد
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.displayName = user.user_metadata?.['display_name'] ?? 'name not found';
      this.email = user.email ?? 'email not found';
      this.lastSignIn = this.formatDate(user.last_sign_in_at);
      this.createdAt = this.formatDate(user.created_at);
      this.provider = user.app_metadata?.provider ?? 'not available';
    }
  }

  async onChangePassword() {
    if (!this.newPassword || !this.confirmPassword) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please fill in both fields',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Mismatch',
        text: 'Passwords do not match',
        confirmButtonText: 'Try Again'
      });
      return;
    }

    try {
      await this.supabaseService.changePassword(this.newPassword);

      await Swal.fire({
        icon: 'success',
        title: 'Done!',
        text: 'Password updated successfully',
        confirmButtonText: 'Great'
      });

      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error changing password: ' + error.message,
        confirmButtonText: 'Close'
      });
    }
  }


  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'not available';
    const date = new Date(dateString);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hh = String(hours).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}, ${hh}:${minutes} ${ampm}`;
  }
}
