import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private submitting = signal(false);
  errorMsg = '';
  infoMsg = '';

  get isSubmitting(): boolean {
    return this.submitting();
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('sessionExpired')) {
      this.infoMsg = 'Ta session a expiré — reconnecte-toi pour continuer.';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMsg = '';

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigateByUrl(this.safeReturnUrl()),
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur de connexion.';
        this.submitting.set(false);
      },
    });
  }

  // N'accepte que les chemins internes (jamais une URL externe)
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
