import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { noctuaAnimations } from '@noctua/animations';
import { takeUntil } from 'rxjs/internal/operators';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';

import {
  NoctuaFormConfigService, NoctuaUserService,
} from 'noctua-form-base';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { CamPage } from '@noctua.search/models/cam-page';
import { NoctuaSearchMenuService } from '@noctua.search/services/search-menu.service';
import { PaginationInstance } from 'ngx-pagination';

export function CustomPaginator() {
  const customPaginatorIntl = new MatPaginatorIntl();

  customPaginatorIntl.itemsPerPageLabel = 'GO CAMs per page:';

  return customPaginatorIntl;
}

@Component({
  selector: 'noc-cams-table',
  templateUrl: './cams-table.component.html',
  styleUrls: ['./cams-table.component.scss'],
  animations: noctuaAnimations,
  providers: [
    { provide: MatPaginatorIntl, useValue: CustomPaginator() }
  ]
})
export class CamsTableComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;

  //@ViewChild(MatPaginator, { static: true })
  // paginator: MatPaginator;

  displayedColumns = [
    'title',
    'state',
    'date',
    'contributor',
    'edit',
    'export'];

  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  cams: any[] = [];
  camPage: CamPage;




  public filter: string = '';
  public maxSize: number = 7;
  public directionLinks: boolean = true;
  public autoHide: boolean = false;
  public responsive: boolean = false;
  public config: PaginationInstance = {
    id: 'advanced',
    itemsPerPage: 10,
    currentPage: 1
  };
  public labels: any = {
    previousLabel: 'Previous',
    nextLabel: 'Next',
    screenReaderPaginationLabel: 'Pagination',
    screenReaderPageLabel: 'page',
    screenReaderCurrentLabel: `You're on page`
  };
  public eventLog: string[] = [];

  private popped = [];

  onPageChange(number: number) {
    console.log(`pageChange(${number})`);
    this.config.currentPage = number;
  }

  onPageBoundsCorrection(number: number) {
    console.log(`pageBoundsCorrection(${number})`);
    this.config.currentPage = number;
  }

  constructor(
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaUserService: NoctuaUserService,
    public noctuaSearchService: NoctuaSearchService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.noctuaSearchService.onCamsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cams => {
        if (!cams) {
          return;
        }
        this.cams = cams;
      });

    this.noctuaSearchService.onCamsPageChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((camPage: CamPage) => {
        if (!camPage) {
          return;
        }
        this.camPage = camPage;
      });
  }

  toggleLeftDrawer(panel) {
    this.noctuaSearchMenuService.toggleLeftDrawer(panel);
  }

  search() {
    const searchCriteria = this.searchForm.value;
    this.noctuaSearchService.search(searchCriteria);
  }

  getStateClass(stateLabel) {
    return {
      'noc-development': stateLabel === 'development',
      'noc-production': stateLabel === 'production',
      'noc-review': stateLabel === 'review'
    }
  }

  setPage($event) {
    console.log($event)
    if (this.camPage) {
      let pageIndex = $event.pageIndex;
      if (this.noctuaSearchService.searchCriteria.camPage.size > $event.pageSize) {
        pageIndex = 0;
      }
      this.noctuaSearchService.getPage(pageIndex, $event.pageSize);
    }
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

