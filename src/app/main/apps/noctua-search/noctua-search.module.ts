import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';
import { NoctuaSearchComponent } from './noctua-search.component';
import { NoctuaSearchBaseModule } from '@noctua.search/noctua-search.module';

const routes = [
  {
    path: '',
    component: NoctuaSearchComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    CommonModule,
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    NoctuaSearchBaseModule
  ],
  declarations: [
    NoctuaSearchComponent,
    CamsTableComponent
  ]
})

export class NoctuaSearchModule {
}
