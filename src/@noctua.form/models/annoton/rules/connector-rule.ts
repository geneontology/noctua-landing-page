import { noctuaFormConfig } from './../../../noctua-form-config';
import { Entity } from '../entity';
import { ConditionRule } from './condition-rule';
import { DirectionRule } from './direction-rule';
import { ReactionRule } from './reaction-rule';

export class ConnectorRule {
  annotonsConsecutive = new ConditionRule('annotonsConsecutive',
    'Do you know the mechanism for how the upstream activity affects the downstream activity?');
  effectDependency = new ConditionRule('effectDependency', 'Causal effect yes dependency?');
  effectDirection = new DirectionRule('effectDirection', 'Direction of Effect?');
  effectReactionProduct = new ReactionRule('effectReactionProduct', 'Causal Reaction Product?');
  subjectMFCatalyticActivity = new ConditionRule('subjectMFCatalyticActivity', 'Is upstream MF a Catalytic Activity');
  objectMFCatalyticActivity = new ConditionRule('objectMFCatalyticActivity', 'Is downstream MF a Catalytic Activity');
  activityRegulatingProcess = new ConditionRule('activityRegulatingProcess', 'Activity regulating process');

  r1Edge: Entity;
  r2Edge: Entity;

  notes = [
    this.subjectMFCatalyticActivity,
    this.objectMFCatalyticActivity,
    this.effectDependency,
    this.annotonsConsecutive,
    this.activityRegulatingProcess
  ];

  displaySection = {
    annotonsConsecutive: true,
    causalEffect: true,
    effectDependency: false,
    causalReactionProduct: false,
    process: false,
  };

  constructor() {
    this.annotonsConsecutive.condition = true;
    this.effectDependency.condition = false;
    this.effectDirection.direction = noctuaFormConfig.causalEffect.options.positive;
    this.effectReactionProduct.reaction = noctuaFormConfig.causalReactionProduct.options.regulate;
  }
}
