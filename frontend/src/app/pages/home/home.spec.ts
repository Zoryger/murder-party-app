import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Home } from './home';
import { ApiResponse, Game, GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let gamesSubject: Subject<ApiResponse<Game[]>>;

  beforeEach(async () => {
    gamesSubject = new Subject<ApiResponse<Game[]>>();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: GameService,
          useValue: {
            getGames: () => gamesSubject.asObservable(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => false,
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
});
