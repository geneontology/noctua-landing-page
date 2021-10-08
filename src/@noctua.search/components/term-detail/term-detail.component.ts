import { Component, OnInit, OnDestroy, NgZone, Input, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivityNode, Cam, CamLoadingIndicator, CamService, CamStats, LeftPanel, NoctuaFormConfigService, NoctuaFormMenuService, NoctuaGraphService, NoctuaLookupService, NoctuaUserService, TermsSummary, TermSummary } from 'noctua-form-base';
import { NoctuaSearchService } from './../..//services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';
import { finalize, takeUntil } from 'rxjs/operators';
import { NoctuaReviewSearchService } from './../../services/noctua-review-search.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { MiddlePanel } from './../../models/menu-panels';
import { NoctuaSearchDialogService } from './../../services/dialog.service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'noc-term-detail',
  templateUrl: './term-detail.component.html',
  styleUrls: ['./term-detail.component.scss']
})
export class TermDetailComponent implements OnInit, OnDestroy {

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  termDetail: any = {}



  private _unsubscribeAll: Subject<any>;

  constructor(
    private zone: NgZone,
    private _noctuaGraphService: NoctuaGraphService,
    private noctuaLookupService: NoctuaLookupService,
    public noctuaFormMenuService: NoctuaFormMenuService,
    public camService: CamService,
    private confirmDialogService: NoctuaConfirmDialogService,
    public noctuaSearchDialogService: NoctuaSearchDialogService,
    public noctuaUserService: NoctuaUserService,
    public noctuaReviewSearchService: NoctuaReviewSearchService,
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    public noctuaSearchService: NoctuaSearchService,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.noctuaSearchService.onDetailTermChanged.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((term: ActivityNode) => {
        if (!term) {
          return;
        }
        this.loadTerm(term.term.id)
      })
  }


  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  loadTerm(termId) {
    this.noctuaLookupService.getTermDetail(termId)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((res) => {
        this.termDetail = res
      })
  }
  openSearch() {
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.findReplace);
  }


  close() {
    this.panelDrawer.close();
  }

}
