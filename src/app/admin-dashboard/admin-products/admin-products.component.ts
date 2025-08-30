import { Component } from '@angular/core';
import { AdminProdouctsProductCardComponent } from "./admin-prodoucts-product-card/admin-prodoucts-product-card.component";
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { BackgroundComponent } from "../../components/background/background.component";
import { ProductsService } from '../../services/products.service';
import { CommonModule } from '@angular/common';
import { ProductFormComponent } from "./product-form/product-form.component";

@Component({
  selector: 'app-admin-products',
  imports: [
    AdminProdouctsProductCardComponent,
    AdminNavbarComponent,
    CommonModule,
    ProductFormComponent
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent {
  productForm: boolean = false;
  products: any[] = [];

  constructor(private productsService: ProductsService) {}

  async ngOnInit() {
    const rawProducts = await this.productsService.getAllProducts();

    this.products = rawProducts.map(p => {
      const sizes: string[] = [];
      p.product_colors?.forEach((c: any) => {
        c.product_sizes?.forEach((s: any) => {
          sizes.push(s.size_name);
        });
      });

      const colors: string[] = [];
      p.product_colors?.forEach((c: any) => {
        if (c.color_code) {
          colors.push(c.color_code);
        }
      });

      return {
        ...p,
        size: sizes.join(', '),
        colors 
      };
    });

    console.log(this.products);
  }

  // save & close product form
  showForm = false;

  openForm() {
    this.showForm = true;
  }

  reload() {
    this.productsService.getAllProducts();
  }

  onFormClosed() {
    this.showForm = false;
  }
}
