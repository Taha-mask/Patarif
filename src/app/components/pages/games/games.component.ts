import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardsComponent } from '../../cards/cards.component';
import { Card } from '../../../interface/card';
import { BackgroundComponent } from "../../background/background.component";
import { LettersGameComponent } from "../../pages/games/letters-game/letters-game.component";
// import { CountryGuessingComponent } from "../../games/country-guessing/country-guessing.component";
// import { FactGameComponent } from "../../games/fact-game/fact-game.component";
@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [BackgroundComponent, CardsComponent],
  standalone: true
})
export class GamesComponent {
  constructor(private router: Router) {}

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
    
    // You can add more navigation logic for other cards here
  }

  cardSet1: Card[] = [
    {
      title: 'Organiser les lettres\nArrange the letters!',
      subtitle: 'Try now for free',
      img: 'images/card-2.png',
    },
    {
      title: 'Guess the Country\nIdentify countries!',
      subtitle: 'Try now for free',
      img: 'images/card-3.png',
    },
    {
      title: 'True or False?\nTest your knowledge!',
      subtitle: 'Try now for free',
      img: 'images/card-1.png',
    }
  ];
  cardSet2: Card[] = [
    {
      title: 'Puzzle Adventure',
      img: 'images/game-1.png',
    },
    {
      title: 'Memory Match',
      img: 'images/game-2.png',
    },
    {
      title: 'Math Challenge',
      img: 'images/game-1.png',
    },
    {
      title: 'Word Builder',
      img: 'images/game-2.png',
    },
    {
      title: 'Color Mixer',
      img: 'images/game-1.png',
    },
    {
      title: 'Shape Sorter',
      img: 'images/game-2.png',
    },
    {
      title: 'Number Quest',
      img: 'images/game-1.png',
    },
    {
      title: 'Logic Master',
      img: 'images/game-2.png',
    },
    {
      title: 'Pattern Finder',
      img: 'images/game-1.png',
    },
    {
      title: 'Speed Math',
      img: 'images/game-2.png',
    },
  ];


}
