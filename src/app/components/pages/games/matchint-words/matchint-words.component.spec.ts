import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchintWordsComponent } from './matchint-words.component';

describe('MatchintWordsComponent', () => {
  let component: MatchintWordsComponent;
  let fixture: ComponentFixture<MatchintWordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchintWordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchintWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
