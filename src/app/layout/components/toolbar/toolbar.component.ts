import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import {
    Cam,
    Contributor,
    CamService,
    NoctuaUserService,
    NoctuaGraphService,
    NoctuaAnnotonFormService,
    AnnotonType,
} from 'noctua-form-base';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Component({
    selector: 'noctua-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class NoctuaToolbarComponent implements OnInit, OnDestroy {
    AnnotonType = AnnotonType;

    public user: Contributor;
    public cam: Cam;
    userStatusOptions: any[];
    showLoadingBar: boolean;
    horizontalNav: boolean;
    noNav: boolean;
    navigation: any;
    loginUrl = '';

    createNewMenu = [{
        label: 'Noctua Form',
        url: environment.workbenchUrl + 'noctua-form?',
    }, {
        label: 'Graph Editor',
        url: environment.noctuaUrl + '/editor/graph/'
    }, {
        label: 'Macromolecular Complex Creator',
        url: environment.workbenchUrl + 'mmcc?'
    }];

    private _unsubscribeAll: Subject<any>;

    constructor(
        private router: Router,
        private camService: CamService,
        private noctuaGraphService: NoctuaGraphService,
        public noctuaUserService: NoctuaUserService,
        public noctuaAnnotonFormService: NoctuaAnnotonFormService
    ) {
        this._unsubscribeAll = new Subject();
        this.loginUrl = 'http://barista-dev.berkeleybop.org/login?return=' + window.location.origin;
        this.getUserInfo();
        this.router.events.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (event) => {
                    if (event instanceof NavigationStart) {
                        this.showLoadingBar = true;
                    }
                    if (event instanceof NavigationEnd) {
                        this.showLoadingBar = false;
                    }
                });

    }

    ngOnInit(): void {
        this.camService.onCamChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((cam) => {
                if (!cam) {
                    return;
                }

                this.cam = cam;
            });
    }

    createModel() {
        this.noctuaGraphService.createModel(this.cam);
    }

    getUserInfo() {
        const self = this;

        self.noctuaUserService.onUserChanged.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                if (response) {
                    self.user = new Contributor()
                    self.user.name = response.nickname;
                    self.user.groups = response.groups;
                }
            });
    }

    search(value): void {
        console.log(value);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
