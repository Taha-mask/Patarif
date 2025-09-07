import { Component } from '@angular/core';
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { SupabaseService } from '../../../supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HomeFooterComponent } from "../home/home-footer/home-footer.component";

@Component({
  selector: 'app-contact-us',
  imports: [
    StarsBackgroundComponent,
    LinesBackgroundComponent,
    FormsModule,
    CommonModule,
    HomeFooterComponent
],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
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

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router
  ) { }
 async handleProtectedAction(event: Event) {
  event.preventDefault();

  if (await this.authService.isLoggedIn()) {
    this.onSubmit(event);
  } else {
    Swal.fire({
      title: 'Vous devez vous connecter',
      text: 'Vous devez avoir un compte pour continuer.',
      icon: 'warning',
      confirmButtonText: 'Connexion'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/login']);
      }
    });
  }
}

async onSubmit(event: Event) {
  event.preventDefault();

  const { first_name, last_name, email, phone, message } = this.formData;

  if (!first_name || !last_name || !email || !phone || !message) {
    Swal.fire({
      title: 'Informations manquantes',
      text: 'Veuillez remplir tous les champs obligatoires avant de soumettre.',
      icon: 'warning',
      confirmButtonText: 'OK'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire({
      title: 'Email invalide',
      text: 'Veuillez entrer une adresse email valide.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(phone)) {
    Swal.fire({
      title: 'Téléphone invalide',
      text: 'Le numéro de téléphone doit contenir uniquement des chiffres (optionnellement commençant par +).',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  this.isLoading = true;
  this.success = false;
  this.error = null;

  try {
    await this.supabaseService.sendContactForm(this.formData);
    this.success = true;

    this.formData = { first_name: '', last_name: '', email: '', phone: '', message: '' };

    Swal.fire({
      title: 'Succès !',
      text: 'Votre message a été envoyé avec succès.',
      icon: 'success',
      confirmButtonText: 'OK'
    });
  } catch (error: any) {
    this.error = error.message || 'Erreur lors de l’envoi';
    Swal.fire({
      title: 'Erreur',
      text: this.error ?? 'Erreur inconnue',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  } finally {
    this.isLoading = false;
  }
}


}
