import { Injectable } from '@angular/core';
import { ApiService } from './shared';
import { Donate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DonateService {

  constructor(private apiService: ApiService) { }

  makeDonation(ngoName: string, DonorUserName: string, donationAmount: number) {
    const donate = new Donate().set(donationAmount, DonorUserName, ngoName);
    donate.donationDate = new Date().toISOString();
    const path = `donations`;
    return this.apiService.post(path, donate);
  }
}
