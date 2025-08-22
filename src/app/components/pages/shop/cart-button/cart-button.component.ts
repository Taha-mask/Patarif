import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../services/data.service';
@Component({
  selector: 'app-cart-button',
  imports: [CommonModule],
  templateUrl: './cart-button.component.html',
  styleUrls: ['./cart-button.component.css']
})
export class CartButtonComponent {
  constructor(private router: Router, public dataService: CartService) { }


  // navigate to cart page

  goToCart() {
    this.router.navigate(['/cart']);             // التنقل لصفحة تانية
  }

}
