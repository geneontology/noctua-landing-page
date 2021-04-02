import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';
import { NoctuaSearchComponent } from './noctua-search.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NoctuaSearchBaseModule } from '@noctua.search';
import { NoctuaFooterModule } from 'app/layout/components/footer/footer.module';
import { NoctuaFormModule } from '../noctua-form';
import { CamsReviewComponent } from './cams/cams-review/cams-review.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CamDetailComponent } from './cams/cam-detail/cam-detail.component';
import { CamsReviewChangesComponent } from './cams/cams-review-changes/cams-review-changes.component';

const routes = [
  {
    path: '',
    component: NoctuaSearchComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    ScrollingModule,
    CommonModule,
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    NoctuaSearchBaseModule,
    NoctuaFooterModule,
    NoctuaFormModule,
  ],
  declarations: [
    NoctuaSearchComponent,
    CamsTableComponent,
    CamsReviewComponent,
    CamDetailComponent,
    CamsReviewChangesComponent
  ]
})

export class NoctuaSearchModule {
}
