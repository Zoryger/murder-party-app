import { Component, OnInit, inject } from '@angular/core';
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

  isLoading = true;
  loadError = '';

  isSubmitting = false;
  submitError = '';
  submitMsg = '';

  // Trois personnes désignées, chacune avec son mobile
  slots = [0, 1, 2];
  accused: (number | null)[] = [null, null, null];
  mobiles: string[] = ['', '', ''];

  weapon = '';
  subplots = '';
  objectiveNotes = '';

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.finale.getForm(this.gameId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.prefill(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        this.loadError = err.error?.message ?? 'Erreur de chargement.';
        this.isLoading = false;
      },
    });
  }

  // Reprend la réponse déjà rendue (le formulaire reste modifiable jusqu'à la révélation)
  private prefill(d: FinalFormData): void {
    if (!d.mine) return;
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

  get canSubmit(): boolean {
    const ids = this.accused.filter((id): id is number => id !== null);
    return (
      ids.length === this.slots.length &&
      new Set(ids).size === ids.length &&
      this.mobiles.every((m) => m.trim().length >= 2) &&
      this.weapon.trim().length >= 5
    );
  }

  submit(): void {
    if (!this.canSubmit || !this.data || this.data.readOnly) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.submitMsg = '';

    this.finale
      .submit(this.gameId, {
        accusations: this.slots.map((i) => ({
          playerId: this.accused[i] as number,
          mobile: (this.mobiles[i] ?? '').trim(),
        })),
        weapon: this.weapon.trim(),
        subplots: this.subplots.trim(),
        objectiveNotes: this.objectiveNotes.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitMsg = res.message ?? 'Réponse enregistrée.';
          this.isSubmitting = false;
        },
        error: (err) => {
          this.submitError = err.error?.message ?? 'Erreur.';
          this.isSubmitting = false;
        },
      });
  }
}
