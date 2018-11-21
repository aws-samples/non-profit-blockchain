import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import * as $ from 'jquery';
import * as popper from 'popper.js';
import * as bootstrap from 'bootstrap';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './ui/shared/header/header.component';
import { FooterComponent } from './ui/shared/footer/footer.component';
import { DashboardComponent } from './ui/dashboard/dashboard.component';
import { SigninComponent } from './ui/signin/signin.component';
import { SignupComponent } from './ui/signup/signup.component';
import { DonateComponent } from './ui/donate/donate.component';
import { HttpClientModule } from '@angular/common/http';
import { NgosListComponent } from './ui/ngos-list/ngos-list.component';
import { NgoDetailsComponent } from './ui/ngo-details/ngo-details.component';

// Custom Componants
import { RatingComponent, RatingService } from './ui/components/rating/rating.component';
import { BlockchainProgressComponent } from './ui/components/blockchain-progress/blockchain-progress.component';

// Shared Services
import { AuthService, ApiService, SessionService } from './services/shared';
import { GalleryComponent } from './ui/components/gallery/gallery.component';
import { BreadcrumbComponent } from './ui/shared/breadcrumb/breadcrumb.component';
import { BlockchainComponent } from './ui/shared/blockchain/blockchain.component';
import { SidenavComponent } from './ui/shared/sidenav/sidenav.component';
import { DonorchartComponent } from './ui/components/donorchart/donorchart.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent,
    SigninComponent,
    SignupComponent,
    DonateComponent,
    NgosListComponent,
    NgoDetailsComponent,
    BlockchainProgressComponent,
    RatingComponent,
    GalleryComponent,
    BreadcrumbComponent,
    BlockchainComponent,
    SidenavComponent,
    DonorchartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
  ],
  providers: [
    AuthService,
    ApiService,
    SessionService,
    RatingService
  ],
  bootstrap: [AppComponent],
  entryComponents: [DonorchartComponent]
})
export class AppModule {

}
