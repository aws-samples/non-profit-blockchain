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
              this.error = err.statusText;
            }
          );
        } else {
          this.loading = false;
          this.error = 'Username or email already in use!';
        }
      },
      err => {
        this.loading = false;
        this.error = err.statusText + ". Ensure you are using HTTP, not HTTPS, to access the site.";
      }
    );
  }

}
