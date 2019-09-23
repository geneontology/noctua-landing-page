import { Component, Inject, Input, OnInit, ElementRef, OnDestroy, ViewEncapsulation, ViewChild, NgZone } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

import { FormBuilder, FormControl, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDrawer } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { merge, Observable, Subscription, BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { debounceTime, take, distinctUntilChanged, map } from 'rxjs/operators';


import * as _ from 'lodash';
declare const require: any;
const each = require('lodash/forEach');

import { noctuaAnimations } from './../../../@noctua/animations';

import {
  NoctuaGraphService,
  NoctuaFormConfigService,
  NoctuaAnnotonFormService,
  NoctuaLookupService,
  NoctuaAnnotonEntityService,
  CamService,
  Entity,
  AnnotonNodeType,
  noctuaFormConfig
} from 'noctua-form-base';

import { Cam } from 'noctua-form-base';
import { Annoton } from 'noctua-form-base';
import { AnnotonNode } from 'noctua-form-base';
import { Evidence } from 'noctua-form-base';

import { editorDropdownData } from './editor-dropdown.tokens';
import { EditorDropdownOverlayRef } from './editor-dropdown-ref';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';
import { EditorCategory } from './../../models/editor-category';

@Component({
  selector: 'noc-editor-dropdown',
  templateUrl: './editor-dropdown.component.html',
  styleUrls: ['./editor-dropdown.component.scss']
})

export class NoctuaEditorDropdownComponent implements OnInit, OnDestroy {
  EditorCategory = EditorCategory;
  evidenceDBForm: FormGroup;
  annoton: Annoton;
  cam: Cam;
  entity: AnnotonNode;
  category: EditorCategory;
  evidenceIndex: number;
  entityFormGroup: FormGroup;
  evidenceFormGroup: FormGroup;
  entityFormSub: Subscription;

  termNode: AnnotonNode;

  private unsubscribeAll: Subject<any>;

  displaySection = {
    term: false,
    evidence: false,
    reference: false,
    with: false,
  };

  constructor(private route: ActivatedRoute,
    public dialogRef: EditorDropdownOverlayRef,
    @Inject(editorDropdownData) public data: any,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private ngZone: NgZone,
    private camService: CamService,
    private formBuilder: FormBuilder,
    private noctuaAnnotonEntityService: NoctuaAnnotonEntityService,
    private noctuaGraphService: NoctuaGraphService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaLookupService: NoctuaLookupService,
  ) {
    this.unsubscribeAll = new Subject();

    this.cam = data.cam;
    this.annoton = data.annoton;
    this.entity = data.entity;
    this.category = data.category;
    this.evidenceIndex = data.evidenceIndex;
  }

  ngOnInit(): void {
    this._displaySection(this.category);
    this.evidenceDBForm = this._createEvidenceDBForm();
    this.entityFormSub = this.noctuaAnnotonEntityService.entityFormGroup$
      .subscribe(entityFormGroup => {
        if (!entityFormGroup) {
          return;
        }

        const evidenceFormArray = entityFormGroup.get('evidenceFormArray') as FormArray;

        this.entityFormGroup = entityFormGroup;
        this.evidenceFormGroup = evidenceFormArray.at(this.evidenceIndex) as FormGroup;
        console.log(this.evidenceFormGroup);
      });
  }

  save() {
    const self = this;

    self.noctuaAnnotonEntityService.saveAnnoton().then((data) => {
      this.close();
      self.noctuaFormDialogService.openSuccessfulSaveToast('Activity successfully updated.', 'OK');
    });
  }

  addEvidence() {
    const self = this;

    self.entity.predicate.addEvidence();
    self.noctuaAnnotonFormService.initializeForm();
  }

  removeEvidence(index: number) {
    const self = this;

    self.entity.predicate.removeEvidence(index);
    self.noctuaAnnotonFormService.initializeForm();
  }

  toggleIsComplement(entity: AnnotonNode) {

  }

  openSearchDatabaseDialog(entity: AnnotonNode) {
    const self = this;
    const gpNode = this.noctuaAnnotonFormService.annoton.getGPNode();

    if (gpNode) {
      const data = {
        readonly: false,
        gpNode: gpNode.term,
        aspect: entity.aspect,
        entity: entity,
        params: {
          term: '',
          evidence: ''
        }
      };

      const success = function (selected) {
        if (selected.term) {
          entity.term = new Entity(selected.term.term.id, selected.term.term.label);

          if (selected.evidences && selected.evidences.length > 0) {
            entity.predicate.setEvidence(selected.evidences);
          }
          self.noctuaAnnotonFormService.initializeForm();
        }
      }
      self.noctuaFormDialogService.openSearchDatabaseDialog(data, success);
    } else {
      const errors = [];
      const meta = {
        aspect: gpNode ? gpNode.label : 'Gene Product'
      }
      // const error = new AnnotonError('error', 1, "Please enter a gene product", meta)
      //errors.push(error);
      // self.dialogService.openAnnotonErrorsDialog(ev, entity, errors)
    }
  }

  insertEntity(nodeType: AnnotonNodeType) {
    this.noctuaFormConfigService.insertAnnotonNode(this.noctuaAnnotonFormService.annoton, this.entity, nodeType);
    this.noctuaAnnotonFormService.initializeForm();
  }

  addRootTerm() {
    const self = this;

    const term = _.find(noctuaFormConfig.rootNode, (rootNode) => {
      return rootNode.aspect === self.entity.aspect;
    });

    if (term) {
      self.entity.term = new Entity(term.id, term.label);
      self.noctuaAnnotonFormService.initializeForm();

      const evidence = new Evidence();
      evidence.setEvidence(new Entity(
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.id,
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.label));
      evidence.reference = noctuaFormConfig.evidenceAutoPopulate.nd.reference;
      self.entity.predicate.setEvidence([evidence]);
      self.noctuaAnnotonFormService.initializeForm();
    }
  }

  clearValues() {
    const self = this;

    self.entity.clearValues();
    self.noctuaAnnotonFormService.initializeForm();
  }

  openSelectEvidenceDialog() {
    const self = this;
    const evidences: Evidence[] = this.camService.getUniqueEvidence(self.noctuaAnnotonFormService.annoton);
    const success = (selected) => {
      if (selected.evidences && selected.evidences.length > 0) {
        self.entity.predicate.setEvidence(selected.evidences, ['assignedBy']);
        self.noctuaAnnotonFormService.initializeForm();
      }
    };

    self.noctuaFormDialogService.openSelectEvidenceDialog(evidences, success);
  }

  onSubmitEvidedenceDb(evidence: FormGroup, name: string) {
    console.log(evidence);
    console.log(this.evidenceDBForm.value);

    const DB = this.evidenceDBForm.value.db;
    const accession = this.evidenceDBForm.value.accession;

    const control: FormControl = evidence.controls[name] as FormControl;
    control.setValue(DB.name + ':' + accession);
  }

  cancelEvidenceDb() {
    this.evidenceDBForm.controls['accession'].setValue('');
  }

  termDisplayFn(term): string | undefined {
    return term ? term.label : undefined;
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence ? evidence.label : undefined;
  }

  private _createEvidenceDBForm() {
    return new FormGroup({
      db: new FormControl(this.noctuaFormConfigService.evidenceDBs.selected),
      accession: new FormControl()
    });
  }

  private _displaySection(category: EditorCategory) {
    switch (category) {
      case EditorCategory.term:
        this.displaySection.term = true;
        break;
      case EditorCategory.evidence:
        this.displaySection.evidence = true;
        break;
      case EditorCategory.reference:
        this.displaySection.reference = true;
        break;
      case EditorCategory.with:
        this.displaySection.with = true;
        break;
      case EditorCategory.evidenceAll:
        this.displaySection.evidence = true;
        this.displaySection.reference = true;
        this.displaySection.with = true;
        break;
      case EditorCategory.all:
        this.displaySection.term = true;
        this.displaySection.evidence = true;
        this.displaySection.reference = true;
        this.displaySection.with = true;
        break;
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}

