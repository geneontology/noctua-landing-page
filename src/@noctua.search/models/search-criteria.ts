import { Cam, Contributor, Group, Organism } from 'noctua-form-base';
import { each } from 'lodash';
import { CamPage } from './cam-page';

export class SearchCriteria {
    camPage: CamPage = new CamPage();
    titles: any[] = [];
    gps: any[] = [];
    terms: any[] = [];
    pmids: any[] = [];
    contributors: Contributor[] = [];
    groups: Group[] = [];
    organisms: Organism[] = [];
    states: any[] = [];
    exactdates: any[] = [];
    startdates: any[] = [];
    enddates: any[] = [];

    constructor() {
    }

    private query() {
        const self = this;
        const query = ['offset=' + (self.camPage.pageNumber * self.camPage.size).toString()];

        query.push('limit=' + self.camPage.size.toString());

        each(self.titles, (title) => {
            query.push(`title=${title}`);
        });

        each(self.terms, (term) => {
            query.push(`term=${term.id}`);
        });

        each(self.groups, (group: Group) => {
            query.push(`group=${group.url}`);
        });

        each(self.contributors, (contributor: Contributor) => {
            query.push(`contributor=${contributor.orcid}`);
        });

        each(self.gps, (gp) => {
            query.push(`gp=${gp.id}`);
        });

        each(self.pmids, (pmid) => {
            query.push(`pmid=${pmid}`);
        });

        each(self.exactdates, (date) => {
            query.push(`exactdate=${date}`);
        });

        each(self.startdates, (date) => {
            query.push(`date=${date}`);
        });

        each(self.enddates, (date) => {
            query.push(`dateend=${date}`);
        });

        each(self.organisms, (organism: Organism) => {
            query.push(`taxon=${organism.taxonIri}`);
        });

        each(self.states, (state: any) => {
            query.push(`state=${state.name}`);
        });

        return query;
    }

    private queryEncoded() {
        const self = this;
        const query = ['offset=' + (self.camPage.pageNumber * self.camPage.size).toString()];

        query.push('limit=' + self.camPage.size.toString());

        each(self.titles, (title) => {
            query.push(`title=${encodeURIComponent(title)}`);
        });

        each(self.terms, (term) => {
            query.push(`term=${encodeURIComponent(term.id)}`);
        });

        each(self.groups, (group: Group) => {
            query.push(`group=${encodeURIComponent(group.url)}`);
        });

        each(self.contributors, (contributor: Contributor) => {
            query.push(`contributor=${encodeURIComponent(contributor.orcid)}`);
        });

        each(self.gps, (gp) => {
            query.push(`gp=${encodeURIComponent(gp.id)}`);
        });

        each(self.pmids, (pmid) => {
            query.push(`pmid=${encodeURIComponent(pmid)}`);
        });

        each(self.exactdates, (date) => {
            query.push(`date=${encodeURIComponent(date)}`);
        });

        each(self.organisms, (organism: Organism) => {
            query.push(`taxon=${encodeURIComponent(organism.taxonIri)}`);
        });

        each(self.states, (state: any) => {
            query.push(`state=${encodeURIComponent(state.name)}`);
        });

        return query;
    }

    build() {
        return this.query().join('&');
    }

    private buildEncoded() {
        return this.queryEncoded().join('&');
    }
}
