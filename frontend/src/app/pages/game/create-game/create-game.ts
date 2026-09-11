import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { ScenarioService, Scenario } from '../../../core/services/scenario.service';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-game.html',
  styleUrl: './create-game.scss',
})
export class CreateGame implements OnInit {
  private fb              = inject(FormBuilder);
  private router          = inject(Router);
  private gameService     = inject(GameService);
  private scenarioService = inject(ScenarioService);

  isSubmitting = false;
  errorMsg     = '';
  scenarios: Scenario[] = [];

  form = this.fb.group({
    name:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    theme:      ['', [Validators.required, Validators.minLength(5)]],
    synopsis:   ['', [Validators.required, Validators.minLength(30), Validators.maxLength(1000)]],
    maxPlayers: [8,  [Validators.required, Validators.min(4), Validators.max(20)]],
    scenarioId: [null as number | null],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.scenarioService.getScenarios().subscribe({
      next: (res) => this.scenarios = res.data,
      error: () => {},
    });
  }

  pickScenario(scenario: Scenario): void {
    this.form.patchValue({
      scenarioId: scenario.id,
      name:       scenario.name,
      theme:      scenario.name,
      synopsis:   scenario.pitch,
      maxPlayers: scenario.maxPlayers,
    });
  }

  clearScenario(): void {
    this.form.patchValue({ scenarioId: null });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.errorMsg     = '';

    const { name, theme, synopsis, maxPlayers, scenarioId } = this.form.value;

    this.gameService.createGame({
      name: name!, theme: theme!, synopsis: synopsis!,
      maxPlayers: Number(maxPlayers), scenarioId: scenarioId ?? null,
    }).subscribe({
      next:  (res) => this.router.navigate(['/game', res.data.id, 'lobby']),
      error: (err) => {
        this.errorMsg     = err.error?.message ?? 'Erreur lors de la création.';
        this.isSubmitting = false;
      },
    });
  }
}