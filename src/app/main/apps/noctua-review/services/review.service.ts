

import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MatDrawer } from '@angular/material';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, filter, reduce, catchError, retry, tap } from 'rxjs/operators';

import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { CurieService } from '@noctua.curie/services/curie.service';
import { NoctuaGraphService, Organism } from 'noctua-form-base';

import { NoctuaFormConfigService } from 'noctua-form-base';


import { Contributor } from 'noctua-form-base';
import { Group } from 'noctua-form-base';

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
declare const require: any;
const each = require('lodash/forEach');

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  leftPanel = {
    search: {
      id: 1
    }, filter: {
      id: 2
    }, group: {
      id: 3
    }, contributor: {
      id: 4
    }, species: {
      id: 5
    }
  }

  selectedLeftPanel;

  onContributorsChanged: BehaviorSubject<any>;
  onGroupsChanged: BehaviorSubject<any>;
  onOrganismsChanged: BehaviorSubject<any>;

  contributors: Contributor[] = [];
  groups: Group[] = [];
  organisms: Organism[] = [];
  states: any[] = [];

  private leftDrawer: MatDrawer;
  private rightDrawer: MatDrawer;

  constructor(private noctuaFormConfigService: NoctuaFormConfigService) {
    this.onContributorsChanged = new BehaviorSubject([]);
    this.onGroupsChanged = new BehaviorSubject([]);
    this.onOrganismsChanged = new BehaviorSubject([]);

    this.selectedLeftPanel = this.leftPanel.search;
    this.states = this.noctuaFormConfigService.modelState.options;
  }

  selectLeftPanel(panel) {
    this.selectedLeftPanel = panel;
  }

  public setLeftDrawer(leftDrawer: MatDrawer) {
    this.leftDrawer = leftDrawer;
  }

  public openLeftDrawer() {
    return this.leftDrawer.open();
  }

  public closeLeftDrawer() {
    return this.leftDrawer.close();
  }

  public toggleLeftDrawer(panel) {
    if (this.selectedLeftPanel.id === panel.id) {
      this.leftDrawer.toggle();
    } else {
      this.selectLeftPanel(panel)
      return this.openLeftDrawer();
    }
  }

  public setRightDrawer(rightDrawer: MatDrawer) {
    this.rightDrawer = rightDrawer;
  }

  public openRightDrawer() {
    return this.rightDrawer.open();
  }

  public closeRightDrawer() {
    return this.rightDrawer.close();
  }

  public groupContributors() {
    return _.groupBy(this.contributors, function (contributor) {
      return contributor.group;
    });

  }

  public filterOrganisms(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.organisms.filter(organism => organism.taxonName.toLowerCase().indexOf(filterValue) === 0);
  }

  public filterStates(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.states.filter(state => state.name.toLowerCase().indexOf(filterValue) === 0);
  }

}
