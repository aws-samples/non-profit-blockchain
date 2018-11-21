import { Component, OnInit } from '@angular/core';
import { DonorService } from 'src/app/services/shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ngo-blockchain';

  constructor(
    private donorService: DonorService
  ) { }


  ngOnInit() {
    this.donorService.populate();
  }
}
