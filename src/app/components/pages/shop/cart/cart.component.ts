import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { CommonModule } from '@angular/common';
import { CartItem, CartService } from '../../../../services/data.service';
import { HomeFooterComponent } from "../../home/home-footer/home-footer.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../../lines-background/lines-background.component";
import { SupabaseService } from '../../../../supabase.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, HomeFooterComponent, StarsBackgroundComponent, FormsModule],
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
  shipping: number = 4.5;
  get total() {
    return this.dataService.getTotal();
  }
  totalAfterShipping() {
    return this.total + this.shipping;
  }


  // ===================================================================================================

  // Form model
  contact = {
    name: '',
    phone: '',
    department: '',
    otherPlace: '',
    isDelivered: false,
    note: ''
  };
  showContactInfo: boolean = false;
  frenchDepartments: { code: string; name: string }[] = [];
  selectedDepartment: string = '';
  // link with supabase
  email: string = '';
  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      // this.displayName = user.user_metadata?.['display_name'] ?? 'name not found';
      this.email = user.email ?? 'email not found';
    };
    // =============================== select location ========================================
    this.frenchDepartments = await this.supabaseService.getFrenchDepartments();
    this.frenchDepartments.push({ code: 'Other', name: 'Other' });
  };


  async saveContact() {
    if (!this.isContactInfoNotNull()) {
      alert("Please fill all required fields");
      return;
    }

    this.showContactInfo = false;
    console.log("Contact info saved:", this.contact);
  }

  isContactInfoNotNull() {
    if (!this.contact.name || !this.contact.phone || !this.contact.department) {
      return false;
    }

    if (this.contact.department === 'Other Other' && !this.contact.otherPlace) {
      return false;
    }

    return true;
  }

  async checkout() {
    const cart = this.dataService.getCart();
    if (cart.length === 0) return;

    try {
      const newCart = await this.supabaseService.createCart(
        this.email,                   // userEmail
        this.contact.name,            // name
        this.contact.phone,           // phone
        this.contact.department,      // department
        this.contact.note,            // note
        this.total,                   // subtotal (sum of items)
        this.totalAfterShipping(),    // total (subtotal + shipping)
        this.dataService.countCart    // count
      );


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
          text: "Your requests have been sent.\n -We will contact with you soon - wait us",
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
