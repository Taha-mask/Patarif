import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BackgroundComponent } from "../components/background/background.component";
import { AdminNavbarComponent } from "./admin-navbar/admin-navbar.component";
import { CommonModule } from '@angular/common';
import { AdminProductCardComponent } from "./admin-product-card/admin-product-card.component";
import { ProductCardComponent } from "../components/pages/shop/product-card/product-card.component";
import { ChartComponent } from "./chart/chart.component";
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    BackgroundComponent,
    AdminNavbarComponent,
    CommonModule,
    AdminProductCardComponent,
    ChartComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  constructor(private router: Router, private productsService: ProductsService) { } notifications: number = 0;
  goToAddProduct() {
    // Logic to navigate to the add product page 
    console.log('Navigating to Add Product page'); this.router.navigate(['/add-product']);
  }




  // products services

  totalCarts = 0;
  deliveredCarts = 0;
  newProfiles: any[] = [];
  top3CartItems: any[] = [];
  lowStockProducts: any[] = [];
  outOfStockProducts: any[] = [];
  // status
  getTodayAndYesterdayOrders = 0;
  trend: any;
  userStats: any;
  deliveredStats: any;



  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.totalCarts = await this.productsService.getTotalCarts() || 0;

    this.deliveredCarts = await this.productsService.getDeliveredCarts() || 0;

    this.newProfiles = await this.productsService.getNewProfilesThisMonth();

    this.top3CartItems = await this.productsService.getTop3CartItemNames();

    this.lowStockProducts = await this.productsService.getLowStockProducts();

    this.outOfStockProducts = await this.productsService.getOutOfStockProducts();
    this.trend = await this.productsService.getTodayAndYesterdayOrders();

    const stats = await this.productsService.getTodayAndYesterdayOrders();
    if (stats) {

      this.getTodayAndYesterdayOrders = stats.percentage;
    }
    this.userStats = await this.productsService.getUsersThisAndLastMonth();
    this.deliveredStats = await this.productsService.getDeliveredTodayAndYesterday();

  }
}