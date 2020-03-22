import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { NoctuaFormConfigService, NoctuaUserService } from 'noctua-form-base';
import { NoctuaSearchService } from './../..//services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';

@Component({
  selector: 'noc-search-history',
  templateUrl: './search-history.component.html',
  styleUrls: ['./search-history.component.scss']
})
export class SearchHistoryComponent implements OnInit, OnDestroy {
  searchCriteria: any = {};

  private unsubscribeAll: Subject<any>;

  constructor(public noctuaUserService: NoctuaUserService,
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    private noctuaSearchService: NoctuaSearchService,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    // this.groups = this.noctuaSearchService.groups;
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    //this.searchForm = this.createSearchForm();
  }

  selectGroup(group) {
    this.searchCriteria.group = group;
    this.noctuaSearchService.search(this.searchCriteria);
  }


  search() {
    let searchCriteria

    this.noctuaSearchService.search(searchCriteria);
  }

  close() {
    this.noctuaSearchMenuService.closeLeftDrawer();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
