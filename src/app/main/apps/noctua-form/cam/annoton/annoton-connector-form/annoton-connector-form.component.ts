

import { Component, Inject, Input, OnInit, ElementRef, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDrawer } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { merge, Observable, Subscription, BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';


import * as _ from 'lodash';
declare const require: any;
const each = require('lodash/forEach');

import { noctuaAnimations } from './../../../../../../../@noctua/animations';


import { NoctuaFormService } from '../../../services/noctua-form.service';

import { NoctuaAnnotonConnectorService } from 'noctua-form-base';
import { NoctuaGraphService } from 'noctua-form-base';
import { NoctuaAnnotonFormService } from 'noctua-form-base';
import { NoctuaFormConfigService } from 'noctua-form-base';
import { NoctuaLookupService } from 'noctua-form-base';
import { NoctuaSearchService } from './../../../../../../../@noctua.search/services/noctua-search.service';
import { CamService } from 'noctua-form-base';
import { CamDiagramService } from './../../cam-diagram/services/cam-diagram.service';
import { CamTableService } from './../../cam-table/services/cam-table.service';

import { SparqlService } from './../../../../../../../@noctua.sparql/services/sparql/sparql.service';

import { Cam } from 'noctua-form-base';
import { Annoton } from 'noctua-form-base';
import { AnnotonNode } from 'noctua-form-base';
import { Evidence } from 'noctua-form-base';
import { NoctuaFormDialogService } from '../../../services/dialog.service';

@Component({
  selector: 'noc-annoton-connector',
  templateUrl: './annoton-connector-form.component.html',
  styleUrls: ['./annoton-connector-form.component.scss']
})
export class AnnotonConnectorFormComponent implements OnInit, OnDestroy {

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  panel = {
    selectConnector: {
      id: 1
    }, annotonConnectorForm: {
      id: 2
    },
  };
  selectedPanel: any;
  annoton: Annoton;
  mfNode: AnnotonNode;

  cam: Cam;
  connectorFormGroup: FormGroup;
  connectorFormSub: Subscription;

  searchCriteria: any = {};
  evidenceFormArray: FormArray;
  // annoton: Annoton = new Annoton();

  subjectGPNode: AnnotonNode;
  objectGPNode: AnnotonNode;
  selectedCausalEffect;

  private unsubscribeAll: Subject<any>;


  constructor(private route: ActivatedRoute,
    private camService: CamService,
    private formBuilder: FormBuilder,
    public noctuaAnnotonConnectorService: NoctuaAnnotonConnectorService,
    private noctuaSearchService: NoctuaSearchService,
    private camDiagramService: CamDiagramService,
    public camTableService: CamTableService,
    private noctuaGraphService: NoctuaGraphService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaLookupService: NoctuaLookupService,
    public noctuaFormService: NoctuaFormService,
    private sparqlService: SparqlService
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.connectorFormSub = this.noctuaAnnotonConnectorService.connectorFormGroup$
      .subscribe(connectorFormGroup => {
        if (!connectorFormGroup) return;
        this.connectorFormGroup = connectorFormGroup;
        this.subjectGPNode = this.noctuaAnnotonConnectorService.subjectAnnoton.getGPNode()
        this.objectGPNode = this.noctuaAnnotonConnectorService.objectAnnoton.getGPNode()

        this.selectedCausalEffect = this.connectorFormGroup.get('causalEffect').value

        console.log(this.selectedCausalEffect)
      });

    this.camService.onCamChanged.subscribe((cam) => {
      if (!cam) return;

      this.cam = cam
    });

    this.noctuaAnnotonConnectorService.onAnnotonChanged.subscribe((annoton) => {
      this.annoton = annoton;
      this.selectPanel(this.panel.selectConnector);
    });

    this.selectPanel(this.panel.selectConnector);
  }

  selectPanel(panel) {
    this.selectedPanel = panel;
  }

  openAnnotonConnector(connector: Annoton) {
    this.noctuaAnnotonConnectorService.createConnection(this.noctuaAnnotonConnectorService.annoton.connectionId, connector.connectionId);
    this.selectPanel(this.panel.annotonConnectorForm);
  }

  openEditAnnotonConnector(connector: Annoton) {
    this.noctuaAnnotonConnectorService.createConnection(this.noctuaAnnotonConnectorService.annoton.connectionId, connector.connectionId, true);
    this.selectPanel(this.panel.annotonConnectorForm);
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence ? evidence.label : undefined;
  }

  save() {
    const self = this;
    this.noctuaAnnotonConnectorService.save().then(() => {
      self.selectPanel(self.panel.selectConnector);
      self.noctuaAnnotonConnectorService.getConnections();
      self.noctuaFormDialogService.openSuccessfulSaveToast('Causal relation successfully created.', 'OK');
    });
  }

  addEvidence() {
    const self = this;

    let evidenceFormGroup: FormArray = <FormArray>self.connectorFormGroup.get('evidenceFormArray');

    evidenceFormGroup.push(this.formBuilder.group({
      evidence: new FormControl(),
      reference: new FormControl(),
      with: new FormControl(),
    }));
  }

  removeEvidence(index) {
    const self = this;

    let evidenceFormGroup: FormArray = <FormArray>self.connectorFormGroup.get('evidenceFormArray');

    evidenceFormGroup.removeAt(index);
  }

  clear() {
    this.noctuaAnnotonFormService.clearForm();
  }



  close() {
    this.panelDrawer.close()
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
