

import { Component, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';


import {
  Cam,
  ActivityType,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaFormMenuService,
  NoctuaActivityFormService,
  CamService,
  noctuaFormConfig,
  CamsService
} from 'noctua-form-base';

import { takeUntil } from 'rxjs/operators';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { noctuaAnimations } from '@noctua/animations';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'noc-cam-detail',
  templateUrl: './cam-detail.component.html',
  styleUrls: ['./cam-detail.component.scss'],
  animations: noctuaAnimations,
})
export class CamDetailComponent implements OnInit, OnDestroy {
  ActivityType = ActivityType;

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  filterForm: FormGroup;
  cam: Cam;
  searchResults = [];
  modelId = '';

  searchFormType = 'advanced';
  matchedCount = 0;

  tableOptions = {
    reviewMode: true,
  }

  noctuaFormConfig = noctuaFormConfig;

  private _unsubscribeAll: Subject<any>;

  constructor
    (private route: ActivatedRoute,
      private camService: CamService,
      private noctuaDataService: NoctuaDataService,
      public noctuaSearchService: NoctuaSearchService,
      public noctuaUserService: NoctuaUserService,
      public noctuaFormConfigService: NoctuaFormConfigService,
      public noctuaActivityFormService: NoctuaActivityFormService,
      public noctuaFormMenuService: NoctuaFormMenuService) {

    this._unsubscribeAll = new Subject();
    this.camService.onCamChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cam => {
        if (!cam) {
          return;
        }
        this.cam = cam;
      });

    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    const self = this;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }


  selectSearchFormType(searchFormType) {
    this.searchFormType = searchFormType;
  }

  viewAsModel(cam: Cam) {
    cam.displayType = noctuaFormConfig.camDisplayType.options.model;
  }

  viewAsActivities(cam: Cam) {
    cam.displayType = noctuaFormConfig.camDisplayType.options.entity;
  }

  loadCam(modelId) {
    const self = this;
  }

  createFilterForm() {
    return new FormGroup({
      findWhat: new FormControl(),
    });
  }

  compareEntity(a: any, b: any) {
    return (a.id === b.id);
  }

  close() {
    this.panelDrawer.close();
  }
}


