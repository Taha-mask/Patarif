import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  regirster!: FormGroup;

  constructor(private formBuilder: FormBuilder, private auth: SupabaseService) {
    this.regirster = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      lastName: ['', [Validators.minLength(2), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  submitted = false;

  public onSubmit() {
    this.submitted = true;

    if (this.regirster.invalid) {
      this.regirster.markAllAsTouched();

      setTimeout(() => {
        this.submitted = false;
      }, 20000);

      return;
    }

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
      });
  }




  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}
