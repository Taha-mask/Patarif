import { Story } from './../../interface/story';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent implements OnInit {
  profileImage: string = "images/account.png";
  userName: string | null = null;
  isLogged: boolean = false;
  menuOpen = false;

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

  async ngOnInit() {
    // جلب الجلسة الحالية
    const sessionData = await this.supabaseService.getSession();
    if (sessionData) {
      const user = sessionData.user;
      if (user) {
        this.isLogged = true;
        this.userName = user.email?.split('@')[0] || "Guest";
        this.profileImage = await this.supabaseService.getProfileImage(user.id);
      } else {
        this.isLogged = false;
      }
    } else {
      this.isLogged = false;
    }
  }

  openSideMenu() {
    document.getElementById('sideMenu')?.classList.add('open');
  }
}
