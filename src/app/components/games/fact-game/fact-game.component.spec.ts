import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactGameComponent } from './fact-game.component';

describe('FactGameComponent', () => {
  let component: FactGameComponent;
  let fixture: ComponentFixture<FactGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
