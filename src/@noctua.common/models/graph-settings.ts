import { FormControl, FormGroup } from "@angular/forms";


export class SettingsOptions {
  showAspect = false;
  showIsExtension = false;
  showEvidence = true;
  showReference = true;
  showEvidenceCode = true;
  showWith = true;
  showGroup = true;
  showContributor = true;

  createSettingsForm() {
    return new FormGroup({
      showAspect: new FormControl(this.showAspect),
      showIsExtension: new FormControl(this.showIsExtension),
      showEvidence: new FormControl(this.showEvidence),
      showEvidenceCode: new FormControl(this.showEvidenceCode),
      showReference: new FormControl(this.showReference),
      showWith: new FormControl(this.showWith),
      showGroup: new FormControl(this.showGroup),
      showContributor: new FormControl(this.showContributor),
    });
  }

  populateSettings(value) {
    this.showAspect = value.showAspect;
    this.showIsExtension = value.showIsExtension;
    this.showEvidence = value.showEvidence;
    this.showReference = value.showReference;
    this.showEvidenceCode = value.showEvidenceCode;
    this.showWith = value.showWith;
    this.showGroup = value.showGroup;
    this.showContributor = value.showContributor;
  }

  graphSettings() {
    this.showAspect = false;
    this.showIsExtension = false;
    this.showEvidence = true;
    this.showReference = true;
    this.showEvidenceCode = true;
    this.showWith = true;
    this.showGroup = false;
    this.showContributor = false;
  }
};