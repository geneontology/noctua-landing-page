export class AnnotonFormMetadata {
  private _lookupFunc;

  constructor(lookupFunc) {
    this._lookupFunc = lookupFunc;
  }

  get lookupFunc() {
    return this._lookupFunc;
  }

}
