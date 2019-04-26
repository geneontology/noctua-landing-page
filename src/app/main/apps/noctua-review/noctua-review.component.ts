import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../@noctua/animations';

import {
  Cam,
  Curator,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaGraphService,
  NoctuaAnnotonFormService,
  CamService
} from 'noctua-form-base';

import { FormGroup } from '@angular/forms';

import { ReviewService } from './services/review.service';
import { ReviewDialogService } from './services/review-dialog.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';


import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { takeUntil } from 'rxjs/operators';



@Component({
  selector: 'app-noctua-review',
  templateUrl: './noctua-review.component.html',
  styleUrls: ['./noctua-review.component.scss'],
  //encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaReviewComponent implements OnInit, OnDestroy {

  @ViewChild('leftDrawer')
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer')
  rightDrawer: MatDrawer;


  public cam: Cam;
  public user: Curator;
  searchResults = [];
  modelId: string = '';
  baristaToken: string = '';
  searchCriteria: any = {};
  searchFormData: any = []
  searchForm: FormGroup;
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  }

  summary: any = {
    expanded: false,
    detail: {}
  }
  cams: any[] = [];

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    private camService: CamService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaSearchService: NoctuaSearchService,
    // private noctuaLookupService: NoctuaLookupService,
    private noctuaGraphService: NoctuaGraphService,
    private sparqlService: SparqlService,
    public reviewService: ReviewService,
    private reviewDialogService: ReviewDialogService,


  ) {

    this.unsubscribeAll = new Subject();

    this.route
      .queryParams
      .subscribe(params => {
        this.modelId = params['model_id'] || null;
        this.baristaToken = params['barista_token'] || null;
        this.noctuaGraphService.baristaToken = this.baristaToken;
        this.getUserInfo();
        this.loadCams();
      });

    //  this.camService.setAnnotonLocation('aaa', 4, 5).subscribe((res) => {
    //  console.log(res)
    //   });
  }

  getUserInfo() {
    const self = this;

    this.noctuaUserService.getUser().subscribe((response) => {
      if (response) {
        this.user = new Curator()
        this.user.name = response.nickname;
        this.user.groups = response.groups;
        // user.manager.use_groups([self.userInfo.selectedGroup.id]);
        this.noctuaUserService.user = this.user;
        this.noctuaUserService.onUserChanged.next(this.user);
      }
    });
  }

  ngOnInit(): void {
    this.reviewService.setLeftDrawer(this.leftDrawer);

    this.sparqlService.getCamsByCurator('http://orcid.org/0000-0002-1706-4196').subscribe((response: any) => {
      this.cams = this.sparqlService.cams = response;
      this.sparqlService.onCamsChanged.next(this.cams);
    });

    this.sparqlService.getAllCurators().subscribe((response: any) => {
      this.reviewService.curators = response;
      this.reviewService.onCuratorsChanged.next(response);
      //  this.searchFormData['curator'].searchResults = response;

      this.sparqlService.getAllGroups().subscribe((response: any) => {
        this.reviewService.groups = response;
        this.reviewService.onGroupsChanged.next(response);
        //    this.searchFormData['providedBy'].searchResults = response;

        this.sparqlService.addGroupCurators(this.reviewService.groups, this.reviewService.curators)
      });
    });

    this.sparqlService.onCamsChanged
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(cams => {
        this.cams = cams;
        this.summary.detail = this.sparqlService.searchSummary;
        this.loadCams();
      });
  }

  toggleLeftDrawer(panel) {
    this.reviewService.toggleLeftDrawer(panel);
  }

  search() {
    let searchCriteria = this.searchForm.value;
    console.dir(searchCriteria)
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
      this.noctuaGraphService.getGraphInfo(cam, cam.model.id)
      cam.onGraphChanged.subscribe((annotons) => {
        //  let data = this.summaryGridService.getGrid(annotons);
        // this.sparqlService.addCamChildren(cam, data);
        //  this.dataSource = new CamsDataSource(this.sparqlService, this.paginator, this.sort);
      });
    }
  }

  selectCam(cam) {
    this.sparqlService.onCamChanged.next(cam);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}

