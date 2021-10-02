import { Component, OnInit, OnDestroy, NgZone, Input, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivityNode, Cam, CamLoadingIndicator, CamService, CamStats, LeftPanel, NoctuaFormConfigService, NoctuaFormMenuService, NoctuaGraphService, NoctuaUserService, RightPanel, TermsSummary, TermSummary } from 'noctua-form-base';
import { NoctuaSearchService } from './../..//services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';
import { finalize, takeUntil } from 'rxjs/operators';
import { NoctuaReviewSearchService } from './../../services/noctua-review-search.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { MiddlePanel } from './../../models/menu-panels';
import { NoctuaSearchDialogService } from './../../services/dialog.service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'noc-cam-terms',
  templateUrl: './cam-terms.component.html',
  styleUrls: ['./cam-terms.component.scss']
})
export class CamTermsComponent implements OnInit, OnDestroy {
  MiddlePanel = MiddlePanel;

  @ViewChild('tree') tree;
  @Input('panelDrawer')
  panelDrawer: MatDrawer;
  cam: Cam;
  termsSummary: TermsSummary;
  stats

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  displayedColumns = [
    'category',
    'count'
  ];



  treeOptions = {
    allowDrag: false,
    allowDrop: false,
    // levelPadding: 15,
  };

  private _unsubscribeAll: Subject<any>;
  treeNodes

  constructor(
    private zone: NgZone,
    private _noctuaGraphService: NoctuaGraphService,
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
    this._noctuaGraphService.onCamGraphChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam: Cam) => {
        if (!cam) {
          return;
        }
        this.cam = cam;
        this.termsSummary = this._noctuaGraphService.getTerms(this.cam.graph)
        this.treeNodes = this._buildTree(this.termsSummary)
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  openSearch() {
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.findReplace);
  }


  openTermDetail(term) {
    this.noctuaSearchService.onDetailTermChanged.next(term)
    this.noctuaFormMenuService.openRightDrawer(RightPanel.termDetail);
  }

  private _buildTree(termsSummary: TermsSummary) {

    termsSummary.other.label = 'Other';

    const allTerms = [termsSummary.mf, termsSummary.bp, termsSummary.cc, termsSummary.gp, termsSummary.other]

    const treeNodes = allTerms.map((termSummary: TermSummary) => {
      return {
        id: termSummary.label,
        frequency: termSummary.frequency,
        isCategory: true,
        label: termSummary.label,
        children: termSummary.nodes
      }
    })

    console.log(treeNodes)

    return treeNodes
  }



  onTreeLoad() {
    // this.tree.treeModel.expandAll();
  }

  close() {
    this.panelDrawer.close();
  }

}
