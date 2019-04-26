import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaReviewComponent } from './noctua-review.component';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';

import { CamService } from 'noctua-form-base';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';


import { ReviewSearchComponent } from './search/review-search/review-search.component';
import { ReviewCuratorsComponent } from './search/review-curators/review-curators.component';
import { ReviewSpeciesComponent } from './search/review-species/review-species.component';

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
    ReviewSearchComponent,
    ReviewCuratorsComponent,
    ReviewSpeciesComponent
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
