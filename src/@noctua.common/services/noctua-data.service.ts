import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { NoctuaUserService, Contributor, Group, Organism } from 'noctua-form-base';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { differenceWith, sortBy } from 'lodash';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class NoctuaDataService {
  baristaUrl = environment.globalBaristaLocation;
  speciesApi = environment.speciesListApi;
  onContributorsChanged: BehaviorSubject<any>;
  onGroupsChanged: BehaviorSubject<any>;
  onOrganismsChanged: BehaviorSubject<any>;

  constructor(
    private httpClient: HttpClient,
    private sparqlService: SparqlService) {
    this.onContributorsChanged = new BehaviorSubject([]);
    this.onGroupsChanged = new BehaviorSubject([]);
    this.onOrganismsChanged = new BehaviorSubject([]);

    // this._getUsersDifference();
  }

  getUsers(): Observable<any> {
    const self = this;

    return this.httpClient.get(`${self.baristaUrl}/users`);
  }

  getUserInfo(uri: string): Observable<any> {
    const self = this;

    const encodedUrl = encodeURIComponent(uri);
    return this.httpClient.get(`${self.baristaUrl}/user_info_by_id/${encodedUrl}`);
  }

  getGroups(): Observable<any> {
    const self = this;

    return this.httpClient.get(`${self.baristaUrl}/groups`);
  }

  getOrganisms(): Observable<any> {
    const self = this;

    // return this.httpClient.get(`${self.speciesApi}`);
    const tempOrganisms = { 'taxa': [{ 'id': 'NCBITaxon:8364', 'label': 'Xenopus tropicalis' }, { 'id': 'NCBITaxon:7955', 'label': 'Danio rerio' }, { 'id': 'NCBITaxon:10090', 'label': 'Mus musculus' }, { 'id': 'NCBITaxon:8355', 'label': 'Xenopus laevis' }, { 'id': 'NCBITaxon:6239', 'label': 'Caenorhabditis elegans' }, { 'id': 'NCBITaxon:7227', 'label': 'Drosophila melanogaster' }, { 'id': 'NCBITaxon:44689', 'label': 'Dictyostelium discoideum' }, { 'id': 'NCBITaxon:3702', 'label': 'Arabidopsis thaliana' }, { 'id': 'NCBITaxon:9606', 'label': 'Homo sapiens' }, { 'id': 'NCBITaxon:4896', 'label': 'Schizosaccharomyces pombe' }, { 'id': 'NCBITaxon:10116', 'label': 'Rattus norvegicus' }, { 'id': 'NCBITaxon:559292', 'label': 'Saccharomyces cerevisiae S288C' }, { 'id': 'NCBITaxon:9823', 'label': 'Sus scrofa' }] };

    // temp
    return of(tempOrganisms).pipe(
      map(res => res['taxa'])
    );
  }


  loadContributors() {
    this.getUsers()
      .subscribe((response) => {
        if (!response) {
          return;
        }
        const contributors = response.map((item) => {
          const contributor = new Contributor();
          contributor.name = item.nickname;
          contributor.orcid = item.uri;
          contributor.group = item.group;
          return contributor;
        });

        this.onContributorsChanged.next(contributors);
      });
  }

  loadGroups() {
    this.getGroups()
      .subscribe((response) => {
        if (!response) {
          return;
        }

        const groups = response.map((item) => {
          const group: any = {
            name: item.label,
            url: item.id
          }
          return group;
        });

        this.onGroupsChanged.next(groups);
      });
  }

  loadOrganisms() {
    this.getOrganisms()
      .subscribe((response: any) => {
        if (!response) {
          return;
        }

        const organisms = response.map((item) => {
          const organism: Organism = {
            taxonName: item.label,
            taxonIri: item.id
          };

          return organism;
        });
        this.onOrganismsChanged.next(organisms);
      });
  }

  // for checking
  private _getUsersDifference() {
    this.onContributorsChanged
      .subscribe((baristaUsers) => {
        this.sparqlService.getAllContributors().subscribe((sparqlUsers) => {
          const diff = differenceWith(sparqlUsers, baristaUsers, (sparqlUser: any, baristaUser: any) => {
            return sparqlUser.orcid === baristaUser.orcid;
          });

          const diffSorted = sortBy(diff, 'name').map((user) => {
            return {
              orcid: user.orcid,
              name: user.name
            };
          });

          console.log(JSON.stringify(diffSorted, undefined, 2));
        });
      });
  }
}
