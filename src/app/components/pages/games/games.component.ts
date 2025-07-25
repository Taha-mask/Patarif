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


}
