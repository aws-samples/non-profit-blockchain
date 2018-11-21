import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DonorService } from 'src/app/services/shared';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
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
      }),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.email
      ]))
    });
  }

  get user() { return this.userForm.controls; }

  signup() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.submitted = true;
    if (this.userForm.invalid) {
      this.loading = false;
      return;
    }
    const user = this.userForm.value;
    this.userService.createUser(user).subscribe(
      data => {
        if (data.success) {
          this.userService.signup(user).subscribe(
            resp => {
              this.router.navigate(['signin']);
              return;
            },
            err => {
              this.loading = false;
              this.error = 'Username or email already in used!';
            }
          );
        } else {
          this.loading = false;
          this.error = 'Username or email already in used!';
        }
      },
      err => {
        this.loading = false;
        this.error = 'Username or email already in used!';
      }
    );
  }

}
