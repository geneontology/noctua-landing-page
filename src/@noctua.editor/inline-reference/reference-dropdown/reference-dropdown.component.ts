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
  noctuaFormConfig,
  AnnotonError
} from 'noctua-form-base';

import { Cam } from 'noctua-form-base';
import { Annoton } from 'noctua-form-base';
import { AnnotonNode } from 'noctua-form-base';
import { Evidence } from 'noctua-form-base';

import { referenceDropdownData } from './reference-dropdown.tokens';
import { ReferenceDropdownOverlayRef } from './reference-dropdown-ref';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'noc-reference-dropdown',
  templateUrl: './reference-dropdown.component.html',
  styleUrls: ['./reference-dropdown.component.scss']
})

export class NoctuaReferenceDropdownComponent implements OnInit, OnDestroy {
  evidenceDBForm: FormGroup;
  formControl: FormControl;

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    public dialogRef: ReferenceDropdownOverlayRef,
    @Inject(referenceDropdownData) public data: any,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private confirmDialogService: NoctuaConfirmDialogService,
    private formBuilder: FormBuilder,
    private noctuaAnnotonEntityService: NoctuaAnnotonEntityService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaLookupService: NoctuaLookupService,
  ) {
    this.unsubscribeAll = new Subject();
    this.formControl = data.formControl;
  }

  ngOnInit(): void {
    this.evidenceDBForm = this._createEvidenceDBForm();
  }



  clearValues() {
    const self = this;

  }

  save() {
    const self = this;
    const db = this.evidenceDBForm.value.db;
    const accession = this.evidenceDBForm.value.accession;
    const errors = [];
    let canSave = true;

    if (accession.trim() === '') {
      const error = new AnnotonError('error', 1, `${db.name} accession is required`);
      errors.push(error);
      self.noctuaFormDialogService.openAnnotonErrorsDialog(errors);
      canSave = false;
    }

    if (canSave) {
      this.formControl.setValue(db.name + ':' + accession);
      this.close();
    }
  }

  cancelEvidenceDb() {
    this.evidenceDBForm.controls['accession'].setValue('');
  }

  private _createEvidenceDBForm() {
    return new FormGroup({
      db: new FormControl(this.noctuaFormConfigService.evidenceDBs.selected),
      accession: new FormControl('')
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
