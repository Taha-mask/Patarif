import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, NgIf],
  templateUrl:'./app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  hiddenRoutes: string[] = ['/login', '/signup'];

  constructor(public router: Router) {}

  shouldShowNavbar(): boolean {
    return !this.hiddenRoutes.includes(this.router.url);
  }
}
