import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  loginForm!: FormGroup;
  toasts: { id: string; text: string }[] = [];
  showPassword = false;

  constructor(private formBuilder: FormBuilder, private auth: SupabaseService) {
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

  async onSubmit() {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      if (this.loginForm.get('email')?.invalid) {
        this.showToast('📧 Email is required and must be valid');
      }
      if (this.loginForm.get('password')?.invalid) {
        this.showToast('🔒 Password must be at least 10 characters');
      }
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      const res = await this.auth.signIn(email, password);
      const user = res?.user;

      if (!user) {
        Swal.fire({
          title: "Error",
          text: "Account does not exist or wrong password!",
          icon: "error"
        });
        return;
      }

      localStorage.setItem('welcomeMessage', JSON.stringify({
        title: "Welcome back !",
        text: "go and enjoy",
        icon: "success"
      }));

      window.location.replace('/home');
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message || "An unexpected problem occurred.",
        icon: "error"
      });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
