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

export function CustomPaginator() {
  const customPaginatorIntl = new MatPaginatorIntl();

  customPaginatorIntl.itemsPerPageLabel = 'CAMs per page:';

  return customPaginatorIntl;
}

@Component({
  selector: 'noc-cams-table',
  templateUrl: './cams-table.component.html',
  styleUrls: ['./cams-table.component.scss'],
  animations: noctuaAnimations,
  providers: [
    { provide: MatPaginatorIntl, useValue: CustomPaginator() }  // Here
  ]
})
export class CamsTableComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

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
    if (this.camPage) {
      this.noctuaSearchService.getPage($event.pageIndex);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

}

