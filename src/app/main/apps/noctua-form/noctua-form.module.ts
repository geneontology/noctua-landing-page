import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TreeModule } from '@circlon/angular-tree-component';
import { NoctuaFormComponent } from './noctua-form.component';
import { NoctuaSharedModule } from './../../../../@noctua/shared.module';
import { NoctuaFormDialogService } from './services/dialog.service';
import { ContextMenuModule } from 'ngx-contextmenu';
import { ActivityFormComponent } from './cam/activity/activity-form/activity-form.component';
import { EntityFormComponent } from './cam/activity/activity-form/entity-form/entity-form.component';
import { CamTableComponent } from './cam/cam-table/cam-table.component';
import { CamFormComponent } from './cam/cam-form/cam-form.component';
import { AddEvidenceDialogComponent } from './dialogs/add-evidence/add-evidence.component';
import { ActivityErrorsDialogComponent } from './dialogs/activity-errors/activity-errors.component';
import { BeforeSaveDialogComponent } from './dialogs/before-save/before-save.component';
import { CreateFromExistingDialogComponent } from './dialogs/create-from-existing/create-from-existing.component';
import { LinkToExistingDialogComponent } from './dialogs/link-to-existing/link-to-existing.component';
import { SelectEvidenceDialogComponent } from './dialogs/select-evidence/select-evidence.component';
import { SearchDatabaseDialogComponent } from './dialogs/search-database/search-database.component';
import { CamDiagramComponent } from './cam/cam-diagram/cam-diagram.component';
import { NodeComponent } from './cam/cam-diagram/nodes/node/node.component';
import { NodesContainerComponent } from './cam/cam-diagram/nodes/nodes-container.component';
import { CamDiagramService } from './cam/cam-diagram/services/cam-diagram.service';
import { NodeService } from './cam/cam-diagram/nodes/services/node.service';
import { ActivityConnectorFormComponent } from './cam/activity/activity-connector-form/activity-connector-form.component';
import { ActivityTableComponent } from './cam/cam-table/activity-table/activity-table.component';
import { TripleTableComponent } from './cam/cam-table/triple-table/triple-table.component';
import { GraphPreviewComponent } from './cam/cam-preview/graph-preview/graph-preview.component';
import { NoctuaConfirmDialogModule } from '@noctua/components';
import { CamPreviewComponent } from './cam/cam-preview/cam-preview.component';
import { CamGraphComponent } from './cam/cam-preview/cam-graph/cam-graph.component';
import { NoctuaEditorModule } from '@noctua.editor/noctua-editor.module';
import { PreviewActivityDialogComponent } from './dialogs/preview-activity/preview-activity.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SearchEvidenceDialogComponent } from './dialogs/search-evidence/search-evidence.component';
import { SelectEvidenceComponent } from './components/select-evidence/select-evidence.component';
import { MatTreeModule } from '@angular/material/tree';
import { CamErrorsDialogComponent } from './dialogs/cam-errors/cam-errors.component';
import { EvidenceTableComponent } from './cam/cam-table/activity-table/evidence-table/evidence-table.component';
import { ActivityTreeComponent } from './cam/cam-table/activity-tree/activity-tree.component';
import { ActivityTreeNodeComponent } from './cam/cam-table/activity-tree/activity-tree-node/activity-tree-node.component';
import { CreateActivityDialogComponent } from './dialogs/create-activity/create-activity.component';
import { ActivityTreeTableComponent } from './cam/cam-table/activity-tree-table/activity-tree-table.component';
import { ActivitySlimTreeComponent } from './cam/cam-table/activity-slim-tree/activity-slim-tree.component';
import { ActivitySlimTreeNodeComponent } from './cam/cam-table/activity-slim-tree/activity-slim-tree-node/activity-tree-node.component';
import { PreviewActivityComponent } from './cam/activity/preview-activity/preview-activity.component';

const routes = [
  {
    path: 'f',
    component: NoctuaFormComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    TreeModule,
    CommonModule,
    // NoctuaModule.forRoot(noctuaConfig),
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    NoctuaConfirmDialogModule,
    NoctuaEditorModule,

    //Material
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatTreeModule,
  ],
  exports: [
    ActivityFormComponent,
    EntityFormComponent,
    CamTableComponent,
    AddEvidenceDialogComponent,
    CreateActivityDialogComponent,
    ActivityErrorsDialogComponent,
    CamErrorsDialogComponent,
    BeforeSaveDialogComponent,
    CreateFromExistingDialogComponent,
    LinkToExistingDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    SearchEvidenceDialogComponent,
    PreviewActivityDialogComponent,
    CamDiagramComponent,
    CamFormComponent,
    NodeComponent,
    NodesContainerComponent,
    ActivityConnectorFormComponent,
    ActivityTableComponent,
    ActivityTreeComponent,
    ActivityTreeTableComponent,
    TripleTableComponent,
    ActivityTreeNodeComponent,
    ActivitySlimTreeComponent,
    ActivitySlimTreeNodeComponent,
    CamPreviewComponent,
    PreviewActivityComponent
  ],
  providers: [
    NoctuaFormDialogService,
    NodeService,
    CamDiagramService,
  ],
  declarations: [
    NoctuaFormComponent,
    ActivityFormComponent,
    EntityFormComponent,
    CamTableComponent,
    AddEvidenceDialogComponent,
    CreateActivityDialogComponent,
    ActivityErrorsDialogComponent,
    CamErrorsDialogComponent,
    BeforeSaveDialogComponent,
    PreviewActivityDialogComponent,
    CreateFromExistingDialogComponent,
    LinkToExistingDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    SearchEvidenceDialogComponent,
    CamDiagramComponent,
    CamFormComponent,
    NodeComponent,
    NodesContainerComponent,
    ActivityConnectorFormComponent,
    TripleTableComponent,
    ActivityTableComponent,

    ActivityTreeTableComponent,
    EvidenceTableComponent,
    GraphPreviewComponent,
    CamPreviewComponent,
    CamGraphComponent,
    ActivityTreeComponent,
    ActivityTreeNodeComponent,
    ActivitySlimTreeComponent,
    ActivitySlimTreeNodeComponent,
    SelectEvidenceComponent,
    PreviewActivityComponent
  ],
})

export class NoctuaFormModule {
}