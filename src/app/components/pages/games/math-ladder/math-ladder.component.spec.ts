import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MathLadderComponent } from './math-ladder.component';

describe('MathLadderComponent', () => {
  let component: MathLadderComponent;
  let fixture: ComponentFixture<MathLadderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MathLadderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MathLadderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
