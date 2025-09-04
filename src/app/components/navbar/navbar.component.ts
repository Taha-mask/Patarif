import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SearchModalComponent } from "../search-modal/search-modal.component";
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule, SearchModalComponent, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  profileImage: string = "images/account.png";
  userName: string | null = null;
  isLogged: boolean = false;
  menuOpen = false;

  private subs: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {
    document.addEventListener('click', () => {
      this.menuOpen = false;
    });
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'images/account.png';
  }

  async ngOnInit() {
    const sessionData = await this.supabaseService.getSession();
    if (sessionData) {
      const user = sessionData.user;
      if (user) {
        this.isLogged = true;
        this.userName = user.email?.split('@')[0] || "Guest";
        // set initial image (this will also push to subject in service)
        const url = await this.supabaseService.getProfileImage(user.id);
        this.profileImage = url || 'images/account.png';
      } else {
        this.isLogged = false;
      }
    } else {
      this.isLogged = false;
    }

    this.subs.add(
      this.supabaseService.profileImage$.subscribe((url) => {
        if (url) this.profileImage = url;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  openSideMenu() {
    document.getElementById('sideMenu')?.classList.add('open');
  }

  // search
  isOpen = false;
  openSearch() { this.isOpen = true; }
}
