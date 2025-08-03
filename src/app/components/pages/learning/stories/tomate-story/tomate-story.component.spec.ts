import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TomateStoryComponent } from './tomate-story.component';

describe('TomateStoryComponent', () => {
  let component: TomateStoryComponent;
  let fixture: ComponentFixture<TomateStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TomateStoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TomateStoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
