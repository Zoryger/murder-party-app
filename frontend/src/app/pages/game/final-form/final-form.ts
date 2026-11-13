import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinaleService, FinalFormData } from '../../../core/services/finale.service';

@Component({
  selector: 'app-final-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './final-form.html',
  styleUrl: './final-form.scss',
})
export class FinalFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private finale = inject(FinaleService);

  gameId!: number;
  data: FinalFormData | null = null;

  private loading = signal(true);
  loadError = '';

  private submitting = signal(false);
  submitError = '';
  submitMsg = '';

  get isLoading(): boolean {
    return this.loading();
  }

  get isSubmitting(): boolean {
    return this.submitting();
  }

  slots = [0];
  accused: (number | null)[] = [null];
  mobiles: string[] = [''];

  weapon = '';
  subplots = '';
  objectiveNotes = '';

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.finale.getForm(this.gameId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.prefill(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError = err.error?.message ?? 'Erreur de chargement.';
        this.loading.set(false);
      },
    });
  }

  // Reprend la réponse déjà rendue (le formulaire reste modifiable jusqu'à la révélation)
  private prefill(d: FinalFormData): void {
    if (!d.mine) return;
    this.slots = d.mine.accusations.map((_, i) => i);
    this.accused = this.slots.map(() => null);
    this.mobiles = this.slots.map(() => '');
    d.mine.accusations.forEach((a, i) => {
      this.accused[i] = a.playerId;
      this.mobiles[i] = a.mobile;
    });
    this.weapon = d.mine.weapon;
    this.subplots = d.mine.subplots;
    this.objectiveNotes = d.mine.objectiveNotes;
  }

  label(p: { id: number; characterName: string }): string {
    return p.characterName + (p.id === this.data?.myPlayerId ? ' (vous)' : '');
  }

  // Une personne déjà choisie dans un autre emplacement ne peut pas l'être deux fois
  isTaken(playerId: number, slot: number): boolean {
    return this.accused.some((id, i) => i !== slot && id === playerId);
  }

  addAccusation(): void {
    if (!this.data || this.slots.length >= this.data.maxAccusations) return;
    this.slots.push(this.slots.length);
    this.accused.push(null);
    this.mobiles.push('');
  }

  removeAccusation(): void {
    if (!this.data || this.slots.length <= this.data.minAccusations) return;
    this.slots.pop();
    this.accused.pop();
    this.mobiles.pop();
  }

  get canSubmit(): boolean {
    const ids = this.accused.filter((id): id is number => id !== null);
    return (
      ids.length >= (this.data?.minAccusations ?? 1) &&
      ids.length === this.slots.length &&
      new Set(ids).size === ids.length &&
      this.mobiles.every((m) => m.trim().length >= 2) &&
      this.weapon.trim().length >= 5
    );
  }

  submit(): void {
    if (!this.canSubmit || !this.data || this.data.readOnly) return;

    this.submitting.set(true);
    this.submitError = '';
    this.submitMsg = '';

    this.finale
      .submit(this.gameId, {
        accusations: this.slots.map((_, i) => ({
          playerId: this.accused[i]!,
          mobile: this.mobiles[i]!.trim(),
        })),
        weapon: this.weapon.trim(),
        subplots: this.subplots.trim(),
        objectiveNotes: this.objectiveNotes.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitMsg = res.message ?? 'Réponse enregistrée.';
          this.submitting.set(false);
        },
        error: (err) => {
          this.submitError = err.error?.message ?? 'Erreur.';
          this.submitting.set(false);
        },
      });
  }
}
