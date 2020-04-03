import { AnnotonError } from "./parser/annoton-error";
import { Entity } from './entity';
import { AnnotonNode } from './annoton-node';
import { includes, isEqual } from 'lodash';

import { noctuaFormConfig } from './../../noctua-form-config';

export class Evidence {
  edge: Entity;
  evidence: Entity = new Entity('', '');
  reference: string;
  referenceUrl: string;
  with: string;
  assignedBy: Entity = new Entity('', '');
  classExpression;
  uuid;
  evidenceRequired = false;
  referenceRequired = false;
  ontologyClass = [];

  constructor() {

  }

  hasValue() {
    const self = this;

    return self.evidence.id && self.reference;
  }

  setEvidenceOntologyClass(value) {
    this.ontologyClass = value;
  }

  setEvidence(value: Entity, classExpression?) {
    this.evidence = value;

    if (classExpression) {
      this.classExpression = classExpression;
    }
  }

  clearValues() {
    const self = this;

    self.setEvidence(new Entity('', ''));
    self.reference = '';
    self.with = '';
    self.assignedBy = new Entity('', '');
  }

  copyValues(evidence: Evidence, except) {
    const self = this;

    self.setEvidence(evidence.evidence);
    !includes(except, 'reference') ? self.reference = evidence.reference : null;
    !includes(except, 'with') ? self.with = evidence.with : null;
    !includes(except, 'assignedBy') ? self.assignedBy = evidence.assignedBy : null;
  }

  isEvidenceEqual(evidence) {
    const self = this;
    let result = true;

    result = result && isEqual(self.evidence, evidence.evidence);
    result = result && isEqual(self.reference, evidence.reference);
    result = result && isEqual(self.with, evidence.with);

    return result;
  }

  enableSubmit(errors, node: AnnotonNode, position) {
    const self = this;
    let result = true;
    const meta = {
      aspect: node.label
    };

    if (self.evidence.id) {
      self.evidenceRequired = false;
    } else {
      self.evidenceRequired = true;

      const error = new AnnotonError('error', 1, `No evidence for "${node.label}": on evidence(${position})`, meta);

      errors.push(error);
      result = false;
    }

    if (self.evidence.id && !self.reference) {
      const error = new AnnotonError('error', 1,
        `You provided an evidence for "${node.label}" but no reference: on evidence(${position})`,
        meta);
      errors.push(error);

      self.referenceRequired = true;
      result = false;
    } else {
      self.referenceRequired = false;
    }

    if (self.reference) {
      result = self._enableReferenceSubmit(errors, self.reference, node, position);
    }

    return result;
  }

  private _enableReferenceSubmit(errors, reference: string, node: AnnotonNode, position): boolean {
    const meta = {
      aspect: node.label
    };

    if (!reference.includes(':')) {
      const error = new AnnotonError('error', 1,
        `Use DB:accession format for reference "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    }

    const DBAccession = reference.split(':');
    const db = DBAccession[0].trim().toLowerCase();
    const accession = DBAccession[1].trim().toLowerCase();
    const dbs = ['pmid', 'go_ref', 'doi'];

    /*
    if (!dbs.includes(db)) {
      const error = new AnnotonError('error', 1,
        `Please enter either PMID, DOI or GO_REF for "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    } */

    if (accession === '') {
      const error = new AnnotonError('error', 1,
        `"${db}" accession is required "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    }

    return true;
  }

}

export function compareEvidence(a: Evidence, b: Evidence) {
  return a.evidence.id === b.evidence.id
    && a.reference === b.reference
    && a.with === b.with;
}
