import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { noctuaAnimations } from '@noctua/animations';
import { takeUntil } from 'rxjs/internal/operators';
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';

import {
  NoctuaGraphService,
  NoctuaFormConfigService,
  CamService
} from 'noctua-form-base';

import {
  Cam
} from 'noctua-form-base';

@Component({
  selector: 'noc-cams-table',
  templateUrl: './cams-table.component.html',
  styleUrls: ['./cams-table.component.scss'],
  animations: noctuaAnimations
})
export class CamsTableComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;

  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  }

  cams: any[] = [];
  searchResults = [];

  constructor(public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaSearchService: NoctuaSearchService,
    private camService: CamService,
    private noctuaGraphService: NoctuaGraphService,
    public sparqlService: SparqlService) {

    this.searchFormData = this.noctuaFormConfigService.createSearchFormData();
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

    this.sparqlService.onCamsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cams => {
        this.cams = cams;
        this.loadCams();
      });
  }

  toggleLeftDrawer(panel) {
    this.noctuaSearchService.toggleLeftDrawer(panel);
  }

  search() {
    let searchCriteria = this.searchForm.value;
    console.dir(searchCriteria)
    this.noctuaSearchService.search(searchCriteria);
  }

  loadCams() {
    this.cams = this.sparqlService.cams;
  }

  toggleExpand(cam: Cam) {
    if (cam.expanded) {
      cam.expanded = false;
    } else {
      cam.expanded = true;
      this.changeCamDisplayView(cam, cam.displayType);
    }
  }

  refresh() {

  }

  openCamForm(cam: Cam) {
    this.sparqlService.getModelMeta(cam.id).subscribe((response: any) => {
      if (response && response.length > 0) {
        let responseCam = <Cam>response[0];
        cam.contributors = responseCam.contributors;
        cam.groups = responseCam.groups;
        this.camService.onCamChanged.next(cam);
      }
    });
    this.camService.initializeForm(cam);
    // this.noctuaFormService.openRightDrawer(this.noctuaFormService.panel.camForm);
  }

  changeCamDisplayView(cam: Cam, displayType) {
    cam.displayType = displayType;
    this.noctuaGraphService.getGraphInfo(cam, cam.id);
  }

  selectCam(cam: Cam) {
    this.sparqlService.onCamChanged.next(cam);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
