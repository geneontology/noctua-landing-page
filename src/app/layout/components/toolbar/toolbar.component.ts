import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';

import {
    Cam,
    Contributor,
    CamService,
    NoctuaUserService,
    NoctuaFormConfigService,
    NoctuaGraphService,
    NoctuaAnnotonFormService,
    AnnotonType,
} from 'noctua-form-base';

import { NoctuaConfigService } from '@noctua/services/config.service';
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
    noctuaLandingPageUrl = '';
    loginUrl = '';
    logoutUrl = '';
    noctuaUrl = '';

    private _unsubscribeAll: Subject<any>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private camService: CamService,
        private noctuaGraphService: NoctuaGraphService,
        public noctuaUserService: NoctuaUserService,
        public noctuaAnnotonFormService: NoctuaAnnotonFormService
    ) {
        const self = this;
        this._unsubscribeAll = new Subject();
        this.getUserInfo();

        this.route
            .queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                const baristaToken = params['barista_token'] || null;
                const noctuaLandingPageReturnUrl = `${environment.workbenchUrl}noctua-landing-page`;
                const baristaParams = { 'barista_token': baristaToken };
                const returnUrlParams = { 'return': noctuaLandingPageReturnUrl };

                this.loginUrl = environment.globalBaristaLocation + '/login?' +
                    self._parameterize(Object.assign({}, returnUrlParams));
                this.logoutUrl = environment.globalBaristaLocation + '/logout?' +
                    self._parameterize(Object.assign({}, baristaParams, returnUrlParams));
                this.noctuaUrl = environment.noctuaUrl + '?' + (baristaToken ? self._parameterize(Object.assign({}, baristaParams)) : '');
                this.noctuaLandingPageUrl = environment.workbenchUrl + 'noctua-landing-page?'
                    + (baristaToken ? self._parameterize(Object.assign({}, baristaParams)) : '');
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

    createModel() {
        this.noctuaGraphService.createModel(this.cam);
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



    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private _parameterize = (params) => {
        return Object.keys(params).map(key => key + '=' + params[key]).join('&');
    }
}
