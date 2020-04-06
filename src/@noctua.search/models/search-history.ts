import { Cam, Contributor, Group, Organism, Entity } from 'noctua-form-base';
import { each, cloneDeep } from 'lodash';
import { CamPage } from './cam-page';
import { SearchCriteria } from './search-criteria';

export class SearchHistory {
    titles: string;
    gps: string;
    terms: string;
    pmids: string;
    contributors: string;
    groups: string;
    organisms: string;
    states: string;
    exactdates: string;
    startdates: string;
    enddates: string;

    name: string
    searchCriteriaString: string;
    //searchCriteriaRe: SearchCriteria,

    constructor(searchCriteria: SearchCriteria) {
        //   this.searchCriteria = cloneDeep(searchCriteria)
        this.save(searchCriteria);
    }


    generateHistorySummary(searchCriteria: SearchCriteria) {
        const self = this;
        const threshold = 5;
        let count = 0;

        if (searchCriteria.contributors && searchCriteria.contributors.length > 0) {
            self.contributors = searchCriteria.contributors.map((contributor: Contributor) => {
                return contributor.name;
            }).join(', ');
            count++;
        }

        if (searchCriteria.groups && searchCriteria.groups.length > 0) {
            self.groups = searchCriteria.groups.map((group: Group) => {
                return group.name;
            }).join(', ');
            count++;
        }
        if (searchCriteria.pmids && searchCriteria.pmids.length > 0) {
            self.pmids = searchCriteria.pmids.join(', ');
            count++;
        }
        if (searchCriteria.terms && searchCriteria.terms.length > 0) {
            self.terms = searchCriteria.terms.map((term: Entity) => {
                return term.label;
            }).join(', ');
            count++;
        }
        if (searchCriteria.gps && searchCriteria.gps.length > 0) {
            self.gps = searchCriteria.gps.map((gp: Entity) => {
                return gp.label;
            }).join(', ');
            count++;
        }
        if (searchCriteria.organisms && searchCriteria.organisms.length > 0) {
            self.organisms = searchCriteria.organisms.map((organism: Organism) => {
                return organism.taxonName;
            }).join(', ');
            count++;
        }
        if (searchCriteria.states && searchCriteria.states.length > 0) {
            self.states = searchCriteria.states.join(', ');
            count++;
        }

        if (searchCriteria.exactdates && searchCriteria.exactdates.length > 0) {
            self.exactdates = searchCriteria.exactdates.join(', ');
            count++;
        }

        if (searchCriteria.startdates && searchCriteria.startdates.length > 0) {
            self.startdates = searchCriteria.startdates.join(', ');
            count++;
        }

        if (searchCriteria.enddates && searchCriteria.enddates.length > 0) {
            self.enddates = searchCriteria.enddates.join(', ');
            count++;
        }

        if (count === 0) {
            self.name = 'Recent Searches'
        }
    }

    save(searchCriteria: SearchCriteria) {
        this.searchCriteriaString = JSON.stringify(searchCriteria, undefined, 2);
        this.generateHistorySummary(searchCriteria)
    }
}
