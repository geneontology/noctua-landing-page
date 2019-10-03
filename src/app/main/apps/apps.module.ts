import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaSearchModule } from './noctua-search/noctua-search.module';


@NgModule({
  declarations: [],
  imports: [
    TranslateModule,
    NoctuaSharedModule,
    NoctuaSearchModule
  ],
  exports: [
    NoctuaSearchModule
  ],
  providers: [

  ]

})

export class AppsModule {
}
