import { FormControl } from '@angular/forms';
import { Cam } from './../annoton/cam';
import { Contributor } from './../contributor';
import { AnnotonFormMetadata } from './../forms/annoton-form-metadata';

export class CamForm {
  title = new FormControl();
  state = new FormControl();
  group = new FormControl();

  _metadata: AnnotonFormMetadata;

  constructor(metadata) {
    this._metadata = metadata;
  }

  createCamForm(cam: Cam, user: Contributor) {
    const self = this;

    if (cam) {
      self.title.setValue(cam.title);
      self.state.setValue(cam.state);
      self.group.setValue(user ? user.group : '');
    }
  }

  getError() {

  }

  populateConnectorForm(cam: Cam) {
    const self = this;

    cam.title = self.title.value;
    cam.state = self.state.value;
  }
}
