import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  constructor(private router: Router) {}

  goToAddProduct() {
    // Logic to navigate to the add product page
    console.log('Navigating to Add Product page');
    this.router.navigate(['/add-product']);
  }
}
