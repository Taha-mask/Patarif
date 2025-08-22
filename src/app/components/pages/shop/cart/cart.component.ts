import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { CommonModule } from '@angular/common';
import { CartItem, CartService } from '../../../../services/data.service';
import { HomeFooterComponent } from "../../home/home-footer/home-footer.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../../lines-background/lines-background.component";
import { SupabaseService } from '../../../../supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [BackgroundComponent, CommonModule, HomeFooterComponent, StarsBackgroundComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {

  constructor(public dataService: CartService, private supabaseService: SupabaseService
  ) { }

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
    if (item.quantity <= item.maxQuantity - 1) {

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

  // ===================================================================================================

  // link with supabase
  email: string = '';
  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      // this.displayName = user.user_metadata?.['display_name'] ?? 'name not found';
      this.email = user.email ?? 'email not found';
    };
  };

  async checkout() {



    const cart = this.dataService.getCart();
    if (cart.length === 0) return;

    try {
      // 1. انشئ cart جديد
      const newCart = await this.supabaseService.createCart(
        this.email, // TODO: جيب الايميل من auth
        this.dataService.getTotal(),
        this.dataService.countCart
      );

      // 2. ضيف cart_items
      const items = cart.map(item => ({
        cart_id: newCart.id,
        product_id: item.id,
        name: item.name,
        size: item.size,
        color: item.color,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      await this.supabaseService.addCartItems(newCart.id, items);

      // 3. فضي الكارت
      this.dataService.clearCart();

      console.log('Checkout successful 🚀');
    } catch (error: any) {
      console.error('Checkout failed:', error.message);
    }
  }


  verifyCheckout() {

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "Do you want to complete the process ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes !",
      cancelButtonText: "No !",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.checkout();
        swalWithBootstrapButtons.fire({
          title: "Requested!",
          text: "Your requests have been sent.",
          icon: "success"
        });
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire({
          title: "Cancelled",
          text: "You have cancelled your order.",
          icon: "error"
        });
      }
    });


  }
}
