import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { BackgroundComponent } from '../../background/background.component';
import { CategoriesComponent } from "./categories/categories.component";
import { HomeGamesComponent } from './home-games/home-games.component';
import { CharactersHomeComponent } from "./characters-home/characters-home.component";
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    IntroductionComponent,
    BackgroundComponent,
    CategoriesComponent,
    HomeGamesComponent,
    CharactersHomeComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
