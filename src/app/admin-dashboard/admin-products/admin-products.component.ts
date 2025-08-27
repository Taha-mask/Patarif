import { Component } from '@angular/core';
import { AdminProdouctsProductCardComponent } from "./admin-prodoucts-product-card/admin-prodoucts-product-card.component";
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { BackgroundComponent } from "../../components/background/background.component";
import { ProductsService } from '../../services/products.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-products',
  imports: [AdminProdouctsProductCardComponent, AdminNavbarComponent, BackgroundComponent, CommonModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent {
  products: any[] = [];

  constructor(private productsService: ProductsService) {}

  async ngOnInit() {
    this.products = await this.productsService.getAllProducts();
    console.log(this.products);
  }
}
