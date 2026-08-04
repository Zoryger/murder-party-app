import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-game.html',
  styleUrl: './create-game.scss',
})
export class CreateGame {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private gameService = inject(GameService);

  isSubmitting = false;
  errorMsg     = '';

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
    this.errorMsg     = '';

    const { name, theme, synopsis, maxPlayers } = this.form.value;

    this.gameService.createGame({
      name: name!, theme: theme!, synopsis: synopsis!,
      maxPlayers: Number(maxPlayers),
    }).subscribe({
      next:  (res) => this.router.navigate(['/game', res.data.id, 'lobby']),
      error: (err) => {
        this.errorMsg     = err.error?.message ?? 'Erreur lors de la création.';
        this.isSubmitting = false;
      },
    });
  }
}