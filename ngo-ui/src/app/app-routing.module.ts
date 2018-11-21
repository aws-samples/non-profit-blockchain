import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './ui/dashboard/dashboard.component';
import { NgoDetailsComponent } from './ui/ngo-details/ngo-details.component';
import { NgosListComponent } from './ui/ngos-list/ngos-list.component';
import { DonateComponent } from './ui/donate/donate.component';
import { SigninComponent } from './ui/signin/signin.component';
import { SignupComponent } from './ui/signup/signup.component';

const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'ngolist', component: NgosListComponent },
  { path: 'details/:id', component: NgoDetailsComponent },
  { path: 'donate/:id', component: DonateComponent },
  { path: 'dashboard', component: DashboardComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
