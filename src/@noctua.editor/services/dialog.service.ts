
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';


import 'rxjs/add/operator/map';
import { NoctuaConfirmDialogComponent } from '@noctua/components/confirm-dialog/confirm-dialog.component';
import { AnnotonEditorDialogComponent } from './../dialogs/annoton-editor/annoton-editor.component';

@Injectable({
    providedIn: 'root'
})
export class NoctuaEditorDialogService {

    dialogRef: any;

    constructor(private httpClient: HttpClient,
        private snackBar: MatSnackBar,
        private _matDialog: MatDialog) {
    }

    openSuccessfulSaveToast(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 10000,
            verticalPosition: 'top'
        });
    }

    openConfirmDialog(searchCriteria, success): void {
        this.dialogRef = this._matDialog.open(NoctuaConfirmDialogComponent, {
            panelClass: 'noc-search-database-dialog',
            data: {
                searchCriteria: searchCriteria
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    openAnnotonEditor(data: any): void {
        this.dialogRef = this._matDialog.open(AnnotonEditorDialogComponent, {
            panelClass: 'cam-row-edit-dialog',
            data: data
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {

            });
    }

}
