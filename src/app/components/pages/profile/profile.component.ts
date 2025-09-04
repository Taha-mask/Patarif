import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../supabase.service';
import { BackgroundComponent } from "../../background/background.component";
import Swal from 'sweetalert2';
import { ProductCardComponent } from "../shop/product-card/product-card.component";
import { CommonModule } from '@angular/common';
import { FavProCardComponent } from "./fav-pro-card/fav-pro-card.component";
import { HomeFooterComponent } from "../home/home-footer/home-footer.component";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [BackgroundComponent, FormsModule, ProductCardComponent, CommonModule, FavProCardComponent, HomeFooterComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  displayName: string = '';
  email: string = '';
  lastSignIn: string = '';
  createdAt: string = '';
  provider: string = '';
  userId: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  favouriteProducts: any[] = [];
  profileImageUrl: string | null = null;

  private subs = new Subscription();

  constructor(private supabaseService: SupabaseService) { }

  // file select
  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const url = await this.supabaseService.uploadProfileImage(file, this.userId);
      if (url) {
        // set local state (service already emits via BehaviorSubject if implemented)
        this.profileImageUrl = url;
      }
    }
  }

  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();

    if (user) {
      this.userId = user.id;
      this.displayName = user.user_metadata?.['display_name'] ?? 'name not found';
      this.email = user.email ?? 'email not found';
      this.lastSignIn = this.formatDate(user.last_sign_in_at);
      this.createdAt = this.formatDate(user.created_at);
      this.provider = user.app_metadata?.provider ?? 'not available';

      try {
        const img = await this.supabaseService.getProfileImage(this.userId);
        this.profileImageUrl = img;
        console.log('Loaded profile image:', img);
      } catch (err) {
        console.error('Error loading profile image on init:', err);
      }
    } else {
      const session = await this.supabaseService.getSession?.();
      if (session?.user) {
        this.userId = session.user.id;
        this.profileImageUrl = await this.supabaseService.getProfileImage(this.userId);
      }
    }

    this.subs.add(
      this.supabaseService.profileImage$.subscribe((url) => {
        if (url) {
          this.profileImageUrl = url;
          console.log('profile image updated via subject:', url);
        }
      })
    );

    this.favouriteProducts = await this.supabaseService.loadUserFavourites(this.email);
    console.log(this.favouriteProducts);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
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

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'images/account.png';
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
