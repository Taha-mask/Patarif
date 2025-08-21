import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { CommonModule } from '@angular/common';
import { CartItem, CartService } from '../../../../services/data.service';
import { HomeFooterComponent } from "../../home/home-footer/home-footer.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../../lines-background/lines-background.component";

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [BackgroundComponent, CommonModule, HomeFooterComponent, StarsBackgroundComponent, LinesBackgroundComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {

  constructor(private dataService: CartService) {}

  get cart(): CartItem[] {
    return this.dataService.getCart();
  }

  removeItem(item: CartItem) {
    this.dataService.removeFromCart(item.id, item.size);
  }

  getSubtotal(item: CartItem) {
    return item.price * item.quantity;
  }

  increaseQuantity(item: CartItem) {
    if(item.quantity <= item.maxQuantity - 1){

      item.quantity++;
    }
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  get total() {
    return this.dataService.getTotal();
  }
}
