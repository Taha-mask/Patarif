import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { IntroductionComponent } from './introduction/introduction.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    IntroductionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
