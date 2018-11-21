import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockchainProgressComponent } from './blockchain-progress.component';

describe('BlockchainProgressComponent', () => {
  let component: BlockchainProgressComponent;
  let fixture: ComponentFixture<BlockchainProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockchainProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockchainProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
