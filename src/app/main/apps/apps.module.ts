import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaReviewModule } from './noctua-review/noctua-review.module'


@NgModule({
  declarations: [],
  imports: [
    TranslateModule,
    NoctuaSharedModule,
    NoctuaReviewModule
  ],
  exports: [
    NoctuaReviewModule
  ],
  providers: [

  ]

})

export class AppsModule {
}
