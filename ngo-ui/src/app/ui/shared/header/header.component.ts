import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DonorService } from 'src/app/services/shared';
import { Donor } from 'src/app/models';
import { DashboardService } from 'src/app/services';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isVisible = false;
  currentUser: Donor = null;

  greetingMsg = 'Hello';
  donationAmount = 0.00;
  actionButton = 'Logout';

  constructor(
    private donorService: DonorService, private userDonationsService: DashboardService
  ) { }

  ngOnInit() {
    this.donorService.currentDonor.subscribe(
      (userData) => {
        this.currentUser = userData;
      }
    );
  }

  doAction() {
    if (this.actionButton === 'Logout') {
      this.donorService.signout();
      this.currentUser = null;
    }
  }
}
