import { ActivityType, noctuaFormConfig } from "noctua-form-base";
import { cloneDeep } from "lodash";

export interface StencilItemNode {
    id: string;
    label: string;
    type: ActivityType,
}

export interface StencilItem {
    id: string;
    label: string;
    nodes: StencilItemNode[]
}


const camStencil: StencilItem[] = [{
    id: 'activity_unit',
    label: 'Activity Type',
    nodes: [{
        type: ActivityType.default,
        id: noctuaFormConfig.activityType.options.default.name,
        label: noctuaFormConfig.activityType.options.default.label
    }, {
        type: ActivityType.bpOnly,
        id: noctuaFormConfig.activityType.options.bpOnly.name,
        label: noctuaFormConfig.activityType.options.bpOnly.label
    }]
}]

export const noctuaStencil = {
    camStencil: cloneDeep(camStencil)
};

