import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { OrderCardComponent } from "./order-card/order-card.component";

@Component({
  selector: 'app-admin-orders',
  imports: [AdminNavbarComponent, OrderCardComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent {

}
