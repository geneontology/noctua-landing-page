import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FormGroup } from '@angular/forms'

import { NoctuaFormConfigService } from './../services/config/noctua-form-config.service';
import { Contributor } from '../models/contributor';
import { Group } from '../models/group';


@Injectable({
  providedIn: 'root'
})
export class NoctuaUserService {
  baristaToken;
  baristaUrl = environment.globalBaristaLocation;
  onUserChanged: BehaviorSubject<any>;
  user: Contributor;
  contributors: Contributor[] = [];
  groups: Group[] = [];

  constructor(public noctuaFormConfigService: NoctuaFormConfigService,
    private httpClient: HttpClient, ) {
    this.onUserChanged = new BehaviorSubject(null);
  }

  getUser(): Observable<any> {
    const self = this;

    return this.httpClient.get(`${self.baristaUrl}/user_info_by_token/${self.baristaToken}`);
  }

  filterContributors(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.contributors.filter((contributor: Contributor) => contributor.name.toLowerCase().indexOf(filterValue) === 0);
  }

  filterGroups(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.groups.filter((group: Group) => group.name.toLowerCase().indexOf(filterValue) === 0);
  }
}
