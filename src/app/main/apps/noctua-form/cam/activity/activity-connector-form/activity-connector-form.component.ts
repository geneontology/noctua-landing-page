

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';

import {
  Cam,
  Activity,
  ConnectorActivity,
  ConnectorState,
  ConnectorType,
  ActivityNode,
  Evidence,
  NoctuaActivityConnectorService,
  NoctuaActivityFormService,
  NoctuaFormConfigService,
  CamService,
  noctuaFormConfig,
  Entity,
  NoctuaUserService,
  NoctuaFormMenuService
} from 'noctua-form-base';
import { NoctuaFormDialogService } from '../../../services/dialog.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noc-activity-connector',
  templateUrl: './activity-connector-form.component.html',
  styleUrls: ['./activity-connector-form.component.scss']
})
export class ActivityConnectorFormComponent implements OnInit, OnDestroy {

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  connectorType = ConnectorType;
  connectorState = ConnectorState;
  activity: Activity;
  currentConnectorActivity: ConnectorActivity;
  connectorActivity: ConnectorActivity;
  mfNode: ActivityNode;
  cam: Cam;
  connectorFormGroup: FormGroup;
  connectorFormSub: Subscription;
  searchCriteria: any = {};
  evidenceFormArray: FormArray;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private camService: CamService,
    private confirmDialogService: NoctuaConfirmDialogService,
    public noctuaActivityConnectorService: NoctuaActivityConnectorService,
    public noctuaUserService: NoctuaUserService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    public noctuaFormMenuService: NoctuaFormMenuService,
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.connectorFormSub = this.noctuaActivityConnectorService.connectorFormGroup$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(connectorFormGroup => {
        if (!connectorFormGroup) {
          return;
        }
        this.connectorFormGroup = connectorFormGroup;
        this.currentConnectorActivity = this.noctuaActivityConnectorService.currentConnectorActivity;
        this.connectorActivity = this.noctuaActivityConnectorService.connectorActivity;
      });

    this.camService.onCamChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam) => {
        if (!cam) {
          return;
        }

        this.cam = cam;
      });

    this.noctuaActivityConnectorService.onActivityChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((activity) => {
        this.activity = activity;
        this.noctuaActivityConnectorService.selectPanel(this.noctuaActivityConnectorService.panel.selectConnector);
      });

    this.noctuaActivityConnectorService.selectPanel(this.noctuaActivityConnectorService.panel.selectConnector);
  }

  openActivityConnector(connector: Activity) {
    this.noctuaActivityConnectorService.initializeForm(this.noctuaActivityConnectorService.activity.id, connector.id);
    this.noctuaActivityConnectorService.selectPanel(this.noctuaActivityConnectorService.panel.activityConnectorForm);
  }

  save() {
    const self = this;
    this.noctuaActivityConnectorService.saveActivity().then(() => {
      self.noctuaActivityConnectorService.selectPanel(self.noctuaActivityConnectorService.panel.selectConnector);
      self.noctuaActivityConnectorService.getConnections();
      self.noctuaFormDialogService.openSuccessfulSaveToast('Causal relation successfully created.', 'OK');
    });
  }

  editActivity() {
    const self = this;
    const success = () => {
      self.noctuaActivityConnectorService.saveActivity().then(() => {
        self.noctuaActivityConnectorService.selectPanel(self.noctuaActivityConnectorService.panel.selectConnector);
        self.noctuaActivityConnectorService.getConnections();
        self.noctuaFormDialogService.openSuccessfulSaveToast('Causal relation successfully updated.', 'OK');
      });
    };

    this.confirmDialogService.openConfirmDialog('Confirm Delete?',
      'You are about to remove the causal relation',
      success);
  }

  deleteActivity(connectorActivity: ConnectorActivity) {
    const self = this;
    const success = () => {
      self.noctuaActivityConnectorService.deleteActivity(connectorActivity).then(() => {
        self.noctuaActivityConnectorService.selectPanel(self.noctuaActivityConnectorService.panel.selectConnector);
        self.noctuaActivityConnectorService.getConnections();
        self.noctuaFormDialogService.openSuccessfulSaveToast('Causal relation successfully deleted.', 'OK');
      });
    };

    this.confirmDialogService.openConfirmDialog('Confirm Delete?',
      'You are about to remove the causal relation',
      success);
  }

  addEvidence() {
    const self = this;

    self.connectorActivity.upstreamNode.predicate.addEvidence();
    this.noctuaActivityConnectorService.updateEvidence(self.connectorActivity.upstreamNode);
  }

  removeEvidence(index: number) {
    const self = this;

    self.connectorActivity.upstreamNode.predicate.removeEvidence(index);
    this.noctuaActivityConnectorService.updateEvidence(self.connectorActivity.upstreamNode);
  }

  addNDEvidence() {
    const self = this;

    const evidence = new Evidence();
    evidence.setEvidence(new Entity(
      noctuaFormConfig.evidenceAutoPopulate.nd.evidence.id,
      noctuaFormConfig.evidenceAutoPopulate.nd.evidence.label));
    evidence.reference = noctuaFormConfig.evidenceAutoPopulate.nd.reference;
    self.connectorActivity.upstreamNode.predicate.setEvidence([evidence]);
    this.noctuaActivityConnectorService.updateEvidence(self.connectorActivity.upstreamNode);
  }

  clearValues() {
    const self = this;

    self.connectorActivity.upstreamNode.clearValues();
    this.noctuaActivityConnectorService.updateEvidence(self.connectorActivity.upstreamNode);
  }

  openSelectEvidenceDialog() {
    const self = this;

    const evidences: Evidence[] = this.camService.getUniqueEvidence();

    const success = (selected) => {
      if (selected.evidences && selected.evidences.length > 0) {
        self.connectorActivity.upstreamNode.predicate.setEvidence(selected.evidences);
        this.noctuaActivityConnectorService.updateEvidence(self.connectorActivity.upstreamNode);
      }
    };

    self.noctuaFormDialogService.openSelectEvidenceDialog(evidences, success);
  }

  clear() {
    this.noctuaActivityFormService.clearForm();
  }

  close() {
    this.panelDrawer.close();
  }

  termDisplayFn(term): string | undefined {
    return term && term.id ? `${term.label} (${term.id})` : undefined;
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence && evidence.id ? `${evidence.label} (${evidence.id})` : undefined;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
