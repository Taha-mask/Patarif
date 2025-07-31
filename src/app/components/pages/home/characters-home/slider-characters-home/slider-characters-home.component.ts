import { Component } from '@angular/core';
import { CarachterCardComponent } from "../carachter-card/carachter-card.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slider-characters-home',
  imports: [CarachterCardComponent,
    CommonModule,

  ],
  standalone: true,
  templateUrl: './slider-characters-home.component.html',
  styleUrl: './slider-characters-home.component.css'
})
export class SliderCharactersHomeComponent {
  designType: string = 'carousel';

  characters = [

    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif0.png',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif0.png',
      raiting: 6.0
    },

    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif0.png',
      raiting: 5.2
    }, {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif0.png',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif0.png',
      raiting: 6.0
    },

  ];

  currentIndex = 2;

  get leftIndex() {
    return this.currentIndex === 0 ? this.characters.length - 1 : this.currentIndex - 1;
  }

  get rightIndex() {
    return this.currentIndex === this.characters.length - 1 ? 0 : this.currentIndex + 1;
  }

  get left2Index() {
    if (this.currentIndex === 0) return this.characters.length - 2;
    if (this.currentIndex === 1) return this.characters.length - 1;
    return this.currentIndex - 2;
  }

  get right2Index() {
    if (this.currentIndex === this.characters.length - 1) return 1;
    if (this.currentIndex === this.characters.length - 2) return 0;
    return this.currentIndex + 2;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.characters.length) % this.characters.length;
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.characters.length;
  }
}
