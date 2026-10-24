import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QrService, QrClueView } from '../../../core/services/qr.service';

@Component({
  selector: 'app-qr-clue',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './qr-clue.html',
  styleUrl: './qr-clue.scss',
})
export class QrClue implements OnInit {
  private route = inject(ActivatedRoute);
  private qrService = inject(QrService);

  clue: QrClueView | null = null;
  private loading = signal(true);
  errorMsg = '';

  get isLoading(): boolean {
    return this.loading();
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    this.qrService.getQr(slug).subscribe({
      next: (res) => {
        this.clue = res.data;
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Impossible de charger cette page.';
        this.loading.set(false);
      },
    });
  }
}
