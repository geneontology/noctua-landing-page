
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../../../../../@noctua/animations';


import {
  NoctuaFormConfigService,
  NoctuaActivityEntityService,
  CamService,
  NoctuaFormMenuService,
  Predicate,
  NoctuaUserService,
  CamsService
} from 'noctua-form-base';

import {
  Cam,
  Activity,
  ActivityNode
} from 'noctua-form-base';
import { EditorCategory } from '@noctua.editor/models/editor-category';


@Component({
  selector: 'noc-evidence-table',
  templateUrl: './evidence-table.component.html',
  styleUrls: ['./evidence-table.component.scss'],
  animations: noctuaAnimations
})
export class EvidenceTableComponent implements OnInit, OnDestroy {
  EditorCategory = EditorCategory;
  displayedColumns = [
    'evidence',
    'reference',
    'with',
    'assignedBy',
    'contributor'];


  @Input('options')
  options: any = {};

  @Input('cam')
  public cam: Cam;

  @Input('entity')
  public entity: ActivityNode;

  private unsubscribeAll: Subject<any>;

  constructor(
    private camService: CamService,
    public camsService: CamsService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormMenuService: NoctuaFormMenuService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    //  public noctuaFormMenuService: NoctuaFormMenuService,
    public noctuaActivityEntityService: NoctuaActivityEntityService) {

    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}

