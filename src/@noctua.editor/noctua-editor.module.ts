import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaReferenceDropdownComponent } from './inline-reference/reference-dropdown/reference-dropdown.component';

@NgModule({
    declarations: [
        NoctuaReferenceDropdownComponent,
    ],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        NoctuaSharedModule
    ],
    exports: [
        NoctuaReferenceDropdownComponent,
    ],
    entryComponents: [
        NoctuaReferenceDropdownComponent,
    ]
})
export class NoctuaEditorModule {
}
