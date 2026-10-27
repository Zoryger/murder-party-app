import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import {
  ApiResponse,
  Game,
  GameService,
  PublicPlayer,
} from '../../../core/services/game.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { GameLobby } from './game-lobby';

describe('GameLobby', () => {
  let fixture: ComponentFixture<GameLobby>;
  let component: GameLobby;
  let gameSubject: Subject<{ success: boolean; data: Game }>;
  let playersSubject: Subject<{ success: boolean; data: PublicPlayer[] }>;
  let assignmentSubject: Subject<ApiResponse<unknown>>;
  let manualAssignmentSubject: Subject<ApiResponse<unknown>>;
  let deleteGameSubject: Subject<ApiResponse<unknown>>;
  let lastManualAssignments:
    | { gamePlayerId: number; scenarioCharacterId: number | null }[]
    | null;
  let deletedGameId: number | null;

  beforeEach(async () => {
    gameSubject = new Subject();
    playersSubject = new Subject();
    assignmentSubject = new Subject();
    manualAssignmentSubject = new Subject();
    deleteGameSubject = new Subject();
    lastManualAssignments = null;
    deletedGameId = null;

    await TestBed.configureTestingModule({
      imports: [GameLobby],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        {
          provide: GameService,
          useValue: {
            getGame: () => gameSubject.asObservable(),
            getPlayers: () => playersSubject.asObservable(),
            assignCharacters: () => assignmentSubject.asObservable(),
            assignCharactersManually: (
              _gameId: number,
              assignments: { gamePlayerId: number; scenarioCharacterId: number | null }[],
            ) => {
              lastManualAssignments = assignments;
              return manualAssignmentSubject.asObservable();
            },
            deleteGame: (gameId: number) => {
              deletedGameId = gameId;
              return deleteGameSubject.asObservable();
            },
          },
        },
        {
          provide: AuthService,
          useValue: { currentUser: () => ({ id: 7 }) },
        },
        {
          provide: SocketService,
          useValue: {
            joinLobby: () => {},
            on: () => {},
            off: () => {},
            leaveLobby: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameLobby);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should stop loading and display the lobby when its data arrives', async () => {
    gameSubject.next({
      success: true,
      data: {
        id: 1,
        name: 'Partie de test',
        theme: 'Mystère',
        synopsis: '',
        status: 'waiting',
        joinCode: 'ABC123',
        createdBy: 7,
        maxPlayers: 8,
        createdAt: new Date(),
      },
    });
    playersSubject.next({ success: true, data: [] });
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Partie de test');
    expect(fixture.nativeElement.textContent).not.toContain('Chargement de la partie');
  });

  it('should update the assignment button when the request completes', async () => {
    gameSubject.next({
      success: true,
      data: {
        id: 1,
        name: 'Partie de test',
        theme: 'Mystère',
        synopsis: '',
        status: 'waiting',
        joinCode: 'ABC123',
        createdBy: 7,
        maxPlayers: 8,
        createdAt: new Date(),
      },
    });
    playersSubject.next({
      success: true,
      data: [
        {
          id: 10,
          userId: 7,
          username: 'MJ',
          scenarioCharacterId: null,
          characterName: 'Détective',
          characterRole: 'investigator',
          isAssigned: false,
          status: 'alive',
        },
      ],
    });
    await fixture.whenStable();

    component.assignCharacters();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Assignation...');

    assignmentSubject.next({ success: true, data: null });
    await fixture.whenStable();

    expect(component.isAssigning).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Assigner les personnages');
    expect(fixture.nativeElement.textContent).not.toContain('Assignation...');
  });

  it('should submit the selected manual role for each player', async () => {
    component.gameId = 1;
    component.players = [
      {
        id: 10,
        userId: 7,
        username: 'Joueur 1',
        scenarioCharacterId: null,
        characterName: 'Joueur 1',
        characterRole: 'En attente',
        isAssigned: false,
        status: 'alive',
      },
      {
        id: 11,
        userId: 8,
        username: 'Joueur 2',
        scenarioCharacterId: null,
        characterName: 'Joueur 2',
        characterRole: 'En attente',
        isAssigned: false,
        status: 'alive',
      },
    ];
    component.selectedCharacterByPlayer = { 10: 2, 11: 3 };

    component.saveManualAssignments();

    expect(lastManualAssignments).toEqual([
      { gamePlayerId: 10, scenarioCharacterId: 2 },
      { gamePlayerId: 11, scenarioCharacterId: 3 },
    ]);
    expect(component.isSavingManual).toBe(true);

    manualAssignmentSubject.next({
      success: true,
      data: null,
      message: '2 personnage(s) assigné(s).',
    });
    await fixture.whenStable();

    expect(component.isSavingManual).toBe(false);
    expect(component.actionMsg).toBe('2 personnage(s) assigné(s).');
  });

  it('should reject assigning the same role twice before submitting', () => {
    component.gameId = 1;
    component.players = [
      {
        id: 10,
        userId: 7,
        username: 'Joueur 1',
        scenarioCharacterId: null,
        characterName: 'Joueur 1',
        characterRole: 'En attente',
        isAssigned: false,
        status: 'alive',
      },
      {
        id: 11,
        userId: 8,
        username: 'Joueur 2',
        scenarioCharacterId: null,
        characterName: 'Joueur 2',
        characterRole: 'En attente',
        isAssigned: false,
        status: 'alive',
      },
    ];
    component.selectedCharacterByPlayer = { 10: 2, 11: 2 };

    component.saveManualAssignments();

    expect(lastManualAssignments).toBeNull();
    expect(component.actionMsg).toContain('ne peut pas être attribué à deux joueurs');
  });

  it('should stop saving and display an error when manual assignment fails', async () => {
    component.gameId = 1;
    component.players = [
      {
        id: 10,
        userId: 7,
        username: 'Joueur 1',
        scenarioCharacterId: null,
        characterName: 'Joueur 1',
        characterRole: 'En attente',
        isAssigned: false,
        status: 'alive',
      },
    ];
    component.selectedCharacterByPlayer = { 10: 2 };

    component.saveManualAssignments();
    manualAssignmentSubject.error(
      new HttpErrorResponse({ status: 500, error: { message: 'Échec serveur.' } }),
    );
    await fixture.whenStable();

    expect(component.isSavingManual).toBe(false);
    expect(component.actionMsg).toBe('Échec serveur.');
  });

  it('should require confirmation before deleting the game', () => {
    component.gameId = 12;
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteGame();

    expect(deletedGameId).toBeNull();
    expect(component.isDeleting).toBe(false);
  });

  it('should delete the game and return home after confirmation', async () => {
    component.gameId = 12;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.deleteGame();
    expect(deletedGameId).toBe(12);
    expect(component.isDeleting).toBe(true);

    deleteGameSubject.next({ success: true, data: null });
    deleteGameSubject.complete();
    await fixture.whenStable();

    expect(component.isDeleting).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
