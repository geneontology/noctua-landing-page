
declare const require: any;
const getUuid = require('uuid/v1');

import { noctuaFormConfig } from './../../noctua-form-config';
import {
    AnnotonNode,
    AnnotonNodeType,
    AnnotonNodeDisplay,
    GoCategory,
    categoryToClosure
} from './../../models/annoton/annoton-node';
import { EntityLookup } from './../..//models/annoton/entity-lookup';
import { Predicate } from './../../models/annoton/predicate';


const baseRequestParams = {
    defType: 'edismax',
    indent: 'on',
    qt: 'standard',
    wt: 'json',
    rows: '10',
    start: '0',
    fl: '*,score',
    'facet': true,
    'facet.mincount': 1,
    'facet.sort': 'count',
    'facet.limit': '25',
    'json.nl': 'arrarr',
    packet: '1',
    callback_type: 'search',
    'facet.field': [
        'source',
        'subset',
        'isa_closure_label',
        'is_obsolete'
    ],
    qf: [
        'annotation_class^3',
        'annotation_class_label_searchable^5.5',
        'description_searchable^1',
        'comment_searchable^0.5',
        'synonym_searchable^1',
        'alternate_id^1',
        'isa_closure^1',
        'isa_closure_label_searchable^1'
    ],
    _: Date.now()
};



