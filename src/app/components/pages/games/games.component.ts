import { Component } from '@angular/core';
import { CardsComponent } from '../../cards/cards.component';
import { Card } from '../../../interface/card';
import { BackgroundComponent } from "../../background/background.component";
@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [CardsComponent, BackgroundComponent],
  standalone: true
})
export class GamesComponent {
  cardSet1: Card[] = [
    {
      title: 'Connect the dots\nFirst to win!',
      subtitle: 'Try now for free',
      img: 'images/card-2.png',
    },
    {
      title: 'Connect the dots\nFirst to win!',
      subtitle: 'Try now for free',
      img: 'images/card-3.png',
    },
    {
      title: 'Connect the dots\nFirst to win!',
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
