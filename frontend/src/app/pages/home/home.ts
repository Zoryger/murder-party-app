import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameStatus } from '../../core/types/common.types';

interface MockGame {
  id: number; name: string; theme: string;
  playerCount: number; maxPlayers: number; status: GameStatus;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly GameStatus = GameStatus;

  games: MockGame[] = [
    { id: 1, name: 'Harry Potter 2027', theme: 'Poudlard — Vote pour le directeur',
      playerCount: 3, maxPlayers: 12, status: GameStatus.Waiting },
    { id: 2, name: 'Le Manoir Maudit',  theme: 'Famille noble dans un château',
      playerCount: 6, maxPlayers: 8,  status: GameStatus.Active },
    { id: 3, name: 'Meurtre au Gala',   theme: 'Soirée politique — Qui a tué le ministre ?',
      playerCount: 10, maxPlayers: 10, status: GameStatus.Finished },
  ];

  statusLabel: Record<GameStatus, string> = {
    [GameStatus.Waiting]:  'En attente',
    [GameStatus.Active]:   'En cours',
    [GameStatus.Finished]: 'Terminée',
  };
}