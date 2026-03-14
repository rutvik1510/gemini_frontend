import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UnauthorizedComponent } from './unauthorized.component';
import { AuthService } from '../../core/auth.service';

describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRoles']);

    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authServiceSpy.getRoles.and.returnValue(['ROLE_CUSTOMER']);
    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current roles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roleText = compiled.querySelector('span')?.textContent;
    expect(roleText).toContain('ROLE_CUSTOMER');
  });

  it('should navigate to home on goHome()', () => {
    component.goHome();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should go back in history on goBack()', () => {
    spyOn(window.history, 'back');
    component.goBack();
    expect(window.history.back).toHaveBeenCalled();
  });
});
