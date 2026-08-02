import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-game.html',
  styleUrl: './create-game.scss',
})
export class CreateGame {
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  isSubmitting = false;

  themes = [
    'Harry Potter 2027 — Poudlard',
    'Manoir victorien — Famille noble',
    'Croisière de luxe — Milliardaires',
    'Soirée politique — Candidats présidentiels',
    'Station spatiale — Astronautes',
    'Fête de la Science — Chercheurs',
  ];

  form = this.fb.group({
    name:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    theme:      ['', [Validators.required, Validators.minLength(5)]],
    synopsis:   ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    maxPlayers: [8,  [Validators.required, Validators.min(4), Validators.max(20)]],
  });

  get f() { return this.form.controls; }

  pickTheme(t: string): void {
    this.form.patchValue({ theme: t });
    this.form.get('theme')?.markAsTouched();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    console.log('Nouvelle partie :', this.form.value);
    setTimeout(() => this.router.navigate(['/game', 1, 'lobby']), 800);
  }
}