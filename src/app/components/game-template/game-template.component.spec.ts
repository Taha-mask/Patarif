import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTemplateComponent } from './game-template.component';

describe('GameTemplateComponent', () => {
  let component: GameTemplateComponent;
  let fixture: ComponentFixture<GameTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
