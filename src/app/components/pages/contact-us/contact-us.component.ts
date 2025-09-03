import { Component } from '@angular/core';
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { SupabaseService } from '../../../supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  imports: [StarsBackgroundComponent, LinesBackgroundComponent,
    FormsModule,
    CommonModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  formData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  };

  isLoading = false;
  success = false;
  error: string | null = null;

  constructor(private supabaseService: SupabaseService) { }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.isLoading = true;
    this.success = false;
    this.error = null;

    try {
      await this.supabaseService.sendContactForm(this.formData);
      this.success = true;
      this.formData = { first_name: '', last_name: '', email: '', phone: '', message: '' };
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de l’envoi';
    } finally {
      this.isLoading = false;
    }
  }
}
