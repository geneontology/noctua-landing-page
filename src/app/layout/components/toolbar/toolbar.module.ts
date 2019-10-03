import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule, MatToolbarModule } from '@angular/material';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaToolbarComponent } from './toolbar.component';
import { NoctuaSearchBaseModule } from '@noctua.search';

import {
    NoctuaUserService
} from 'noctua-form-base';

@NgModule({
    declarations: [
        NoctuaToolbarComponent
    ],
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatToolbarModule,
        NoctuaSharedModule,
        NoctuaSearchBaseModule
    ],
    providers: [
    ],
    exports: [
        NoctuaToolbarComponent
    ]
})

export class NoctuaToolbarModule {
}
