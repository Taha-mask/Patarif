import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { Card } from '../../interface/card';

@Component({
  selector: 'app-cards',
  imports: [NgFor],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css'],
  standalone: true
})
export class CardsComponent {
  @Input() cards: Card[] = [];
  currentIndex = 1;

  get leftIndex() { return (this.currentIndex - 1 + this.cards.length) % this.cards.length; }
  get rightIndex() { return (this.currentIndex + 1) % this.cards.length; }

  prevSlide() {
    this.currentIndex = this.leftIndex;
  }

  nextSlide() {
    this.currentIndex = this.rightIndex;
  }
}