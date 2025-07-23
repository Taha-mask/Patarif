import { Component } from '@angular/core';
import { HeroSectionComponent } from './hero-section/hero-section.component'; 
import { RouterOutlet } from '@angular/router';
import { IntroductionComponent } from './introduction/introduction.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    RouterOutlet,
    IntroductionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
