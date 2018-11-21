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
import { Component, OnInit, Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BreadCrumb } from './breadcrumb.interface';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Array<BreadCrumb> = [{ label: 'Dashboard', url: '/dashboard' }];
  constructor(private router: Router, activatedRoute: ActivatedRoute) {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.buildBreadCrumb(e.url);
      }
    });
  }

  ngOnInit() {
  }

  buildBreadCrumb(url) {
    const label = url.split('/')[1];
    const nextUrl = url;
    const breadcrumb = {
      label: label,
      url: nextUrl
    };
    let previousState: Array<BreadCrumb> = [];
    previousState = previousState.concat(this.breadcrumbs);

    let newState: Array<BreadCrumb> = [];

    for (const item of previousState) {
      if (item && nextUrl === item.url) {
        break;
      }
      newState = newState.concat([item]);
    }
    newState = newState.concat([breadcrumb]);
    this.breadcrumbs = newState;
  }
}
