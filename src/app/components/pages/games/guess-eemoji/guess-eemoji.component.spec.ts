import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuessEemojiComponent } from './guess-eemoji.component';

describe('GuessEemojiComponent', () => {
  let component: GuessEemojiComponent;
  let fixture: ComponentFixture<GuessEemojiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuessEemojiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuessEemojiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
