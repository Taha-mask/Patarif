import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { OrderCardComponent } from "./order-card/order-card.component";
import { SupabaseService } from '../../supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-orders',
  imports: [AdminNavbarComponent, OrderCardComponent, CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent {
  orders: any[] = [];
  loading = false;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadOrders();
  }

async loadOrders() {
  this.loading = true;
  try {
    const data = await this.supabaseService.getAllOrders();
    this.orders = data.filter((order: any) => order.isDelivered === false);
    
  } catch (err) {
    console.error(err);
  } finally {
    this.loading = false;
  }
}



  async onDeliverOrder(orderId: string) {
    await this.supabaseService.markAsDelivered(orderId);
    await this.loadOrders(); // تحديث القائمة
  }
}
