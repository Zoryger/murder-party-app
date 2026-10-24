import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
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

  beforeEach(async () => {
    gameSubject = new Subject();
    playersSubject = new Subject();
    assignmentSubject = new Subject();

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
});
