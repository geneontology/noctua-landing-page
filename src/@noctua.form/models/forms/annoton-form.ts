import { FormControl, FormBuilder, FormArray } from '@angular/forms';

import { Annoton } from './../annoton/annoton';
import { AnnotonFormMetadata } from './../forms/annoton-form-metadata';
import { EntityGroupForm } from './entity-group-form';
import { Entity } from './../../models/annoton/entity';
import { each } from 'lodash';

export class AnnotonForm {
  entityGroupForms: EntityGroupForm[] = [];
  bpOnlyEdge = new FormControl();
  gp = new FormArray([]);
  fd = new FormArray([]);

  private _metadata: AnnotonFormMetadata;
  private _fb = new FormBuilder();

  constructor(metadata) {
    this._metadata = metadata;
  }

  createMolecularEntityForm(gpData) {
    const self = this;

    each(gpData, (nodeGroup, nodeKey) => {
      const entityGroupForm = new EntityGroupForm(this._metadata);

      this.entityGroupForms.push(entityGroupForm);
      entityGroupForm.name = nodeKey;
      entityGroupForm.createEntityForms(nodeGroup.nodes);
      self.gp.push(self._fb.group(entityGroupForm));
    });
  }

  createFunctionDescriptionForm(fdData) {
    const self = this;

    each(fdData, (nodeGroup, nodeKey) => {
      const entityGroupForm = new EntityGroupForm(this._metadata);

      this.entityGroupForms.push(entityGroupForm);
      entityGroupForm.name = nodeKey;
      entityGroupForm.isComplement = nodeGroup.isComplement;
      entityGroupForm.createEntityForms(nodeGroup.nodes);
      self.fd.push(self._fb.group(entityGroupForm));
    });
  }

  populateAnnoton(annoton: Annoton) {

    this.entityGroupForms.forEach((entityGroupForm: EntityGroupForm) => {
      entityGroupForm.populateAnnotonNodes(annoton);
    });

    if (this.bpOnlyEdge.value) {
      annoton.bpOnlyEdge = new Entity(this.bpOnlyEdge.value.id, this.bpOnlyEdge.value.label);
    }
  }

  getErrors(error) {
    this.entityGroupForms.forEach((entityGroupForm: EntityGroupForm) => {
      entityGroupForm.getErrors(error);
    });
  }
}
