import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { BackgroundComponent } from "./components/background/background.component";
import { CelebrationComponent } from "./components/game-template/celebration/celebration.component";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, NgIf, BackgroundComponent, CelebrationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  hiddenRoutes: string[] = ['/login', '/signup'];

  constructor(public router: Router) { }

  isAdminDashboard(): boolean {
    return this.router.url.startsWith('/admin-dashboard') || this.router.url.startsWith('/admin-products') || this.router.url.startsWith('/app-admin-orders') || this.router.url.startsWith('/contact-messages');
  }
  shouldShowNavbar(): boolean {
    return !this.hiddenRoutes.includes(this.router.url);
  }
}
