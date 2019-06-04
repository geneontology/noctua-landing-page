import { environment } from './../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, finalize, filter, reduce, catchError, retry, tap } from 'rxjs/operators';
import {
  Graph,
  Optional,
  optional,
  Prefix,
  prefix,
  Triple,
  Query,
  triple,
} from "sparql-query-builder/dist";

import {
  NoctuaQuery
} from "noctua-sparql-query-builder/dist";

import { CurieService } from './../../../@noctua.curie/services/curie.service';
import {
  NoctuaGraphService,
  AnnotonNode,
  NoctuaFormConfigService,
  Cam,
  CamRow,
  Contributor,
  Group,
  NoctuaUserService,
  Organism
} from 'noctua-form-base'

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { SearchCriteria } from '@noctua.search/models/search-criteria';
declare const require: any;
const each = require('lodash/forEach');

@Injectable({
  providedIn: 'root'
})
export class SparqlService {
  separator = '@@';
  baseUrl = environment.spaqrlApiUrl;
  curieUtil: any;
  cams: any[] = [];
  loading: boolean = false;
  onCamsChanged: BehaviorSubject<any>;
  onCamChanged: BehaviorSubject<any>;
  onContributorFilterChanged: BehaviorSubject<any>;

  searchSummary: any = {}

  constructor(public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaUserService: NoctuaUserService,
    private httpClient: HttpClient,
    private noctuaGraphService: NoctuaGraphService,
    private curieService: CurieService) {
    this.onCamsChanged = new BehaviorSubject({});
    this.onCamChanged = new BehaviorSubject({});
    this.curieUtil = this.curieService.getCurieUtil();
  }

