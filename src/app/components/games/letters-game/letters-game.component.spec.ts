import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettersGameComponent } from './letters-game.component';

describe('LettersGameComponent', () => {
  let component: LettersGameComponent;
  let fixture: ComponentFixture<LettersGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettersGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettersGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
