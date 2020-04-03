import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaToolbarComponent } from './toolbar.component';

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
    ],
    providers: [
    ],
    exports: [
        NoctuaToolbarComponent
    ]
})

export class NoctuaToolbarModule {
}
