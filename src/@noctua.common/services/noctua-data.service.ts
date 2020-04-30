import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { NoctuaUserService, Contributor, Group, Organism, compareOrganism, compareGroup, compareContributor } from 'noctua-form-base';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { differenceWith, sortBy } from 'lodash';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class NoctuaDataService {
  baristaUrl = environment.globalBaristaLocation;
  searchApi = environment.searchApi;
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

    return this.httpClient.get(`${self.searchApi}/taxa`).pipe(
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

        this.onContributorsChanged.next(contributors.sort(compareContributor));
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

        this.onGroupsChanged.next(groups.sort(compareGroup));
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

        this.onOrganismsChanged.next(organisms.sort(compareOrganism));
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
