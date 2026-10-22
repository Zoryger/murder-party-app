import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FinaleService, ResultsData } from '../../../core/services/finale.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private route = inject(ActivatedRoute);
  private finale = inject(FinaleService);

  gameId!: number;
  data: ResultsData | null = null;
  isLoading = true;
  errorMsg = '';

  verdictLabel: Record<string, string> = {
    won: '✅ Objectif atteint',
    lost: '❌ Objectif manqué',
    review: '⚖️ À juger par le MJ',
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.finale.getResults(this.gameId).subscribe({
      next: (res) => {
        this.data = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur de chargement.';
        this.isLoading = false;
      },
    });
  }

  // Largeur des barres du décompte, relative à la personne la plus accusée
  get maxAccused(): number {
    return Math.max(1, ...(this.data?.tally.map((t) => t.accusedCount) ?? [1]));
  }

  barWidth(count: number): number {
    return (count / this.maxAccused) * 100;
  }
}
