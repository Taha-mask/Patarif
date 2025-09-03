import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BackgroundComponent } from "../components/background/background.component";
import { AdminNavbarComponent } from "./admin-navbar/admin-navbar.component";
import { CommonModule } from '@angular/common';
import { AdminProductCardComponent } from "./admin-product-card/admin-product-card.component";
import { ProductCardComponent } from "../components/pages/shop/product-card/product-card.component";
import { ChartComponent } from "./chart/chart.component";
import { ProductsService } from '../services/products.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterModule,
    AdminNavbarComponent,
    CommonModule,
    AdminProductCardComponent,
    ChartComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  constructor(private router: Router, private productsService: ProductsService, private supabaseService: SupabaseService
  ) {
    document.addEventListener('click', () => {
      this.menuOpen = false;
    });
  } notifications: number = 0;
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






  // profile image
  profileImage: string = "images/admin.png";
  userName: string | null = null;
  isLogged: boolean = false;
  menuOpen = false;

  private subs: Subscription = new Subscription();


  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'images/admin.png';
  }

  async ngOnInit() {
    await this.loadData();

    const sessionData = await this.supabaseService.getSession();
    if (sessionData) {
      const user = sessionData.user;
      if (user) {
        this.isLogged = true;
        this.userName = user.email?.split('@')[0] || "Guest";
        // set initial image (this will also push to subject in service)
        const url = await this.supabaseService.getProfileImage(user.id);
        this.profileImage = url || 'images/account.png';
      } else {
        this.isLogged = false;
      }
    } else {
      this.isLogged = false;
    }

    this.subs.add(
      this.supabaseService.profileImage$.subscribe((url) => {
        if (url) this.profileImage = url;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}