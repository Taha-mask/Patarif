import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-fav-pro-card',
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './fav-pro-card.component.html',
  styleUrl: './fav-pro-card.component.css'
})
export class FavProCardComponent {
 fullStars: number[] = [];
  hasHalfStar: boolean = false;
  emptyStars: number[] = [];

  @Input() title!: string;
  @Input() img!: string;
  @Input() price!: number;
  @Input() rate!: number;
  @Input() product: any;  

  // @Output() productClicked: EventEmitter<string> = new EventEmitter();

  // onCardClick() {
  //   this.productClicked.emit(this.product.id); // يبعث الـ id للـ parent
  // }

  ngOnInit() {
    if (this.rate !== undefined) {
      this.setStars(this.rate);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rate'] && changes['rate'].currentValue !== undefined) {
      this.setStars(changes['rate'].currentValue);
    }
  }

  setStars(rating: number) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    this.fullStars = Array(full).fill(0);
    this.hasHalfStar = half;
    this.emptyStars = Array(empty).fill(0);
  }
}
