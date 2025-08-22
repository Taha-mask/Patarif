import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinesBackgroundComponent } from './lines-background.component';

describe('LinesBackgroundComponent', () => {
  let component: LinesBackgroundComponent;
  let fixture: ComponentFixture<LinesBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinesBackgroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinesBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
