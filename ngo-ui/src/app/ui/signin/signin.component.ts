import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DonorService } from 'src/app/services/shared';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Donor } from 'src/app/models';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  userForm: FormGroup;
  submitted = false;
  error: string = null;
  loading = false;
  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private userService: DonorService) {
  }



  ngOnInit() {
    this.userForm = this.formBuilder.group({
      username: new FormControl('', {
        validators: Validators.compose([Validators.required,
        Validators.minLength(4), Validators.maxLength(20)]),
        updateOn: 'blur'
      })
    });
  }

  get user() { return this.userForm.controls; }

  login() {
    if (this.loading) {
      return;
    }
    this.error = null;
    this.submitted = true;
    this.loading = true;
    if (this.userForm.invalid) {
      this.loading = false;
      return;
    }
    const user = this.userForm.value;
    const resp = this.userService.signin(user).subscribe(
      data => {
        const fistrecord = data[0];
        const donor = new Donor().get(fistrecord.donorUserName, fistrecord.email);
        this.userService.setAuth(donor);
        this.router.navigate(['ngolist']);
      },
      err => {
        this.loading = false;
        console.log('wrong user', err);
        this.error = 'User not found';
      }
    );
  }

}
