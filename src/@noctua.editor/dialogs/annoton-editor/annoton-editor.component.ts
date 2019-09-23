import { Component, OnInit, OnDestroy, ViewChild, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatMenuTrigger } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import * as _ from 'lodash';
import { Cam, NoctuaAnnotonEntityService, NoctuaAnnotonFormService, CamService, Annoton, AnnotonNode, noctuaFormConfig, Entity, Evidence, AnnotonNodeType } from 'noctua-form-base';

import { NoctuaFormConfigService } from 'noctua-form-base';
import { NoctuaGraphService } from 'noctua-form-base';
import { NoctuaLookupService } from 'noctua-form-base';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form/services/dialog.service';
import { EditorCategory } from './../../models/editor-category';

@Component({
  selector: 'noc-annoton-editor-dialog',
  templateUrl: './annoton-editor.component.html',
  styleUrls: ['./annoton-editor.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AnnotonEditorDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;


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

  displaySection = {
    term: false,
    evidence: false,
    reference: false,
    with: false,
  };

  private unsubscribeAll: Subject<any>;

  constructor(
    private _matDialogRef: MatDialogRef<AnnotonEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private camService: CamService,
    private formBuilder: FormBuilder,
    private noctuaAnnotonEntityService: NoctuaAnnotonEntityService,
    private noctuaGraphService: NoctuaGraphService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaLookupService: NoctuaLookupService,
  ) {
    this._unsubscribeAll = new Subject();

    this.cam = _data.cam;
    this.annoton = _data.annoton;
    this.entity = _data.entity;
    this.category = _data.category;
    this.evidenceIndex = _data.evidenceIndex;
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
    this._matDialogRef.close();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
