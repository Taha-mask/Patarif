import { Component, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { BackgroundComponent } from "../../background/background.component";
import { ProductCardComponent } from "./product-card/product-card.component";
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ProductsService } from '../../../services/products.service';


@Component({
  standalone: true,
  selector: 'app-shop',
  imports: [BackgroundComponent, CommonModule, ProductCardComponent, RouterLink, RouterModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {

  loading = true;  
  constructor(public productsService: ProductsService, private router: Router) {}

  categories = ['t-shirts', 'paints', 'shirts'];
  productsByCategory: Record<string, any[]> = {};

  @ViewChildren('cardsContainer') cardsContainers!: QueryList<ElementRef<HTMLDivElement>>;

  async ngOnInit() {
    for (const cat of this.categories) {
      this.productsByCategory[cat] = await this.productsService.getProductsByCategory(cat);
    }
    this.loading = false; 
  }

  navigateToProduct(productId: string) {
  this.router.navigate(['/product-details', productId]);
}


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
