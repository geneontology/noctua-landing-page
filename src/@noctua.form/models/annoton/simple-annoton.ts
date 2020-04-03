declare const require: any;
const uuid = require('uuid/v1');
import { SaeGraph } from './sae-graph';
import { AnnotonNode } from './annoton-node';

export class SimpleAnnoton extends SaeGraph<AnnotonNode> {
  gp;
  _presentation;
  errors;
  submitErrors;
  id;
  label;
  edgeOption;
  parser;
  expanded = false;
  visible = true;


  constructor() {
    super();
    this.errors = [];
    this.submitErrors = [];
    this.id = uuid();
  }
}
