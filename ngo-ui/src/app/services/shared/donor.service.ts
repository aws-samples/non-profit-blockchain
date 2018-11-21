import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Observable } from 'rxjs';
import { Donor } from '../../models';
import { SessionService } from './session.service';
import { ApiService } from './api.service';
import { Router, ActivatedRoute, Event, NavigationEnd } from '@angular/router';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DonorService {
  private currentDonorSubject = new BehaviorSubject<Donor>(null);
  public currentDonor = this.currentDonorSubject.asObservable().pipe(distinctUntilChanged());
  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  currentUrl: String = '';

  constructor(
    private apiService: ApiService,
    private sessionService: SessionService,
    private route: Router,
    private activatedRoute: ActivatedRoute

  ) {
    route.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
      }
    });
  }

  signin(logindata) {
    return this.apiService.get(`donors/${logindata.username}`);

  }

  createUser(userdata) {
    const userData = {
      username: userdata.username,
      orgName: 'Org1'
    };
    return this.apiService.post(`users`, userData);
  }

  signup(userdata) {
    const reqData = {
      donorUserName: userdata.username,
      email: userdata.email,
      registeredDate: new Date().toISOString()
    };
    return this.apiService.post(`donors`, reqData);
  }

  signout() {
    this.purgeAuth();
    this.route.navigate(['signin']);
  }


  populate() {
    const userinfo: Donor = SessionService.getUser();
    if (userinfo) {
      this.apiService.get(`donors/${userinfo.name}`)
        .subscribe(
          data => {
            if (data.length > 0) {
              const datum = data[0];
              const donor = new Donor().get(datum.donorUserName, datum.email);
              this.setAuth(donor);
              if (this.currentUrl !== '/' || this.currentUrl !== '/singin') {
                this.route.navigate(['ngolist']);
              }
              return;
            }
          },
          err => {
            this.purgeAuth();
            if (this.currentUrl !== '/singup') {
              this.route.navigate(['signin']);
            }
          }
        );
    } else {
      if (this.currentUrl !== '/singup') {
        this.route.navigate(['signin']);
      }
    }
  }

  setAuth(donor: Donor) {
    this.sessionService.saveUser(donor);
    this.currentDonorSubject.next(donor);
    this.isAuthenticatedSubject.next(true);
  }

  purgeAuth() {
    this.sessionService.deleteUser();
    this.currentDonorSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  attemptAuth(type, credentials): Observable<Donor> {
    const route = (type === 'login') ? '/login' : '';
    return this.apiService.get(`/donors/${credentials.name}` + route).pipe(
      map(data => {
        const donor = new Donor().get(data.name, data.email);
        this.setAuth(donor);
        return donor;
      }
      ));
  }

  getCurrentDonor(): Donor {
    return this.currentDonorSubject.value;
  }


}
