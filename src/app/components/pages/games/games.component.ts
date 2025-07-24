import { Component } from '@angular/core';
import { CardsComponent } from '../../cards/cards.component';
import { Card } from '../../../interface/card';
@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [CardsComponent],
  standalone: true
})
export class GamesComponent {
  cardSet1: Card[] = [
    {
      title: 'Connect the dots\nFirst to win!',
      subtitle: 'Try now for free',
      bg: 'linear-gradient(120deg, #4f8cff, #6be0ff)',
      image: 'https://cdn-icons-png.flaticon.com/512/3465/3465156.png'
    },
    {
      title: 'Connect the dots\nFirst to win!',
      subtitle: 'Try now for free',
      bg: 'linear-gradient(120deg, #ff4f8c, #ff6be0)',
      image: 'https://cdn-icons-png.flaticon.com/512/3465/3465157.png'
    },
    {
      title: 'Connect the dots\nFirst to win!',
      subtitle: 'Try now for free',
      bg: 'linear-gradient(120deg, #ff4f8c, #ff6be0)',
      image: 'https://cdn-icons-png.flaticon.com/512/3465/3465157.png'
    }
  ];


}
