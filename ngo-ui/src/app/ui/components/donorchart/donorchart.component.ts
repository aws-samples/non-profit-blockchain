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
import { Component, ElementRef, Input, OnChanges, ViewChild, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DashboardService } from 'src/app/services/dashboard.service';
import * as _ from 'underscore';

@Component({
  selector: 'app-donorchart',
  templateUrl: './donorchart.component.html',
  styleUrls: ['./donorchart.component.scss']
})
export class DonorchartComponent implements OnInit, OnChanges {
  @ViewChild('chart') chartContainer: ElementRef;

  @Input() data: any;

  @Input() colours: Array<string>;

  @Input() total: number;



  hostElement: any;
  svg: any = null;
  radius: number;
  innerRadius: number;
  outerRadius: number;
  htmlElement: HTMLElement;
  arcGenerator: any;
  arcHover: any;
  pieGenerator: any;
  path: any;
  values: Array<number>;
  labels: Array<string>;
  tooltip: any;
  centralLabel: any;
  pieColours: any;
  slices: Array<any>;
  selectedSlice: any;
  colourSlices: Array<string>;
  arc: any;
  arcEnter: any;
  spendId: any;
  contributionList: any;
  totalSpend: any;
  labelArc: any;
  donation: any;
  totalDonation: any;

  constructor(private dashboardService: DashboardService, private elRef: ElementRef) { }




  ngOnInit() {
    this.createChart();
    this.updateChart(true);
    setTimeout(() => this.updateChart(false), 50);
  }

  ngOnChanges() {
    //   if (this.svg) { this.updateChart(false); }
  }

  createChart = () => {
    this.hostElement = this.chartContainer.nativeElement;
    this.radius = Math.min(this.hostElement.offsetWidth, this.hostElement.offsetHeight) / 2;
    const innerRadius = this.radius - 80;
    const outerRadius = this.radius - 15;
    const hoverRadius = this.radius - 5;
    this.pieColours = d3.scaleOrdinal(d3.schemeCategory10);
    this.pieGenerator = d3.pie().sort(null).value((d: number) => d)([0, 0, 0]);
    this.arcGenerator = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    this.arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(hoverRadius);

    this.labelArc = d3.arc()
      .outerRadius(innerRadius - 40)
      .innerRadius(outerRadius - 40);
  }

  updateChart = (firstRun: boolean) => {
    if (this.svg === null) {
      this.svg = d3.select(this.hostElement).append('svg')
        .attr('viewBox', '0, -10, ' + this.hostElement.offsetWidth + ', ' + (this.hostElement.offsetHeight + 20))
        .append('g')
        .attr('transform', `translate(${this.hostElement.offsetWidth / 2}, ${this.hostElement.offsetHeight / 2})`);
    }
    const vm = this;
    this.slices = this.updateSlices(this.data);
    this.labels = this.slices.map(slice => slice.name);
    this.donation = this.slices.map(slice => slice.donation);
    this.colourSlices = this.slices.map(slice => this.pieColours(slice.name));

    this.values = firstRun ? [0, 0, 0] : _.toArray(this.slices).map(slice => slice.donation);

    this.pieGenerator = d3.pie().sort(null).value((d: number) => d)(this.values);

    const arc = this.svg.selectAll('.arc')
      .data(this.pieGenerator);

    arc.exit().remove();

    const arcEnter = arc.enter().append('g')
      .attr('class', 'arc');

    arcEnter.append('path')
      .attr('d', this.arcGenerator)
      .each((values) => firstRun ? values.storedValues = values : null)
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout);

    d3.select(this.hostElement).selectAll('path')
      .data(this.pieGenerator)
      .attr('fill', (datum, index) => this.pieColours(this.labels[index]))
      .attr('d', this.arcGenerator)
      .attr('id', function (d, i) { return 'donutArc' + i; })
      .transition()
      .duration(750)
      .attrTween('d', function (newValues, i) {
        return vm.arcTween(newValues, i, this);
      });

    this.svg.select('.totalspend').remove();
    this.svg.append('text')
      .attr('dy', '-25px')
      .style('text-anchor', 'middle')
      .attr('class', 'totalspend')
      .attr('fill', '#57a1c6')
      .text('$ ' + this.totalSpend);
  }


  arcTween(newValues, i, slice) {
    const interpolation = d3.interpolate(slice.storedValues, newValues);
    slice.storedValues = interpolation(0);

    return (t) => {
      return this.arcGenerator(interpolation(t));
    };
  }

  mouseover = (d, i) => {
    this.selectedSlice = this.slices[i];

    d3.select(d3.event.currentTarget).transition()
      .duration(200)
      .attr('d', this.arcHover);

    this.svg.append('text')
      .attr('dy', '0px')
      .style('text-anchor', 'middle')
      .attr('class', 'label')
      .attr('fill', '#57a1c6')
      .text(this.labels[i] + ' contribution is $ ' + this.donation[i]);

  }

  mouseout = () => {
    this.svg.select('.label').remove();
    this.svg.select('.percent').remove();

    d3.select(d3.event.currentTarget).transition()
      .duration(100)
      .attr('d', this.arcGenerator);
  }

  toPercent = (a: number, b: number): string => {
    return Math.round(a / b * 100) + '%';
  }

  updateSlices = (newData: Array<any>): Array<any> => {
    // const queriesByDonation = _.groupBy(_.sortBy(newData, 'donation'), 'donationId');
    // const queriesByDonation = _.sortBy(newData, 'donation');
    this.totalSpend = this.total;
    return _.sortBy(newData, 'donation');

  }
}
