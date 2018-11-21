import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorchartComponent } from './Donorchart.component';

describe('DonorchartComponent', () => {
  let component: DonorchartComponent;
  let fixture: ComponentFixture<DonorchartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DonorchartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DonorchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


