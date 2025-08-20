import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { CommonModule } from '@angular/common';
import { CartItem, CartService } from '../../../../services/data.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [BackgroundComponent, CommonModule],
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
    if(item.quantity <= item.maxQuantity){

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
