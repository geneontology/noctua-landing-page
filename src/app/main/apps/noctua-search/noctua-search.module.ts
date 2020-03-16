import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';
import { NoctuaSearchComponent } from './noctua-search.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NoctuaSearchBaseModule } from '@noctua.search';

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
    NoctuaSearchBaseModule,
  ],
  declarations: [
    NoctuaSearchComponent,
    CamsTableComponent
  ]
})

export class NoctuaSearchModule {
}
