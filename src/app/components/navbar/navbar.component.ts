import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
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
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    // إذا تريد سلوك إغلاق من أي مكان في الصفحة عند الضغط خارج القوائم:
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
    // existing init logic...
    const sessionData = await this.supabaseService.getSession();
    if (sessionData) {
      const user = sessionData.user;
      if (user) {
        this.isLogged = true;
        this.userName = user.email?.split('@')[0] || "Guest";
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

    // اغلاق الـ side menu عند أي حدث تنقّل (NavigationStart يغطي كل أنواع التنقل)
    this.subs.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.closeSideMenu();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  openSideMenu() {
    this.menuOpen = true;
    document.getElementById('sideMenu')?.classList.add('open');
  }

  closeSideMenu() {
    this.menuOpen = false;
    document.getElementById('sideMenu')?.classList.remove('open');
  }

  // search
  isOpen = false;
  openSearch() { this.isOpen = true; }
}
