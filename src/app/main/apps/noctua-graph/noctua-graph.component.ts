import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { noctuaAnimations } from './../../../../@noctua/animations';
import {
  Cam,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  CamService,
  CamsService,
  Activity
} from 'noctua-form-base';

import { FormGroup } from '@angular/forms';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CamPage } from '@noctua.search/models/cam-page';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { ReviewMode } from '@noctua.search/models/review-mode';
import { LeftPanel, MiddlePanel, RightPanel } from '@noctua.common/models/menu-panels';
import { ArtBasket } from '@noctua.search/models/art-basket';
import { NoctuaReviewSearchService } from '@noctua.search/services/noctua-review-search.service';
import { NoctuaPerfectScrollbarDirective } from '@noctua/directives/noctua-perfect-scrollbar/noctua-perfect-scrollbar.directive';

@Component({
  selector: 'noc-noctua-graph',
  templateUrl: './noctua-graph.component.html',
  styleUrls: ['./noctua-graph.component.scss'],
  // encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaGraphComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  @ViewChildren(NoctuaPerfectScrollbarDirective)
  private _noctuaPerfectScrollbarDirectives: QueryList<NoctuaPerfectScrollbarDirective>;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  ReviewMode = ReviewMode;
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;
  RightPanel = RightPanel;
  artBasket: ArtBasket = new ArtBasket();

  camPage: CamPage;
  public cam: Cam;
  public user: Contributor;

  searchResults = [];
  modelId = '';
  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;

  cams: any[] = [];

  tableOptions = {
    treeTable: true,
    editableTerms: true,
    editableEvidence: true,
    editableReference: true,
    editableWith: true,
  };

  private _unsubscribeAll: Subject<any>;

  constructor(
    private route: ActivatedRoute,
    private camService: CamService,
    public camsService: CamsService,
    public noctuaReviewSearchService: NoctuaReviewSearchService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaCommonMenuService: NoctuaCommonMenuService,
    public noctuaUserService: NoctuaUserService,
    public noctuaSearchService: NoctuaSearchService,
  ) {
    this._unsubscribeAll = new Subject();

    this.noctuaCommonMenuService.selectedMiddlePanel = MiddlePanel.camGraph;

    this.route
      .queryParams
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        this.modelId = params['model_id'] || null;
        const baristaToken = params['barista_token'] || null;
        this.noctuaUserService.getUser(baristaToken);
      });

    this.noctuaUserService.onUserChanged.pipe(
      distinctUntilChanged(this.noctuaUserService.distinctUser),
      takeUntil(this._unsubscribeAll))
      .subscribe((user: Contributor) => {
        this.noctuaFormConfigService.setupUrls();
        this.noctuaFormConfigService.setUniversalUrls();
        this.loadCam(this.modelId);
      });
  }

  ngOnInit(): void {
    this.noctuaCommonMenuService.setLeftDrawer(this.leftDrawer);
    this.noctuaCommonMenuService.setRightDrawer(this.rightDrawer);
  }

  ngAfterViewInit(): void {
    this.noctuaCommonMenuService.resultsViewScrollbar = this._noctuaPerfectScrollbarDirectives.find((directive) => {
      return directive.elementRef.nativeElement.id === 'noc-results';
    });
  }

  loadCam(modelId) {
    this.cam = this.camService.getCam(modelId);
  }

  openGraph() {
    this.noctuaCommonMenuService.selectMiddlePanel(MiddlePanel.camGraph)
  }

  openTable() {
    this.noctuaCommonMenuService.selectMiddlePanel(MiddlePanel.camTable)
  }

  openPreview() {
    this.noctuaCommonMenuService.selectMiddlePanel(MiddlePanel.camPreview)
  }

  openLeftDrawer(panel) {
    this.noctuaCommonMenuService.selectLeftPanel(panel);
    // this.noctuaCommonMenuService.openLeftDrawer();
  }

  selectMiddlePanel(panel: MiddlePanel) {
    const self = this;
    this.noctuaCommonMenuService.selectMiddlePanel(panel);
  }


  openRightDrawer(panel) {
    this.noctuaCommonMenuService.selectRightPanel(panel);
    this.noctuaCommonMenuService.openRightDrawer();
  }

  toggleLeftDrawer(panel) {
    this.noctuaCommonMenuService.toggleLeftDrawer(panel);
  }

  createModel(type: 'graph-editor' | 'noctua-form') {
    this.noctuaCommonMenuService.createModel(type);
  }



  search() {
    const searchCriteria = this.searchForm.value;
    this.noctuaSearchService.search(searchCriteria);
  }

  refresh() {
    this.noctuaSearchService.updateSearch();
  }

  reset() {
    this.noctuaSearchService.clearSearchCriteria();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
