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
import { Injectable } from '@angular/core';
import { Project, Ngo, Rating } from '../models';
import { ApiService } from '../services/shared/api.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NgoService {

  constructor(private apiService: ApiService) {

  }

  getNGOs() {
    const path = 'ngos';
    return this.apiService.get(path).pipe(map(data => this.ngoJsonAdopter(data)));
  }

  getNGO(ngo_id) {
    const path = `ngos/${ngo_id}`;
    return this.apiService.get(path).pipe(map(data => this.ngoJsonAdopter(data)));
  }
  getNGOSpend(ngo_id) {
    const path = `ngos/${ngo_id}/spend`;
    return this.apiService.get(path);
  }

  getNGORating(ngo_id) {
    const path = `ngos/${ngo_id}/ratings`;
    return this.apiService.get(path);
  }

  getDonorNGORating(ngo_id, donor_id) {
    const path = `ratings/${ngo_id}/${donor_id}`;
    return this.apiService.get(path);
  }

  updateDonorNGORating(rating_id, userRating, Donor_name, ngo_id) {
    const rating = new Rating().set(userRating, Donor_name, ngo_id);
    rating.transactionId = rating_id;
    const path = `ratings`;
    return this.apiService.put(path, rating);
  }

  createDonorNGORating(userRating, Donor_name, ngo_id) {
    const rating = new Rating().set(userRating, Donor_name, ngo_id);
    const path = `ratings`;
    return this.apiService.post(path, rating);
  }

  ngoJsonAdopter(ngoData: any = []) {
    const ngos: Array<Ngo> = [];
    if (ngoData.length === undefined) {
      ngoData = [ngoData];
    }
    for (const key in ngoData) {
      if (ngoData[key] !== undefined) {
        const data = ngoData[key];
        const ngo: Ngo = new Ngo();
        ngo.id = data.ngoRegistrationNumber;
        ngo.ngo_about = data.ngoDescription;
        ngo.ngo_reg_no = data.ngoRegistrationNumber;
        ngo.ngo_name = data.ngoName;
        ngo.ngo_address = data.address;
        ngo.ngo_phone = data.contactNumber;
        ngo.ngo_email = data.contactEmail;
        ngo.ngo_icon_url = `assets/images/${data.ngoRegistrationNumber}/${data.ngoRegistrationNumber}.png`;
        ngo.ngo_rating = 0;
        ngo.ngo_projects = Math.floor(Math.random() * (+40 - +10)) + +10;
        ngos.push(ngo);
      }
    }
    return ngos;
  }
}
