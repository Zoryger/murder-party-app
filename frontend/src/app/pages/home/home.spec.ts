import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { Home } from './home';
import { ApiResponse, Game, GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let gamesSubject: Subject<ApiResponse<Game[]>>;
  let deleteGameSubject: Subject<ApiResponse<unknown>>;
  let requestedGameId: number | null;

  beforeEach(async () => {
    gamesSubject = new Subject<ApiResponse<Game[]>>();
    deleteGameSubject = new Subject<ApiResponse<unknown>>();
    requestedGameId = null;

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: GameService,
          useValue: {
            getGames: () => gamesSubject.asObservable(),
            deleteGame: (gameId: number) => {
              requestedGameId = gameId;
              return deleteGameSubject.asObservable();
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            currentUser: () => ({ id: 7 }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should stop loading and update the view when games are loaded', async () => {
    gamesSubject.next({ success: true, data: [] });
    await fixture.whenStable();

    expect(component.isLoading).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('Aucune partie disponible.');
  });

  it('should show an error when loading games fails', async () => {
    gamesSubject.error(new Error('Request failed'));
    await fixture.whenStable();

    expect(component.isLoading).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les parties.');
  });

  it('should let the creator delete a finished game from the homepage', async () => {
    const finishedGame: Game = {
      id: 12,
      name: 'Partie terminée',
      theme: 'Mystère',
      synopsis: 'Synopsis de test',
      status: 'finished',
      joinCode: 'ABC123',
      createdBy: 7,
      maxPlayers: 8,
      createdAt: new Date(),
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    gamesSubject.next({ success: true, data: [finishedGame] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('🗑️ Supprimer');
    expect(component.canDelete(finishedGame)).toBe(true);

    component.deleteGame(finishedGame);
    expect(requestedGameId).toBe(12);

    deleteGameSubject.next({ success: true, data: null });
    deleteGameSubject.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.games).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Aucune partie disponible.');
  });

  it('should not let a user delete a game created by somebody else', async () => {
    const otherGame: Game = {
      id: 13,
      name: 'Partie autre MJ',
      theme: 'Mystère',
      synopsis: 'Synopsis de test',
      status: 'finished',
      joinCode: 'DEF456',
      createdBy: 8,
      maxPlayers: 8,
      createdAt: new Date(),
    };

    gamesSubject.next({ success: true, data: [otherGame] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.canDelete(otherGame)).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('🗑️ Supprimer');
  });
});
