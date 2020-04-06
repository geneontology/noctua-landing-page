import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, finalize } from 'rxjs/operators';

import {
    Cam,
    Contributor,
    Group,
    Organism,
    NoctuaFormConfigService,
    NoctuaUserService,
    Entity,
} from 'noctua-form-base';
import { SearchCriteria } from './../models/search-criteria';
import { saveAs } from 'file-saver';
import { forOwn, each } from 'lodash';
import { CurieService } from '@noctua.curie/services/curie.service';
import { CamPage } from './../models/cam-page';
import { SearchHistory } from './../models/search-history';

declare const require: any;

const amigo = require('amigo2');

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchService {
    linker = new amigo.linker();

    searchHistory: SearchHistory[] = [];

    onContributorsChanged: BehaviorSubject<any>;
    onGroupsChanged: BehaviorSubject<any>;
    onOrganismsChanged: BehaviorSubject<any>;
    contributors: Contributor[] = [];
    groups: Group[] = [];
    organisms: Organism[] = [];
    states: any[] = [];

    onSearchCriteriaChanged: BehaviorSubject<any>;
    onSearchHistoryChanged: BehaviorSubject<any>;
    baseUrl = environment.spaqrlApiUrl;
    curieUtil: any;
    cams: any[] = [];
    camPage: CamPage;
    searchCriteria: SearchCriteria;
    baristaApi = environment.globalBaristaLocation;
    separator = '@@';
    loading = false;
    onCamsChanged: BehaviorSubject<any>;
    onCamsPageChanged: BehaviorSubject<any>;
    onCamChanged: BehaviorSubject<any>;
    onContributorFilterChanged: BehaviorSubject<any>;
    searchSummary: any = {};

    filterType = {
        titles: 'titles',
        gps: 'gps',
        terms: 'terms',
        pmids: 'pmids',
        contributors: 'contributors',
        groups: 'groups',
        organisms: 'organisms',
        states: 'states',
        exactdates: 'exactdates',
        startdates: 'startdates',
        enddates: 'enddates',
    };

    constructor(private httpClient: HttpClient,
        public noctuaFormConfigService: NoctuaFormConfigService,
        public noctuaUserService: NoctuaUserService,
        private curieService: CurieService) {
        this.onContributorsChanged = new BehaviorSubject([]);
        this.onGroupsChanged = new BehaviorSubject([]);
        this.onOrganismsChanged = new BehaviorSubject([]);
        this.onCamsChanged = new BehaviorSubject([]);
        this.onCamsPageChanged = new BehaviorSubject(null);
        this.onCamChanged = new BehaviorSubject([]);
        this.onSearchHistoryChanged = new BehaviorSubject(null);

        this.states = this.noctuaFormConfigService.modelState.options;
        this.searchCriteria = new SearchCriteria();
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.curieUtil = this.curieService.getCurieUtil();

        this.onSearchCriteriaChanged.subscribe((searchCriteria: SearchCriteria) => {
            if (!searchCriteria) {
                return;
            }

            this.getCams(searchCriteria).subscribe((response: any) => {
                this.cams = response;
                this.onCamsChanged.next(this.cams);
            });

            this.getCamsCount(searchCriteria).subscribe((response: any) => {
                this.camPage = new CamPage();
                this.camPage.total = response.n;
                this.onCamsPageChanged.next(this.camPage);
            });

            const element = document.querySelector('#noc-results');
            element.scrollTop = 0;
        });
    }

    search(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        searchCriteria.title ? this.searchCriteria.titles.push('*' + searchCriteria.title + '*') : null;
        searchCriteria.contributor ? this.searchCriteria.contributors.push(searchCriteria.contributor) : null;
        searchCriteria.group ? this.searchCriteria.groups.push(searchCriteria.group) : null;
        searchCriteria.pmid ? this.searchCriteria.pmids.push(searchCriteria.pmid) : null;
        searchCriteria.term ? this.searchCriteria.terms.push(searchCriteria.term) : null;
        searchCriteria.gp ? this.searchCriteria.gps.push(searchCriteria.gp) : null;
        searchCriteria.organism ? this.searchCriteria.organisms.push(searchCriteria.organism) : null;
        searchCriteria.state ? this.searchCriteria.states.push(searchCriteria.state) : null;
        searchCriteria.exactdate ? this.searchCriteria.exactdates.push(searchCriteria.exactdate) : null;
        searchCriteria.startdate ? this.searchCriteria.exactdates.push(searchCriteria.startdate) : null;
        searchCriteria.enddate ? this.searchCriteria.exactdates.push(searchCriteria.enddate) : null;

        this.updateSearch();

    }

    getPage(pageNumber: number) {
        this.searchCriteria.camPage.pageNumber = pageNumber;
        this.updateSearch();
    }

    paramsToSearch(param) {
        this.searchCriteria = new SearchCriteria();

        param.title ? this.searchCriteria.titles.push(param.title) : null;
        param.contributor ? this.searchCriteria.contributors.push(param.contributor) : null;
        param.group ? this.searchCriteria.groups.push(param.group) : null;
        param.pmid ? this.searchCriteria.pmids.push(param.pmid) : null;
        param.term ? this.searchCriteria.terms.push(
            new Entity(param.term, '')) : null;
        param.gp ? this.searchCriteria.gps.push(
            new Entity(param.gp, '')) : null;
        param.organism ? this.searchCriteria.organisms.push(param.organism) : null;
        param.state ? this.searchCriteria.states.push(param.state) : null;
        param.exactdate ? this.searchCriteria.exactdates.push(param.exactdate) : null;
        param.startdate ? this.searchCriteria.exactdates.push(param.startdate) : null;
        param.enddate ? this.searchCriteria.exactdates.push(param.enddate) : null;

        this.updateSearch();
    }

    updateSearch(save: boolean = true) {
        this.onSearchCriteriaChanged.next(this.searchCriteria);

        if (save) {
            this.saveHistory();
        }
    }

    filter(filterType, filter) {
        this.searchCriteria[filterType].push(filter);
        this.updateSearch();
    }

    removeFilterType(filterType: string) {
        this.searchCriteria[filterType] = [];
        this.updateSearch();
    }

    removeFilter(filterType) {
        this.searchCriteria[filterType] = null;
    }

    clearSearchCriteria() {
        this.searchCriteria = new SearchCriteria();
        this.updateSearch();
    }

    saveHistory() {
        const searchHistoryItem = new SearchHistory(this.searchCriteria);
        this.searchHistory.unshift(searchHistoryItem);

        this.onSearchHistoryChanged.next(this.searchHistory);
    }

    downloadSearchConfig() {
        const blob = new Blob([JSON.stringify(this.searchCriteria, undefined, 2)], { type: 'application/json' });
        saveAs(blob, 'search-filter.json');
    }

    uploadSearchConfig(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        if (searchCriteria.titles) {
            this.searchCriteria.titles = searchCriteria.titles;
        }
        if (searchCriteria.contributors) {
            this.searchCriteria.contributors = searchCriteria.contributors;
        }
        if (searchCriteria.groups) {
            this.searchCriteria.groups = searchCriteria.groups;
        }
        if (searchCriteria.pmids) {
            this.searchCriteria.pmids = searchCriteria.pmids;
        }
        if (searchCriteria.terms) {
            this.searchCriteria.terms = searchCriteria.terms;
        }
        if (searchCriteria.gps) {
            this.searchCriteria.gps = searchCriteria.gps;
        }
        if (searchCriteria.organisms) {
            this.searchCriteria.organisms = searchCriteria.organisms;
        }
        if (searchCriteria.states) {
            this.searchCriteria.states = searchCriteria.states;
        }
        if (searchCriteria.exactdates) {
            this.searchCriteria.exactdates = searchCriteria.exactdates;
        }
        if (searchCriteria.startdates) {
            this.searchCriteria.startdates = searchCriteria.startdates;
        }
        if (searchCriteria.enddates) {
            this.searchCriteria.enddates = searchCriteria.enddates;
        }

        this.updateSearch();
    }

    getCams(searchCriteria: SearchCriteria): Observable<any> {
        const self = this;
        const query = searchCriteria.build();
        const url = `${this.baristaApi}/search?${query}`;

        self.loading = true;

        return this.httpClient
            .get(url)
            .pipe(
                map(res => this.addCam(res)),
                finalize(() => {
                    self.loading = false;
                })
            );
    }

    getCamsCount(searchCriteria: SearchCriteria): Observable<any> {
        const self = this;
        const query = searchCriteria.build();
        const url = `${this.baristaApi}/search?${query}&count`;

        return this.httpClient
            .get(url)
            .pipe();
    }

    addCam(res) {
        const self = this;
        const result: Array<Cam> = [];

        res.models.forEach((response) => {
            const modelId = response.id;
            const cam = new Cam();

            cam.graph = null;
            cam.id = modelId;
            cam.state = self.noctuaFormConfigService.findModelState(response.state);
            cam.title = response.title;
            cam.date = response.date;

            cam.model = Object.assign({}, {
                modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
            });

            cam.groups = <Group[]>response.groups.map(function (url) {
                const group = _.find(self.noctuaUserService.groups, (group: Group) => {
                    return group.url === url;
                });

                return group ? group : { url: url };
            });

            cam.contributors = <Contributor[]>response.contributors.map((orcid) => {
                const contributor = _.find(self.noctuaUserService.contributors, (contributor: Contributor) => {
                    return contributor.orcid === orcid;
                });

                return contributor ? contributor : { orcid: orcid };
            });

            forOwn(response.query_match, (individuals) => {
                cam.filter.uuids.push(...individuals.map((iri) => {
                    return self.curieUtil.getCurie(iri);
                }));
            });

            cam.configureDisplayType();
            result.push(cam);
        });

        return result;
    }

    addCamTerms(res) {
        const self = this;
        const result: Array<Entity> = [];

        res.forEach((response) => {
            const term = new Entity(
                self.curieUtil.getCurie(response.id.value),
                response.label.value
            );

            result.push(term);
        });

        return result;
    }

    public groupContributors() {
        return _.groupBy(this.contributors, function (contributor) {
            return contributor.group;
        });

    }

    public filterOrganisms(value: string): any[] {
        const filterValue = value.toLowerCase();

        return this.organisms.filter(organism => organism.taxonName.toLowerCase().indexOf(filterValue) === 0);
    }

    public filterStates(value: string): any[] {
        const filterValue = value.toLowerCase();

        return this.states.filter(state => state.name.toLowerCase().indexOf(filterValue) === 0);
    }


}
