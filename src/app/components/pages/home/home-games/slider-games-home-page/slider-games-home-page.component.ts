import { Component } from '@angular/core';
import { GameCardComponent } from '../game-card/game-card.component';
import { CommonModule } from '@angular/common';
import { StarsBackgroundComponent } from "../../../../stars-background/stars-background.component";
@Component({
  selector: 'app-slider-games-home-page',
  imports: [
    GameCardComponent,
    CommonModule,
    StarsBackgroundComponent
],
  templateUrl: './slider-games-home-page.component.html',
  styleUrl: './slider-games-home-page.component.css'
})
export class SliderGamesHomePageComponent {
  designType: string = 'carousel';

  cards = [
    {
      title: 'Casse\ntêtes',
      img: 'images/PataUG3.svg',
      page: 'letters-game',
      raiting: 2.8

    },

    {
      title: 'Devi\nner',
      img: 'images/PataUG1.png',
      page: 'guess-eemoji',
      raiting: 4.2
    },
    {
      title: 'Col\norie\ns',
      img: 'images/PataUG2.png',
      page: 'canvas',
      raiting: 3.0

    }
  ];

  currentIndex = 1;

  get leftIndex() {
    return this.currentIndex === 0 ? this.cards.length - 1 : this.currentIndex - 1;
  }

  get rightIndex() {
    return this.currentIndex === this.cards.length - 1 ? 0 : this.currentIndex + 1;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
  }
}