  getCams(searchCriteria): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsQuery(searchCriteria))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        finalize(() => {
          self.loading = false;
        })
      );
  }


  getAllContributors(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildAllContributorsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addContributor(res)),
        tap(val => console.dir(val))
      );
  }

  getAllOrganisms(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildOrganismsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addOrganism(res)),
        tap(val => console.dir(val))
      );
  }

  getAllGroups(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildAllGroupsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addGroup(res)),
        tap(val => console.dir(val))
      );
  }

  addCam(res) {
    const self = this;
    let result: Array<Cam> = [];

    res.forEach((response) => {
      let modelId = self.curieUtil.getCurie(response.model.value)//this.noctuaFormConfigService.getModelId(response.model.value);
      let cam = new Cam();

      cam.id = uuid();
      cam.graph = null;
      cam.id = modelId;
      cam.state = self.noctuaFormConfigService.findModelState(response.modelState.value);
      cam.title = response.modelTitle.value;
      cam.model = Object.assign({}, {
        modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
      });

      if (response.date) {
        cam.date = response.date.value
      }

      if (response.groups) {
        cam.groups = <Group[]>response.groups.value.split(self.separator).map(function (url) {
          return { url: url };
        });
      }

      if (response.contributors) {
        cam.contributors = <Contributor[]>response.contributors.value.split(self.separator).map((orcid) => {
          let contributor = _.find(self.noctuaUserService.contributors, (contributor) => {
            return contributor.orcid === orcid
          })

          return contributor ? contributor : { orcid: orcid };
        });
      }

      if (response.entities) {
        cam.filter.individualIds.push(...response.entities.value.split(self.separator).map((iri) => {
          return self.curieUtil.getCurie(iri);
        }));

      } else {
        cam.resetFilter();
      }

      result.push(cam);
    });

    return result;
  }

  addContributor(res) {
    let result: Array<Contributor> = [];

    res.forEach((erg) => {
      let contributor = new Contributor();

      contributor.orcid = erg.orcid.value;
      contributor.name = erg.name.value;
      contributor.cams = erg.cams.value;
      contributor.group = {
        url: erg.affiliations.value
      }
      result.push(contributor);
    });
    return result;
  }

  addGroup(res) {
    let result: Array<Group> = [];

    res.forEach((erg) => {
      result.push({
        url: erg.url.value,
        name: erg.name.value,
        cams: erg.cams.value,
        contributorsCount: erg.contributors.value,
        contributors: erg.orcids.value.split('@@').map(function (orcid) {
          return { orcid: orcid };
        }),
      });
    });
    return result;
  }

  addOrganism(res) {
    let result: Array<Organism> = [];

    res.forEach((erg) => {
      let organism = new Organism()

      organism.taxonIri = erg.taxonIri.value;
      organism.taxonName = erg.taxonName.value;
      organism.cams = erg.cams.value;
      result.push(organism);
    });
    return result;
  }

  addGroupContributors(groups, contributors) {
    const self = this;

    each(groups, (group) => {
      each(group.contributors, (contributor) => {
        let srcContributor = _.find(contributors, { orcid: contributor.orcid })
        contributor.name = srcContributor['name'];
        contributor.cams = srcContributor['cams'];
      });
    })
  }

  addBasicCamChildren(srcCam, annotons) {
    const self = this;

    srcCam.camRow = [];

    _.each(annotons, function (annoton) {
      let cam = self.annotonToCam(srcCam, annoton);

      cam.model = srcCam.model;
      cam.graph = srcCam.graph;
      srcCam.camRow.push(cam);
    });

    this.onCamsChanged.next(srcCam.camRow);
  }

  addCamChildren(srcCam, annotons) {
    const self = this;

    srcCam.camRow = [];

    _.each(annotons, function (annoton) {
      let cam = self.annotonToCam(srcCam, annoton);

      cam.model = srcCam.model;
      cam.graph = srcCam.graph;
      srcCam.camRow.push(cam);
    });

    this.onCamsChanged.next(srcCam.camRow);
  }

  annotonToCam(cam, annoton) {

    let destNode = new AnnotonNode()
    destNode.deepCopyValues(annoton.node);

    let result: CamRow = {
      // id: uuid(),
      treeLevel: annoton.treeLevel,
      // model: cam.model,
      annotatedEntity: {
        id: '',
        label: annoton.gp
      },
      relationship: annoton.relationship,
      aspect: annoton.aspect,
      term: annoton.term,
      relationshipExt: annoton.relationshipExt,
      extension: annoton.extension,
      evidence: annoton.evidence,
      reference: annoton.reference,
      with: annoton.with,
      assignedBy: annoton.assignedBy,
      srcNode: annoton.node,
      destNode: destNode
    }

    return result;
  }

  buildCamsQuery(searchCriteria: SearchCriteria) {
    let query = new NoctuaQuery();

    each(searchCriteria.goterms, (goterm) => {
      query.goterm(goterm.id)
    });

    each(searchCriteria.groups, (group: Group) => {
      query.group(this.getXSD(group.url));
    });

    each(searchCriteria.contributors, (contributor: Contributor) => {
      query.contributor(this.getXSD(contributor.orcid));
    });

    each(searchCriteria.gps, (gp) => {
      query.gp(this.curieUtil.getIri(gp.id));
    });

    each(searchCriteria.pmids, (pmid) => {
      query.pmid(pmid);
    });

    each(searchCriteria.organisms, (organism: Organism) => {
      query.taxon(organism.taxonIri);
    });

    each(searchCriteria.states, (state: any) => {
      query.state(this.getXSD(state.name));
    });

    query.limit(50);

    return '?query=' + encodeURIComponent(query.build());
  }

  buildAllContributorsQuery() {
    let query = new Query();

    query.prefix(
      prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
      prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
      prefix('metago', '<http://model.geneontology.org/>'),
      prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'))
      .select(
        '?orcid ?name',
        '(GROUP_CONCAT(distinct ?organization;separator="@@") AS ?organizations)',
        '(GROUP_CONCAT(distinct ?affiliation;separator="@@") AS ?affiliations)',
        '(COUNT(distinct ?cam) AS ?cams)'
      )
      .where(
        triple('?cam', 'metago:graphType', 'metago:noctuaCam'),
        triple('?cam', 'dc:contributor', '?orcid'),
        'BIND( IRI(?orcid) AS ?orcidIRI)',
        optional(
          triple('?orcidIRI', 'rdfs:label', '?name'),
          triple('?orcidIRI', '<http://www.w3.org/2006/vcard/ns#organization-name>', '?organization'),
          triple('?orcidIRI', 'has_affiliation:', '?affiliation')
        ),
        'BIND(IF(bound(?name), ?name, ?orcid) as ?name)')
      .groupBy('?orcid ?name')
      .orderBy('?name', 'ASC');
    return '?query=' + encodeURIComponent(query.build());
  }

  buildOrganismsQuery() {

    let query = new Query();
    let graphQuery = new Query();
    graphQuery.graph('?model',
      '?model metago:graphType metago:noctuaCam',
      triple('?s', 'enabled_by:', '?entity'),
      triple('?entity', 'rdf:type', '?identifier'),
      'FILTER(?identifier != owl:NamedIndividual)'
    );

    query.prefix(
      prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
      prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
      prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
      prefix('metago', '<http://model.geneontology.org/>'),
      prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
      prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
      prefix('in_taxon', '<http://purl.obolibrary.org/obo/RO_0002162>'))
      .select(
        'distinct ?taxonIri ?taxonName',
        '(COUNT(distinct ?model) AS ?cams)'
      ).where(
        graphQuery,
        triple('?identifier', 'rdfs:subClassOf', '?v0'),
        triple('?v0', 'owl:onProperty', 'in_taxon:'),
        triple('?v0', 'owl:someValuesFrom', '?taxonIri'),
        triple('?taxonIri', 'rdfs:label', '?taxonName'),
      )
      .groupBy('?taxonIri ?taxonName')
      .orderBy('?taxonName', 'ASC')

    return '?query=' + encodeURIComponent(query.build());
  }

  buildAllGroupsQuery() {
    let query = `
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
		    PREFIX hint: <http://www.bigdata.com/queryHints#>
    
        SELECT  distinct ?name ?url         (GROUP_CONCAT(distinct ?orcidIRI;separator="@@") AS ?orcids) 
                                            (COUNT(distinct ?orcidIRI) AS ?contributors)
                                            (COUNT(distinct ?cam) AS ?cams)
        WHERE    
        {
          ?cam metago:graphType metago:noctuaCam .
          ?cam dc:contributor ?orcid .
          BIND( IRI(?orcid) AS ?orcidIRI ).  
          ?orcidIRI has_affiliation: ?url .
          ?url rdfs:label ?name .     
          hint:Prior hint:runLast true .
        }
        GROUP BY ?url ?name`

    return '?query=' + encodeURIComponent(query);
  }

  getXSD(s) {
    return "\"" + s + "\"^^xsd:string";
  }

}
