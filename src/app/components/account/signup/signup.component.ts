import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../supabase.service';
import Swal from 'sweetalert2';
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { BackgroundComponent } from "../../background/background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, StarsBackgroundComponent, BackgroundComponent, LinesBackgroundComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  regirster!: FormGroup;

  constructor(private formBuilder: FormBuilder, private auth: SupabaseService, private router: Router) {
    this.regirster = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      lastName: ['', [Validators.minLength(2), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  submitted = false;

  isLoading = false; // حالة التحميل

  public onSubmit() {
    this.submitted = true;

    if (this.regirster.invalid) {
      this.regirster.markAllAsTouched();
      setTimeout(() => {
        this.submitted = false;
      }, 2000);
      return;
    }

    this.isLoading = true; // بدأ التحميل

    const { firstName, lastName, email, password } = this.regirster.value;

    this.auth.signUp(email, password, firstName, lastName)
      .then((res) => {
        console.log('تم التسجيل بنجاح:', res);
        Swal.fire({
          title: "Registration successful",
          text: "You will be directed to login, and register with the same account.",
          icon: "success"
        }).then(() => {
          window.location.replace('/login');
        });
      })
      .catch((error) => {
        console.error('حدث خطأ أثناء التسجيل:', error);
        Swal.fire({
          title: "Error",
          text: error,
          icon: "error"
        });
      })
      .finally(() => {
        this.isLoading = false; // انتهى التحميل
      });
  }





  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }



    // google sign in

  async signUPWithGoogle() {
   await this.auth.signInWithGoogle();
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
