import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../@noctua/animations';

import {
  Cam,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaAnnotonFormService
} from 'noctua-form-base';

import { FormGroup } from '@angular/forms';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { takeUntil } from 'rxjs/operators';



@Component({
  selector: 'noc-noctua-search',
  templateUrl: './noctua-search.component.html',
  styleUrls: ['./noctua-search.component.scss'],
  //encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaSearchComponent implements OnInit, OnDestroy {

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;


  public cam: Cam;
  public user: Contributor;
  searchResults = [];
  modelId: string = '';
  baristaToken: string = '';
  searchCriteria: any = {};
  searchFormData: any = []
  searchForm: FormGroup;
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  summary: any = {
    expanded: false,
    detail: {}
  };
  cams: any[] = [];

  private _unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    public noctuaSearchService: NoctuaSearchService,
    private sparqlService: SparqlService,
  ) {

    this._unsubscribeAll = new Subject();

    this.route
      .queryParams
      .subscribe(params => {
        this.baristaToken = params['barista_token'] || null;
        this.noctuaUserService.baristaToken = this.baristaToken;
        this.getUserInfo();
        this.loadCams();
      });
  }

  getUserInfo() {

    this.noctuaUserService.getUser()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response) => {
        if (response && response.nickname) {
          this.user = new Contributor()
          this.user.name = response.nickname;
          this.user.groups = response.groups;
          // user.manager.use_groups([self.userInfo.selectedGroup.id]);
          this.noctuaUserService.user = this.user;
          this.noctuaUserService.onUserChanged.next(this.user);
        }
      });
  }

  ngOnInit(): void {
    this.noctuaSearchService.setLeftDrawer(this.leftDrawer);
    /*
    this.sparqlService.getCamsByContributor('http://orcid.org/0000-0002-1706-4196').subscribe((response: any) => {
      this.cams = this.sparqlService.cams = response;
      this.sparqlService.onCamsChanged.next(this.cams);
    });
    */

    this.rightDrawer.open();

    this.sparqlService.getAllContributors()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        this.noctuaSearchService.contributors = response;
        this.noctuaSearchService.onContributorsChanged.next(response);
        this.noctuaSearchService.updateSearch();
      });

    this.sparqlService.getAllGroups()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        this.noctuaSearchService.groups = response;
        this.noctuaSearchService.onGroupsChanged.next(response);
      });



    this.sparqlService.getAllOrganisms()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        this.noctuaSearchService.organisms = response;
        this.noctuaSearchService.onOrganismsChanged.next(response);
      });

    this.sparqlService.onCamsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cams => {
        this.cams = cams;
        this.summary.detail = this.sparqlService.searchSummary;
        this.loadCams();
      });

    this.noctuaSearchService.onContributorsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(contributors => {
        this.noctuaUserService.contributors = contributors;
      });

    this.noctuaSearchService.onGroupsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(groups => {
        this.noctuaUserService.groups = groups;
      });

  }

  toggleLeftDrawer(panel) {
    this.noctuaSearchService.toggleLeftDrawer(panel);
  }

  search() {
    let searchCriteria = this.searchForm.value;
    this.noctuaSearchService.search(searchCriteria);
  }

  loadCams() {
    this.cams = this.sparqlService.cams;
  }

  toggleSummaryExpand() {
    this.summary.expanded = !this.summary.expanded;
  }

  toggleExpand(cam) {
    if (cam.expanded) {
      cam.expanded = false;
    } else {
      cam.expanded = true;
    }
  }

  refresh() {
    this.noctuaSearchService.updateSearch();
  }

  selectCam(cam) {
    this.sparqlService.onCamChanged.next(cam);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }





}
