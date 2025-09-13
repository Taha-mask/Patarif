import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingPageComponent } from './drawing-page.component';

describe('DrawingPageComponent', () => {
  let component: DrawingPageComponent;
  let fixture: ComponentFixture<DrawingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
