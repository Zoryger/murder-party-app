import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Home } from './home';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        {
          provide: GameService,
          useValue: {
            getGames: () => of({ success: true, data: [] }),
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

  it('should stop loading when games are loaded', () => {
    expect(component.isLoading).toBeFalsy();
  });
});
