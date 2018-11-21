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
import { Component, OnInit, ViewContainerRef, ViewChild, ComponentFactoryResolver, HostListener } from '@angular/core';
import { Ngo, Project, Rating } from 'src/app/models';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { SessionService, UtilsService } from 'src/app/services/shared';
import { DonateService, DashboardService, NgoService } from 'src/app/services';
import { RatingService } from '../components/rating/rating.component';
import { DonorchartComponent } from '../components/donorchart/donorchart.component';

@Component({
  selector: 'app-ngos-list',
  templateUrl: './ngos-list.component.html',
  styleUrls: ['./ngos-list.component.scss']
})
export class NgosListComponent implements OnInit {

  @ViewChild('graphcontainer', { read: ViewContainerRef }) viewContainer: ViewContainerRef;

  ngolist: Array<Ngo> = [];
  ngoProjects: Array<Project> = null;
  selectedNGO: Ngo = new Ngo();
  donateForm: FormGroup = null;
  submitted = false;
  error: String = null;
  ngoRating = 0;
  userRating: Rating = new Rating();
  contribution_list = [];
  spend_Id: any;
  show_graph = false;
  componentRef: any = null;
  loading = false;

  ngoMap = new Map();

  @HostListener('window:resize', ['$event'])
  update(event) { UtilsService.onHeightChange('.container-dynamic-height'); }



  constructor(private ngoService: NgoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private donateService: DonateService,
    private ratingService: RatingService,
    private dashboardService: DashboardService,
    private componentFactoryResolver: ComponentFactoryResolver) {
    this.ratingService.ratingClick.subscribe(
      (data: any) => {
        const currentDonor = SessionService.getUser().name;
        this.selectedNGO.ngo_user_rating = data.rating;
        this.ngoService.createDonorNGORating(data.rating, currentDonor, this.selectedNGO.ngo_reg_no).subscribe(
          resp => { }
        );
      });
  }

  ngOnInit() {
    this.ngoService.getNGOs().subscribe(data => {
      this.ngolist = data;
      this.ngolist.forEach(element => {
        this.setRatings(element);
        this.getNGOFundsDetails(element);
        this.getNGOSpendData(element);
        this.ngoMap.set(element.id, element);
      });
      this.selectedNGO = this.ngolist.length > 0 ? this.ngoMap.get(this.ngolist[0].id) : new Ngo();
      setTimeout(() => {
        const ngo_data = UtilsService.mapToJson(this.ngoMap);
        SessionService.setValue('ngos', ngo_data);
      }, 1000);
      // set height dynimically
      UtilsService.onHeightChange('.container-dynamic-height', 20);

    },
      err => {
        console.error(err);
      }
    );
    this.donateForm = this.formBuilder.group({
      donationAmount: new FormControl('', [Validators.required])
    });

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
            if (SessionService.getUser().name === data[i].donorUserName) {
              ngo.ngo_user_rating = data[i].rating;
            }
          }
        }
        if (rating > 0) {
          rating = rating / data.length;
        }
        ngo.ngo_rating = Math.ceil(rating);
      });
  }
  onNGOSelect(ngo) {
    this.selectedNGO = ngo;
    this.setRatings(ngo);
    this.getNGOFundsDetails(ngo);
    this.getNGOSpendData(ngo);
    return;
  }

  get donation() { return this.donateForm.controls; }

  onDonate() {
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
          console.error(err);
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
