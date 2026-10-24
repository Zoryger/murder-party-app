import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClueService, GameClue } from '../../../core/services/clue.service';

@Component({
  selector: 'app-clue-board',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './clue-board.html',
  styleUrl: './clue-board.scss',
})
export class ClueBoard implements OnInit {
  private route = inject(ActivatedRoute);
  private clueService = inject(ClueService);

  gameId!: number;
  clues: GameClue[] = [];
  private loading = signal(true);
  errorMsg = '';

  get isLoading(): boolean {
    return this.loading();
  }

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.clueService.getClueBoard(this.gameId).subscribe({
      next: (res) => {
        this.clues = res.data;
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.loading.set(false);
      },
    });
  }
}
