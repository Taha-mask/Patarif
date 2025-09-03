import { Component, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { CartService } from '../../../services/data.service';
import { ProductCardComponent } from "./product-card/product-card.component";
import { CartButtonComponent } from "./cart-button/cart-button.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { HomeFooterComponent } from "../home/home-footer/home-footer.component";
import { LoadingComponent } from "../../loading/loading.component";

@Component({
  standalone: true,
  selector: 'app-shop',
  imports: [
    CommonModule,
    ProductCardComponent,
    RouterModule,
    CartButtonComponent,
    LinesBackgroundComponent,
    StarsBackgroundComponent,
    HomeFooterComponent,
    LoadingComponent
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {
  loading = true;
  hasProducts = false;
  categoriesCount = 0; 

  categories = ['t-shirts', 'pants', 'shirts', 'other'];
  productsByCategory: Record<string, any[]> = {};

  @ViewChildren('cardsContainer') cardsContainers!: QueryList<ElementRef<HTMLDivElement>>;

  constructor(
    public productsService: ProductsService,
    private router: Router,
    private dataService: CartService
  ) { }

  async ngOnInit() {
    for (const cat of this.categories) {
      this.productsByCategory[cat] = await this.productsService.getProductsByCategory(cat);
    }

    this.hasProducts = Object.values(this.productsByCategory).some(arr => arr.length > 0);

    this.categoriesCount = Object.values(this.productsByCategory).filter(arr => arr.length > 0).length;


    this.loading = false;
  }

  navigateToProduct(productId: string): void {
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
