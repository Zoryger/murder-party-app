import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { PlayerStatusBar } from './shared/components/player-status-bar/player-status-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, PlayerStatusBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}