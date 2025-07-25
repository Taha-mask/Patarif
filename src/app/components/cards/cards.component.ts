import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../interface/card';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent {
  @Input() cards: Card[] = [];
  currentIndex = 0;


  get leftIndex() {
    if (!this.cards.length) return 0;
    return (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }
  get rightIndex() {
    if (!this.cards.length) return 0;
    return (this.currentIndex + 1) % this.cards.length;
  }

  prevSlide() {
    if (!this.cards.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  nextSlide() {
    if (!this.cards.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
  }
}
