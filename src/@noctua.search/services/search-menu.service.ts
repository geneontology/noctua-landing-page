import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NoctuaGraphService } from 'noctua-form-base';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchMenuService {
    private _newModelBbopManager = this._noctuaGraphService.registerManager();;
    leftPanel = {
        search: {
            id: 1
        }, filter: {
            id: 2
        }, relation: {
            id: 3
        }, group: {
            id: 4
        }, contributor: {
            id: 5
        }, organism: {
            id: 6
        },
        history: {
            id: 7
        }
    };

    selectedLeftPanel;

    private leftDrawer: MatDrawer;
    private rightDrawer: MatDrawer;

    constructor(private _noctuaGraphService: NoctuaGraphService) {
        const self = this;
        this.selectedLeftPanel = this.leftPanel.filter;

        this._newModelBbopManager.register('rebuild', function (resp) { }, 10);
    }

    createModel(type: 'graph-editor' | 'noctua-form') {
        const self = this;
        this._newModelBbopManager.add_model().then((resp) => {
            const modelId = resp.data().id;
            let params = new HttpParams();
            params = params.append('model_id', modelId);
            params = params.append('barista_token', self._newModelBbopManager.user_token());
            const paramsString = params.toString();

            const graphEditorUrl = environment.noctuaUrl + '/editor/graph/' + modelId + '?' + paramsString;
            const noctuaFormUrl = environment.workbenchUrl + 'noctua-form?' + paramsString;

            if (type === 'graph-editor') {
                window.open(graphEditorUrl, '_blank');
            } else if (type === 'noctua-form') {
                window.open(noctuaFormUrl, '_blank');
            }
        });
    }

    selectLeftPanel(panel) {
        this.selectedLeftPanel = panel;
    }

    public setLeftDrawer(leftDrawer: MatDrawer) {
        this.leftDrawer = leftDrawer;
    }

    public openLeftDrawer() {
        return this.leftDrawer.open();
    }

    public closeLeftDrawer() {
        return this.leftDrawer.close();
    }

    public toggleLeftDrawer(panel) {
        if (this.selectedLeftPanel.id === panel.id) {
            this.leftDrawer.toggle();
        } else {
            this.selectLeftPanel(panel)
            return this.openLeftDrawer();
        }
    }

    public setRightDrawer(rightDrawer: MatDrawer) {
        this.rightDrawer = rightDrawer;
    }

    public openRightDrawer() {
        return this.rightDrawer.open();
    }

    public closeRightDrawer() {
        return this.rightDrawer.close();
    }
}
