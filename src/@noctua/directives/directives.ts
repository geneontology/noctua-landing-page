import { NgModule } from '@angular/core';

import { NoctuaPerfectScrollbarDirective } from './noctua-perfect-scrollbar/noctua-perfect-scrollbar.directive';
import { StylePaginatorDirective } from './noctua-paginator/noctua-paginator.directive';

@NgModule({
    declarations: [
        NoctuaPerfectScrollbarDirective,
        StylePaginatorDirective
    ],
    imports: [],
    exports: [
        NoctuaPerfectScrollbarDirective,
        StylePaginatorDirective
    ]
})
export class NoctuaDirectivesModule {
}
