import { Component, OnInit, HostListener } from '@angular/core';
import { DashboardService } from './../../services';
import { UtilsService } from 'src/app/services/shared';
import { Donation } from 'src/app/models';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent implements OnInit {

  constructor(private userDonationsService: DashboardService,
    private formBuilder: FormBuilder,
    private router: Router) { }

  userDonationslist: Array<Donation> = [];
  donateForm: FormGroup = null;
  submitted = false;
  total_donation = 0.00;
  month_donation = 0.00;

  
  @HostListener('window:resize', ['$event'])
  update(event) { UtilsService.onHeightChange('.table-responsive'); }

  ngOnInit() {
    this.userDonationsService.getUserDonations().subscribe(data => {
      this.userDonationslist = data;
      for (const i in data) {
        if (data[i]) {
          this.total_donation = this.total_donation + data[i].amount;
          if (data[i].date.getMonth === new Date().getMonth) {
            this.month_donation = this.month_donation + data[i].amount;
          }
        }
      }
      UtilsService.onHeightChange('.table-responsive', 50);
    },
      err => {
        console.error(err);
      }
    );
    this.donateForm = this.formBuilder.group({
      donate: new FormControl('', [Validators.required])
    });
  }
}