export const GoProteinContainingComplex = {
    id: AnnotonNodeType.GoProteinContainingComplex,
    category: 'GO:0032991',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCellularComponent = {
    id: AnnotonNodeType.GoCellularComponent,
    category: 'GO:0005575',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoBiologicalProcess = {
    id: AnnotonNodeType.GoBiologicalProcess,
    category: 'GO:0008150',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoMolecularFunction = {
    id: AnnotonNodeType.GoMolecularFunction,
    category: 'GO:0003674',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoMolecularEntity = {
    id: AnnotonNodeType.GoMolecularEntity,
    category: 'CHEBI:33695',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoChemicalEntity = {
    id: AnnotonNodeType.GoChemicalEntity,
    category: 'CHEBI:24431',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoEvidence = {
    id: AnnotonNodeType.GoEvidence,
    category: 'ECO:0000352',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCellTypeEntity = {
    id: AnnotonNodeType.GoCellTypeEntity,
    category: 'CL:0000003',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoAnatomicalEntity = {
    id: AnnotonNodeType.GoAnatomicalEntity,
    category: 'CARO:0000000',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoOrganism = {
    id: AnnotonNodeType.GoOrganism,
    category: 'NCBITaxon',
    categoryType: 'idspace',
} as GoCategory;

export const GoBiologicalPhase = {
    id: AnnotonNodeType.GoBiologicalPhase,
    category: 'GO:0044848',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCatalyticActivity = {
    id: AnnotonNodeType.GoCatalyticActivity,
    category: 'GO:0003824',
    categoryType: 'isa_closure',
} as GoCategory;

export const EntityCategories = [
    [GoProteinContainingComplex],
    [GoCellularComponent],
    [GoBiologicalProcess],
    [GoMolecularFunction],
    [GoMolecularEntity, GoProteinContainingComplex],
    [GoChemicalEntity],
    [GoEvidence],
    [GoCellTypeEntity],
    [GoAnatomicalEntity],
    [GoOrganism],
    [GoBiologicalPhase],
    [GoChemicalEntity, GoProteinContainingComplex],
    [GoChemicalEntity, GoAnatomicalEntity, GoProteinContainingComplex]
    // [GoCatalyticActivity]
];

export const generateBaseTerm = (goCategories?: GoCategory[], override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = new AnnotonNode();
    const predicate = new Predicate(null);
    const fqTermCategory = categoryToClosure(goCategories);
    const fqEvidenceCategory = categoryToClosure([GoEvidence]);

    predicate.setEvidenceMeta('eco', Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
        fq: [
            'document_category:"ontology_class"',
            fqEvidenceCategory
        ],
    }));

    annotonNode.predicate = predicate;

    if (goCategories && goCategories.length > 0) {
        annotonNode.termLookup = new EntityLookup(null,
            Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
                fq: [
                    'document_category:"ontology_class"',
                    fqTermCategory
                ],
            })
        );
    }

    annotonNode.overrideValues(override);

    return annotonNode;
};


export const generateGoTerm = (): AnnotonNode => {
    const annotonNode = generateBaseTerm();

    annotonNode.id = 'goterm';
    annotonNode.ontologyClass = ['go'];
    annotonNode.termLookup = new EntityLookup(null,
        Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
            fq: [
                'document_category:"ontology_class"',
                'isa_closure:"GO:0003674" OR isa_closure:"GO:0008150" OR isa_closure:"GO:0005575"',
            ],
        }),
    );

    return annotonNode;
};

export const generateProteinContainingComplex = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoProteinContainingComplex]);

    annotonNode.id = GoProteinContainingComplex.id;
    annotonNode.type = GoProteinContainingComplex.id;
    annotonNode.category = [GoProteinContainingComplex];
    annotonNode.label = 'Macromolecular Complex';
    annotonNode.displaySection = noctuaFormConfig.displaySection.gp;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.mc;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateMolecularEntity = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoMolecularEntity]);

    annotonNode.id = GoMolecularEntity.id;
    annotonNode.type = GoMolecularEntity.id;
    annotonNode.category = [GoMolecularEntity];
    annotonNode.label = 'Gene Product';
    annotonNode.displaySection = noctuaFormConfig.displaySection.gp;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.gp;
    annotonNode.ontologyClass = [];
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateMolecularFunction = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoMolecularFunction]);

    annotonNode.id = GoMolecularFunction.id;
    annotonNode.category = [GoMolecularFunction];
    annotonNode.label = 'Molecular Function';
    annotonNode.aspect = 'F';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.mf;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateBiologicalProcess = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoBiologicalProcess]);

    annotonNode.id = GoBiologicalProcess.id;
    annotonNode.category = [GoBiologicalProcess];
    annotonNode.label = 'MF part of Biological Process';
    annotonNode.aspect = 'P';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.bp;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateCellularComponent = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoCellularComponent]);

    annotonNode.id = GoCellularComponent.id;
    annotonNode.category = [GoCellularComponent];
    annotonNode.label = 'MF occurs in Cellular Component';
    annotonNode.aspect = 'C';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.cc;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateChemicalEntity = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoChemicalEntity]);
    annotonNode.id = GoChemicalEntity.id;
    annotonNode.category = [GoChemicalEntity];
    annotonNode.label = 'Has Input (GP/Chemical)';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.mf;
    annotonNode.isExtension = true;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateBiologicalPhase = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoBiologicalPhase]);

    annotonNode.id = GoBiologicalPhase.id;
    annotonNode.category = [GoBiologicalPhase];
    annotonNode.label = 'Happens During (Temporal Phase)';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.mf;
    annotonNode.isExtension = true;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateCellTypeEntity = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoCellTypeEntity]);
    annotonNode.id = GoCellTypeEntity.id;
    annotonNode.category = [GoCellTypeEntity];
    annotonNode.label = 'Part Of (Cell Type)';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.cc;
    annotonNode.isExtension = true;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateAnatomicalEntity = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoAnatomicalEntity]);

    annotonNode.id = GoAnatomicalEntity.id;
    annotonNode.category = [GoAnatomicalEntity];
    annotonNode.label = 'Part Of (Anatomy)';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.cc;
    annotonNode.isExtension = true;
    annotonNode.overrideValues(override);
    return annotonNode;
};

export const generateOrganism = (override: Partial<AnnotonNodeDisplay> = {}): AnnotonNode => {
    const annotonNode = generateBaseTerm([GoOrganism]);

    annotonNode.id = GoOrganism.id;
    annotonNode.category = [GoOrganism];
    annotonNode.label = 'Part Of (Organism)';
    annotonNode.displaySection = noctuaFormConfig.displaySection.fd;
    annotonNode.displayGroup = noctuaFormConfig.displayGroup.cc;
    annotonNode.treeLevel = 5;
    annotonNode.isExtension = true;
    annotonNode.overrideValues(override);
    return annotonNode;
};

