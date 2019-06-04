import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaReviewComponent } from './noctua-review.component';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { NoctuaFormModule } from './../noctua-form/noctua-form.module'

import { CamService } from 'noctua-form-base';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';

//Search and Browse
import { ReviewFilterComponent } from './search/review-filter/review-filter.component';
import { ReviewSearchComponent } from './search/review-search/review-search.component';
import { ReviewContributorsComponent } from './search/review-contributors/review-contributors.component';
import { ReviewGroupsComponent } from './search/review-groups/review-groups.component';
import { ReviewOrganismsComponent } from './search/review-organisms/review-organisms.component';

const routes = [
  {
    path: '',
    component: NoctuaReviewComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    CommonModule,
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    NoctuaFormModule
  ],
  providers: [
    //NoctuaFormGridService,
    //CamService,
    //NodeService,
    //CamDiagramService,
    //CamTableService,
    //NoctuaAnnotonConnectorService
  ],
  declarations: [
    NoctuaReviewComponent,
    CamsTableComponent,
    ReviewFilterComponent,
    ReviewSearchComponent,
    ReviewContributorsComponent,
    ReviewGroupsComponent,
    ReviewOrganismsComponent
  ]
  /*
  entryComponents: [
    NoctuaFormComponent,
    CamRowEditDialogComponent,
    AddEvidenceDialogComponent,
    AnnotonErrorsDialogComponent,
    BeforeSaveDialogComponent,
    CreateFromExistingDialogComponent,
    LinkToExistingDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    NodeComponent,
    NodesContainerComponent
  ]*/
})

export class NoctuaReviewModule {
}
