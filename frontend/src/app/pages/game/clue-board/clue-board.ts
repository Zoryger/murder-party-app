import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClueService, GameClue } from '../../../core/services/clue.service';

@Component({
  selector: 'app-clue-board',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './clue-board.html',
  styleUrl: './clue-board.scss',
})
export class ClueBoard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clueService = inject(ClueService);
  private changeDetector = inject(ChangeDetectorRef);

  gameId!: number;
  clues: GameClue[] = [];
  private loading = signal(true);
  errorMsg = '';
  password = '';
  feedback = '';
  feedbackError = false;
  isUnlocking = false;

  get isLoading(): boolean {
    return this.loading();
  }

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.clueService.getClueBoard(this.gameId).subscribe({
      next: (res) => {
        this.clues = res.data;
        this.loading.set(false);
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.loading.set(false);
        this.changeDetector.markForCheck();
      },
    });
  }

  unlockClue(): void {
    const password = this.password.trim();
    if (!password || this.isUnlocking) return;

    this.isUnlocking = true;
    this.feedback = '';
    this.feedbackError = false;
    this.clueService.unlockClue(this.gameId, password).subscribe({
      next: (res) => {
        this.feedback = res.message ?? 'Indice débloqué.';
        this.password = '';
        this.clueService.getClueBoard(this.gameId).subscribe({
          next: (board) => {
            this.clues = board.data;
            this.isUnlocking = false;
            this.changeDetector.markForCheck();
          },
          error: (err) => {
            this.errorMsg = err.error?.message ?? 'Impossible de recharger les indices.';
            this.isUnlocking = false;
            this.changeDetector.markForCheck();
          },
        });
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.feedback = err.error?.message ?? 'Impossible de débloquer cet indice.';
        this.feedbackError = true;
        this.isUnlocking = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  openQrClue(slug: string): void {
    void this.router.navigate(['/qr', slug], {
      queryParams: { gameId: this.gameId },
    });
  }
}
