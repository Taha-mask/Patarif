import { Component, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { BackgroundComponent } from "../../background/background.component";
import { ProductCardComponent } from "./product-card/product-card.component";
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import Swal from 'sweetalert2';
import { CartButtonComponent } from "./cart-button/cart-button.component";
import { CartService } from '../../../services/data.service';
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { HomeFooterComponent } from "../home/home-footer/home-footer.component";


@Component({
  standalone: true,
  selector: 'app-shop',
  imports: [BackgroundComponent, CommonModule, ProductCardComponent, RouterModule, CartButtonComponent, LinesBackgroundComponent, StarsBackgroundComponent, HomeFooterComponent],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {

  loading = true;
  constructor(public productsService: ProductsService, private router: Router, private dataService: CartService) { }

  categories = ['t-shirts', 'pants', 'shirts', 'other'];
  productsByCategory: Record<string, any[]> = {};

  @ViewChildren('cardsContainer') cardsContainers!: QueryList<ElementRef<HTMLDivElement>>;

  async ngOnInit() {
    for (const cat of this.categories) {
      this.productsByCategory[cat] = await this.productsService.getProductsByCategory(cat);
    }
    this.loading = false;
  }

  //   handleNavigate(productId: string) {
  //   this.navigateToProduct(productId);
  // }

  navigateToProduct(productId: string):void {
    this.router.navigate(['/product-details', productId]);
  }
  
  // handleAction = (id: string) => { navigateToProduct(id) };

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
