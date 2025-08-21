import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  image: string;
}

export interface releaseCart {
  productId: string;
  productTitle: string;
  productSize: string;
  productColor: string;
  quantity: number;
  
}
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart: CartItem[] = [];
  private countSubject = new BehaviorSubject<number>(0);
  countCart$ = this.countSubject.asObservable();

  private updateCount() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    this.countSubject.next(count);
  }

  getCart(): CartItem[] {
    return this.cart;
  }

  addToCart(product: CartItem) {
    const existing = this.cart.find(p => p.id === product.id && p.size === product.size);
    if (existing) {
      existing.quantity += product.quantity;
    } else {
      this.cart.push({ ...product });
    }
    this.updateCount();
  }

  removeFromCart(id: string, size: string) {
    this.cart = this.cart.filter(p => !(p.id === id && p.size === size));
    this.updateCount();
  }

  clearCart() {
    this.cart = [];
    this.updateCount();
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  get countCart(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

}
