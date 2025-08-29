import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-prodoucts-product-card',
  imports: [CommonModule],
  templateUrl: './admin-prodoucts-product-card.component.html',
  styleUrl: './admin-prodoucts-product-card.component.css'
})
export class AdminProdouctsProductCardComponent {
  @Input() img!: string;
  @Input() title!: string;
  @Input() category!: string;
  @Input() stock!: number;
  @Input() size!: string;
  @Input() price!: number;
  @Input() productId!: string;
  @Output() productAdded = new EventEmitter<void>();


  constructor(private productsService: ProductsService) {
  }
  // delte product
  async onDelete() {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        try {
         this.productsService.deleteProduct(this.productId);
          console.log(`✅ Product ${this.productId} deleted successfully`);
        } catch (err) {
          console.error('❌ Error deleting product:', err);
        }
        Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success"
        });
      }
    });

  }

}
