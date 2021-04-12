
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { NoctuaFormDialogService } from './../../services/dialog.service';
import {
  noctuaFormConfig,
  NoctuaActivityConnectorService,
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  CamService,
  Cam,
  Activity,
  ActivityType,
  NoctuaUserService,
  CamsService,
  CamRebuildSignal,
  ActivityDisplayType
} from 'noctua-form-base';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';

@Component({
  selector: 'noc-cam-table',
  templateUrl: './cam-table.component.html',
  styleUrls: ['./cam-table.component.scss'],
  animations: [
    trigger('activityExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CamTableComponent implements OnInit, OnDestroy {
  ActivityDisplayType = ActivityDisplayType;
  ActivityType = ActivityType;
  CamRebuildSignal = CamRebuildSignal;
  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;
  camDisplayTypeOptions = noctuaFormConfig.camDisplayType.options;
  activityTypeOptions = noctuaFormConfig.activityType.options;

  @Input('cam')
  public cam: Cam;

  @Input('options')
  public options: any = {};


  searchResults = [];
  modelId: '';
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };
  scrollbarConfig = {
    suppressScrollX: true
  }

  private _unsubscribeAll: Subject<any>;

  constructor(
    public camService: CamService,
    public camsService: CamsService,
    public noctuaCommonMenuService: NoctuaCommonMenuService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private confirmDialogService: NoctuaConfirmDialogService,
    private noctuaActivityConnectorService: NoctuaActivityConnectorService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    private noctuaFormDialogService: NoctuaFormDialogService,
  ) {

    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

  }



  addActivity() {
    this.openForm(location);
  }

  openForm(location?) {
    this.noctuaActivityFormService.mfLocation = location;
    this.noctuaActivityFormService.initializeForm();
  }

  reload(cam: Cam) {
    this.camService.reload(cam);
  }

  search() {
    let searchCriteria = this.searchForm.value;
    console.dir(searchCriteria)
    // this.noctuaSearchService.search(searchCriteria);
  }

  expandAll(expand: boolean) {
    this.cam.expandAllActivities(expand);
  }

  toggleExpand(activity: Activity) {
    activity.expanded = !activity.expanded;
  }

  openActivityConnector(activity: Activity) {
    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = activity;
    this.noctuaActivityConnectorService.subjectActivity = activity;
    this.noctuaActivityConnectorService.onActivityChanged.next(activity);
    this.noctuaActivityConnectorService.getConnections();
  }

  openActivityForm(activity: Activity) {
    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = activity;
    this.noctuaActivityFormService.initializeForm(activity);
  }

  sortBy(sortCriteria) {
    this.cam.sort = sortCriteria;
  }

  deleteActivity(activity: Activity) {
    const self = this;

    const success = () => {
      this.camService.deleteActivity(activity).then(() => {
        self.noctuaFormDialogService.openSuccessfulSaveToast('Activity successfully deleted.', 'OK');
      });
    };

    if (!self.noctuaUserService.user) {
      this.confirmDialogService.openConfirmDialog('Not Logged In',
        'Please log in to continue.',
        null);
    } else {
      this.confirmDialogService.openConfirmDialog('Confirm Delete?',
        'You are about to delete an activity.',
        success);
    }
  }


  resetModel(cam: Cam) {
    this.camService.resetModel(cam);
  }

  displayCamErrors() {
    const errors = this.cam.getViolationDisplayErrors();

    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }

  displayActivityErrors(activity: Activity) {
    const errors = activity.getViolationDisplayErrors();

    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
