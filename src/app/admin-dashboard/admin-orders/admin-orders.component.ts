import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { OrderCardComponent } from "./order-card/order-card.component";
import { SupabaseService } from '../../supabase.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-orders',
  imports: [AdminNavbarComponent, OrderCardComponent, CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent {
  orders: any[] = [];
  loading = false;

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      const data = await this.supabaseService.getAllOrders();
      this.orders = data.filter((order: any) => order.isDelivered === false);

      // افتراضياً خليها من الأحدث
      this.sortNewest();

    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  sortNewest() {
    this.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  sortOldest() {
    this.orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async onDeliverOrder(orderId: string) {
    await this.supabaseService.markAsDelivered(orderId);
    window.location.reload();
  }
}
