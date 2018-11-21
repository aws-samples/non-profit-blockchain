/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.
#
*/
import { Component, Input, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Ngo, Donation, Project, Rating } from 'src/app/models';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgoService, DonateService, DashboardService } from 'src/app/services';
import { SessionService, UtilsService } from 'src/app/services/shared';
import { DonorchartComponent } from 'src/app/ui/components/donorchart/donorchart.component';


@Component({
  selector: 'app-ngo-details',
  templateUrl: './ngo-details.component.html',
  styleUrls: ['./ngo-details.component.scss']
})
export class NgoDetailsComponent implements OnInit {


  @ViewChild('graphcontainer', { read: ViewContainerRef }) viewContainer: ViewContainerRef;

  ngoProjects: Array<Project> = null;
  selectedNGO: Ngo = new Ngo();
  donateForm: FormGroup = null;
  submitted = false;
  ngo_my_donation = 0.00;
  ngo_total_donation = 0.00;
  ngo_spend_amount = 0.00;
  ngo_total_donors_set = new Set();
  ngo_donors_amounts = new Map();
  userDonationslist: Array<Donation> = [];
  error: string = null;
  ngoRating = 4;
  ngo_donors_list: any = [];
  selected_ngo_spend_details = [];
  componentRef: any = null;
  loading = false;
  contribution_list = [];
  show_graph = false;
  userRating: Rating;

  @Input() ngo_id: number;

  constructor(private ngoService: NgoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private donateService: DonateService,
    private dashboardService: DashboardService,
    // private sessionService: SessionService,
    private componentFactoryResolver: ComponentFactoryResolver) {
    if (this.ngo_id === null || this.ngo_id === undefined) {
      this.ngo_id = route.snapshot.params.id;
    }
  }

  get donation() { return this.donateForm.controls; }

  ngOnInit() {
    this.donateForm = this.formBuilder.group({
      donationAmount: new FormControl('', [Validators.required])
    });

    this.ngoService.getNGO(this.ngo_id).subscribe(data => {
      this.selectedNGO = data.length > 0 ? data[0] : new Ngo();
      this.getNGOSpendData(this.selectedNGO);
      this.getNGOFundsDetails(this.selectedNGO);
      this.setRatings(this.selectedNGO);
    },
      err => {
        console.error(err);
      }
    );

  }

  getNGOFundsDetails(ngo: Ngo) {
    this.dashboardService.getDonationsByNGO(ngo.id).subscribe(ngo_data => {
      let ngo_total_donation = 0.00;
      const ngo_total_donors_set = new Set();
      const ngo_donors_amounts = new Map();
      for (const i in ngo_data) {
        if (ngo_data[i]) {
          ngo_total_donation = ngo_total_donation + ngo_data[i].donationAmount;
          if (!ngo_total_donors_set.has(ngo_data[i].donorUserName)) {
            ngo_total_donors_set.add(ngo_data[i].donorUserName);
          }
          const donor_name = ngo_data[i].donorUserName;
          if (!ngo_donors_amounts.has(donor_name)) {
            ngo_donors_amounts.set(donor_name, ngo_data[i].donationAmount);
          } else {
            ngo_donors_amounts.set(donor_name, ngo_data[i].donationAmount + ngo_donors_amounts.get(donor_name));
          }
        }
      }
      const user_donation = ngo_donors_amounts.get(SessionService.getUser().name);
      ngo.ngo_donations = ngo_total_donation;
      ngo.ngo_Donors = ngo_total_donors_set.size;
      ngo.ngo_donor_details = ngo_donors_amounts;
      ngo.ngo_user_donations = user_donation ? user_donation : 0;
      return ngo;
    });
  }

  getNgoDonorsAmountKeys() {
    return Array.from(this.selectedNGO.ngo_donor_details.keys());
  }

  getNGOSpendData(ngo: Ngo) {
    this.ngoService.getNGOSpend(ngo.id).subscribe(ngospenddata => {
      let ngo_spend_amount = 0;
      const ngo_spend_data = [];
      for (const i in ngospenddata) {
        if (ngospenddata[i] && ngospenddata[i].docType === 'spend') {
          ngo_spend_amount = ngo_spend_amount + ngospenddata[i].spendAmount;
          ngo_spend_data.push(ngospenddata[i]);
        }
      }
      ngo.ngo_fund_utilized = ngo_spend_amount;
      ngo.ngo_spend_details = ngo_spend_data;
    },
      err => {
        console.error(err);
      }
    );
    return ngo;
  }

  setRatings(ngo: Ngo) {
    this.ngoService.getNGORating(ngo.id).subscribe(
      data => {
        let rating = 0;
        for (const i in data) {
          if (data[i]) {
            rating = rating + data[i].rating;
          }
        }
        if (rating > 0) {
          rating = rating / data.length;
        }
        ngo.ngo_rating = Math.ceil(rating);
      });
    this.ngoService.getDonorNGORating(ngo.id, SessionService.getUser().name).subscribe(
      data => {
        this.userRating = new Rating();
        if (data[0]) {
          data = data[0];
        }
        this.userRating = data;
      });
  }

  makeDonation() {
    if (this.loading) { return; }
    this.loading = true;
    this.submitted = true;
    if (this.donateForm.invalid) {
      return;
    }
    this.donateService.makeDonation(this.selectedNGO.ngo_reg_no, SessionService.getUser().name, this.donateForm.value.donationAmount)
      .subscribe(
        data => {
          this.router.navigate([`donate/${data.donationId}`]);
        },
        err => {
          this.loading = false;
          this.error = 'Something wrong with the donation. Will update you soon on this.';
        }
      );
  }

  getSpendData(spend_Id, totalamount) {
    this.dashboardService.getContributorsBySpend(spend_Id).subscribe(
      data => {
        if (data.length > 0) {
          const operations = [];
          for (let i = 0; i < data.length; i++) {
            const operation = {
              spendAllocationId: data[i].spendAllocationId,
              donation: UtilsService.formatFloat(data[i].spendAllocationAmount, 4),
              name: 'Donor ' + i
            };
            operations.push(operation);
          }
          setTimeout(() => {
            const factory = this.componentFactoryResolver.resolveComponentFactory(DonorchartComponent);
            this.componentRef = this.viewContainer.createComponent(factory);
            this.componentRef.instance.data = operations;
            this.componentRef.instance.total = totalamount;
            this.show_graph = true;
          }, 500);
        }
      },
      err => {
        console.error(err);
      }
    );
  }

  renderGraph(spend_Id, totalamount) {
    if (this.componentRef !== null) {
      this.componentRef.destroy();
    }
    this.getSpendData(spend_Id, totalamount);
  }
}
