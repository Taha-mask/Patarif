import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
})
export class ProductCardComponent implements OnInit, OnChanges {
  fullStars: number[] = [];    
  hasHalfStar: boolean = false; 
  emptyStars: number[] = [];   

  @Input() title!: string;
  @Input() img!: string;
  @Input() price!: number;
  @Input() rate!: number;

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
