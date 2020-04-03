import { NgModule } from '@angular/core';

import { NoctuaSharedModule } from '@noctua/shared.module';
import { QuickPanelComponent } from './quick-panel.component';


@NgModule({
    declarations: [
        QuickPanelComponent
    ],
    imports: [
        MatDividerModule,
        MatListModule,
        MatSlideToggleModule,

        NoctuaSharedModule,
    ],
    exports: [
        QuickPanelComponent
    ]
})
export class QuickPanelModule {
}
