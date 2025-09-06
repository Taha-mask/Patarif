import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardsComponent } from '../../cards/cards.component';
import { Card } from '../../../interface/card';
import { BackgroundComponent } from "../../background/background.component";
import { LettersGameComponent } from "../../pages/games/letters-game/letters-game.component";
// import { CountryGuessingComponent } from "../../games/country-guessing/country-guessing.component";
// import { FactGameComponent } from "../../games/fact-game/fact-game.component";
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [BackgroundComponent, CardsComponent, StarsBackgroundComponent, LinesBackgroundComponent],
  standalone: true
})
export class GamesComponent {
  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  onCardClick(event: {card: Card, index: number}) {
    // If first card is clicked, navigate to letters game
    if (event.index === 0) {
      this.router.navigate(['/letters-game']);
    }
    // If second card is clicked, navigate to country guessing game
    else if (event.index === 1) {
      this.router.navigate(['/country-guessing']);
    }
    // If third card is clicked, navigate to fact game
    else if (event.index === 2) {
      this.router.navigate(['/fact-game']);
    }
    else if (event.index === 3) {
      this.router.navigate(['/gallery']);
    }
   
    else if (event.index === 4) {
      this.router.navigate(['/sort-words']);
    }
    else if (event.index === 5) {
      this.router.navigate(['/guess-eemoji']);
    }
    else if (event.index === 6) {
      this.router.navigate(['/matchint-words']);
    }
    else if (event.index === 7) {
      this.router.navigate(['/math-ladder']);
    }
    else if (event.index === 8) {
      this.router.navigate(['/geo-quiz']);
    }
  }

  cardSet1: Card[] = [
    {
      img: '/images/1111.jpg',
      route: '/gallery'
    },
    {
      img: 'images/2222.jpg',
      route: '/games/math-ladder'
    },
    {
      img: 'images/3333.jpg',
      route: '/games/geo-quiz'
    }
  ];
  cardSet2: Card[] = [
    {
      title: 'Trier les lettres',
      img: '/images/sort.jpg',
    },
    {
      title: 'Deviner le pays',
      img: '/images/place.jpg',
    },
    {
      title: 'Vrai ou Faux',
      img: '/images/fact.jpg',
    },
    {
      title: 'Peinture',
      img: '/images/paint.jpg',
    },
    {
      title: 'Trier les mots',
      img: '/images/sortword.jpg',
    },
    {
      title: 'Deviner l\'emoji',
      img: '/images/emoji.jpg',
    },
    {
      title: 'Mot à Image',
      img: 'images/matching.jpg',
    },
    {
      title: 'Escalier Mathématique',
      img: 'images/math.jpg',
    },
    {
      title: 'Quiz Géographie',
      img: 'images/map.jpg',
    },

  ];
}