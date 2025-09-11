import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageReceiverComponent } from './image-receiver.component';

describe('ImageReceiverComponent', () => {
  let component: ImageReceiverComponent;
  let fixture: ComponentFixture<ImageReceiverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageReceiverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageReceiverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
