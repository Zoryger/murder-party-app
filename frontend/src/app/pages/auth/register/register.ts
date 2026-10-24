import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  private submitting = signal(false);
  errorMsg     = '';

  get isSubmitting(): boolean {
    return this.submitting();
  }

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    this.errorMsg     = '';

    const { username, email, password } = this.form.value;

    this.auth.register(username!, email!, password!).subscribe({
      next:  () => this.router.navigate(['/']),
      error: (err) => {
        this.errorMsg     = err.error?.message ?? 'Erreur lors de l\'inscription.';
        this.submitting.set(false);
      },
    });
  }
}