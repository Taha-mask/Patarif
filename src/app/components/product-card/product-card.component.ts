import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interface/product';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  imports: [CommonModule]
})
export class ProductCardComponent {
    @Input() product!: Product; // يستقبل بيانات منتج واحد
 
  // card:
  // card.component.ts
 rating: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && this.product) {
      this.rating = this.product.rating || 0;
    }
  }

  fullStars: any[] = [];
  emptyStars: any[] = [];
  hasHalfStar: boolean = false;

  ngOnInit() {
    this.setStars(this.rating);
  }

  setStars(value: number) {
    let rounded = Math.round(value * 2) / 2; // تقريب لأقرب نص
    let full = Math.floor(rounded);
    let half = rounded % 1 !== 0;

    this.fullStars = Array(full).fill(0);
    this.hasHalfStar = half;
    this.emptyStars = Array(5 - full - (half ? 1 : 0)).fill(0);
  }
}