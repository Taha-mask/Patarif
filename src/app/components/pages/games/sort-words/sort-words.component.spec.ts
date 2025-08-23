import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortWordsComponent } from './sort-words.component';

describe('SortWordsComponent', () => {
  let component: SortWordsComponent;
  let fixture: ComponentFixture<SortWordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortWordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
