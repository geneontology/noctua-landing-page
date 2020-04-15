import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';

import {
    Cam,
    Contributor,
    CamService,
    NoctuaUserService,
    NoctuaAnnotonFormService,
    AnnotonType,
} from 'noctua-form-base';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';

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
    noctuaFormUrl = '';
    loginUrl = '';
    logoutUrl = '';
    noctuaUrl = '';

    private _unsubscribeAll: Subject<any>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private camService: CamService,
        private noctuaCommonMenuService: NoctuaCommonMenuService,
        public noctuaUserService: NoctuaUserService,
        public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    ) {
        const self = this;
        this._unsubscribeAll = new Subject();
        this.getUserInfo();

        this.route
            .queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                const baristaToken = params['barista_token'] || null;
                const modelId = params['model_id'] || null;
                const returnUrl = `${environment.workbenchUrl}noctua-landing-page/?model_id=${modelId}`;
                const baristaParams = { 'barista_token': baristaToken };
                const modelIdParams = { 'model_id': modelId };
                const returnUrlParams = { 'return': returnUrl };

                this.loginUrl = environment.globalBaristaLocation + '/login?' +
                    self._parameterize(Object.assign({}, returnUrlParams));
                this.logoutUrl = environment.globalBaristaLocation + '/logout?' +
                    self._parameterize(Object.assign({}, baristaParams, returnUrlParams));
                this.noctuaUrl = environment.noctuaUrl + '?' + (baristaToken ? self._parameterize(Object.assign({}, baristaParams)) : '');
                this.noctuaFormUrl = environment.workbenchUrl + 'noctua-landing-page?'
                    + (baristaToken ? self._parameterize(Object.assign({}, modelIdParams, baristaParams)) : '');
            });

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

    getUserInfo() {
        const self = this;

        self.noctuaUserService.onUserChanged.pipe(
            takeUntil(this._unsubscribeAll))
            .subscribe((user: Contributor) => {
                if (user) {
                    self.user = user;
                }
            });
    }

    openApps() {
        this.noctuaCommonMenuService.openLeftSidenav();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private _parameterize = (params) => {
        return Object.keys(params).map(key => key + '=' + params[key]).join('&');
    }
}
