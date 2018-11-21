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
        this.error = 'User not found';
      }
    );
  }

}
