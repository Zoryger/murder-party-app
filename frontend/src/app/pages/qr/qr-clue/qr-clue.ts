import { Component, OnInit, inject } from '@angular/core';
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
  isLoading = true;
  errorMsg = '';

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    this.qrService.getQr(slug).subscribe({
      next: (res) => {
        this.clue = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Impossible de charger cette page.';
        this.isLoading = false;
      },
    });
  }
}
