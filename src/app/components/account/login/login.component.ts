import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  [x: string]: any;
  loginForm!: FormGroup;
  toasts: { id: string; text: string }[] = [];
  showPassword = false;

  constructor(private formBuilder: FormBuilder, private auth: SupabaseService, private router: Router) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  showToast(text: string) {
    const id = Date.now().toString();
    this.toasts.push({ id, text });

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 2000);
  }
  isLoading = false; async onSubmit() {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      if (this.loginForm.get('email')?.invalid) {
        this.showToast('📧 Email requis et doit être valide');
      }
      if (this.loginForm.get('password')?.invalid) {
        this.showToast('🔒 Le mot de passe doit contenir au moins 10 caractères');
      }
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    try {
      const res = await this.auth.signIn(email, password);

      if (!res.user) {
        Swal.fire({
          title: "Erreur",
          text: "Le compte n'existe pas ou le mot de passe est incorrect !",
          icon: "error"
        });
        return;
      }

      localStorage.setItem('welcomeMessage', JSON.stringify({
        title: "Bienvenue !",
        text: "Allez et profitez-en",
        icon: "success"
      }));

      if (res.isAdmin) {
        window.location.replace('/admin-dashboard');
      } else {
        window.location.replace('/home');
      }

    } catch (error: any) {
      Swal.fire({
        title: "Erreur",
        text: error.message || "Un problème inattendu est survenu.",
        icon: "error"
      });
    } finally {
      this.isLoading = false;
    }
  }


  togglePassword() {
    this.showPassword = !this.showPassword;
  }


  // google sign in

  loginWithGoogle() {
    this.auth.signInWithGoogle();

  }


  // login with facebook
  async loginWithFacebook() {
    try {
      await this.auth.signInWithFacebook();
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}
