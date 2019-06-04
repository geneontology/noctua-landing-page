import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
    Cam,
    Contributor,
    CamService,
    NoctuaUserService,
    NoctuaFormConfigService,
    NoctuaGraphService,
    NoctuaAnnotonFormService,
} from 'noctua-form-base';

import { NoctuaConfigService } from '@noctua/services/config.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'noctua-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class NoctuaToolbarComponent implements OnInit {
    public user: Contributor;
    public cam: Cam;
    userStatusOptions: any[];
    languages: any;
    selectedLanguage: any;
    showLoadingBar: boolean;
    horizontalNav: boolean;
    noNav: boolean;
    navigation: any;

    loginUrl;

    createNewMenu = [{
        label: 'Noctua Form',
        url: environment.workbenchUrl + 'noctua-form?',
    }, {
        label: 'Graph Editor',
        url: environment.noctuaUrl + "/editor/graph/"
    }, {
        label: 'Macromolecular Complex Creator',
        url: environment.workbenchUrl + 'mmcc?'
    }];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private camService: CamService,
        private noctuaConfig: NoctuaConfigService,
        public noctuaUserService: NoctuaUserService,
        public noctuaAnnotonFormService: NoctuaAnnotonFormService,
        //public noctuaFormService: NoctuaFormService,
        private translate: TranslateService
    ) {
        console.log(window.location)
        this.loginUrl = 'http://barista-dev.berkeleybop.org/login?return=' + window.location.origin;

        this.getUserInfo();
        this.router.events.subscribe(
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
        this.camService.onCamChanged.subscribe((cam) => {
            if (!cam) return;

            this.cam = cam
            this.cam.onGraphChanged.subscribe((annotons) => {
            });
        });
    }

    getUserInfo() {
        const self = this;

        this.noctuaUserService.onUserChanged.subscribe((response) => {
            if (response) {
                this.user = new Contributor()
                this.user.name = response.nickname;
                this.user.groups = response.groups;
            }
        });
    }


    search(value): void {
        console.log(value);
    }

    setLanguage(lang) {
        this.selectedLanguage = lang;
        this.translate.use(lang.id);
    }
}
