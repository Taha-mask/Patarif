import { Component } from '@angular/core';
import { FormGroup, FormArray, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';
import { BackgroundComponent } from "../../components/background/background.component";
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackgroundComponent, AdminNavbarComponent]
})
export class AddProductComponent {
//  constructor(private supabaseService: SupabaseService){}

}
