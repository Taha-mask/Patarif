import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { BackgroundComponent } from "../../background/background.component";
import { ProductCardComponent } from "../../product-card/product-card.component";
import { CommonModule } from '@angular/common';
import { Product } from '../../../interface/product';

interface Category {
  name: string;
  products: Product[];
}

@Component({
  selector: 'app-shop',
  imports: [BackgroundComponent, ProductCardComponent, CommonModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {
  categories: Category[] = [
    {
      name: 'We have many beautiful clothes.',
      products: [
        { id: 1, name: 'Product 1', price: 53, rating: 4.5, image_url: 'images/shopping/product1.png' },
        { id: 2, name: 'Product 2', price: 75, rating: 3.8, image_url: 'images/shopping/product1.png' },
        { id: 3, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 4, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 5, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 6, name: 'Product 3', price: 120, rating: 4.9, image_url: 'images/shopping/product1.png' },
      ]
    },
    {
      name: 'We have many beautiful clothes.',
      products: [
        { id: 7, name: 'Product 4', price: 60, rating: 4.2, image_url: 'images/shopping/product1.png' },
        { id: 8, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 9, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 10, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
        { id: 11, name: 'Product 5', price: 80, rating: 4.1, image_url: 'images/shopping/product1.png' },
      ]
    }
    // أضف المزيد من الفئات حسب الحاجة
  ];

  @ViewChildren('cardsContainer') cardsContainers!: QueryList<ElementRef<HTMLDivElement>>;

  scrollCards(direction: 'left' | 'right', index: number) {
    const container = this.cardsContainers.toArray()[index]?.nativeElement;
    if (container) {
      const scrollAmount = container.offsetWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}
