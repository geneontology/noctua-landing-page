import { Injectable } from '@angular/core';
import 'jqueryui';
import * as joint from 'jointjs';
import { each, cloneDeep } from 'lodash';
import { CamCanvas } from '../models/cam-canvas';
import { CamStencil } from '../models/cam-stencil';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { Activity, ActivityType, Cam, CamService, CamsService, ConnectorPanel, FormType, NoctuaActivityConnectorService, NoctuaActivityFormService, NoctuaFormConfigService } from 'noctua-form-base';
import { NodeLink, NodeCell, NoctuaShapesService } from '@noctua.graph/services/shapes.service';
import { NodeType } from 'scard-graph-ts';
import { NodeCellType } from '@noctua.graph/models/shapes';
import { noctuaStencil, StencilItemNode } from '@noctua.graph/data/cam-stencil';
import { RightPanel } from '@noctua.common/models/menu-panels';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';

@Injectable({
  providedIn: 'root'
})
export class CamGraphService {
  cam: Cam;
  stencils: {
    id: string,
    paper: joint.dia.Paper;
    graph: joint.dia.Graph;
  }[] = [];


  selectedElement: joint.shapes.noctua.NodeCell | joint.shapes.noctua.NodeLink;
  selectedStencilElement: joint.shapes.noctua.NodeCell;

  placeholderElement: joint.shapes.noctua.NodeCell = new NodeCell();

  camCanvas: CamCanvas;
  camStencil: CamStencil;

  constructor(
    private _camService: CamService,
    private _camsService: CamsService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private noctuaDataService: NoctuaDataService,
    private noctuaFormConfigService: NoctuaFormConfigService,
    private _activityFormService: NoctuaActivityFormService,
    private _activityConnectorService: NoctuaActivityConnectorService,
    public noctuaCommonMenuService: NoctuaCommonMenuService,
    private noctuaShapesService: NoctuaShapesService) {

    const self = this;

    this._camService.onCamChanged
      .subscribe((cam: Cam) => {
        if (!cam || !self.selectedElement) {
          return;
        }

        const type = self.selectedElement.get('type');

        if (type === NodeCellType.link) {
          (self.selectedElement as NodeLink).setText(cam.title);
        } else {
          self.selectedElement.attr('noctuaTitle/text', cam.title);
          // (self.selectedElement as NodeCell).addColor(cam.backgroundColor);
        }
        self.selectedElement.set({ cam: cam });
        self.selectedElement.set({ id: cam.id });
      });
  }

  initializeGraph() {
    const self = this;

    self.camCanvas = new CamCanvas();
    self.camCanvas.elementOnClick = self.openTable.bind(self);
    self.camCanvas.linkOnClick = self.openConnector.bind(self);
    self.camCanvas.onLinkCreated = self.createActivityConnector.bind(self);

  }

  initializeStencils() {
    const self = this;

    self.camStencil = new CamStencil(self.camCanvas, noctuaStencil.camStencil);
    self.camStencil.onAddElement = self.createActivity.bind(self);
  }

  addToCanvas(cam: Cam) {
    this.cam = cam;
    this.camCanvas.addCanvasGraph(cam);
  }

  zoom(delta: number, e?) {
    this.camCanvas.zoom(delta, e);
  }

  reset() {
    this.camCanvas.resetZoom();
  }

  createActivity(element: joint.shapes.noctua.NodeCell, x: number, y: number) {
    const self = this;
    const node = element.get('node') as StencilItemNode;
    const activity = self.noctuaFormConfigService.createActivityModel(node.type);

    self.placeholderElement.position(x, y);
    this._activityFormService.initializeForm();
    this.noctuaFormDialogService.openCreateActivityDialog(FormType.ACTIVITY);
  }

  createActivityConnector(
    sourceId: string,
    targetId: string,
    link: joint.shapes.noctua.NodeLink) {
    const self = this;

    self._activityConnectorService.initializeForm(sourceId, targetId);
    self._activityConnectorService.selectPanel(ConnectorPanel.FORM)
    self.noctuaFormDialogService.openCreateActivityDialog(FormType.ACTIVITY_CONNECTOR);
  }

  addActivity(activity: Activity) {
    const self = this;

    const el = self.camCanvas.createNode(activity)
    const position = self.placeholderElement.prop('position') as joint.dia.Point

    el.position(position.x, position.y);
    self.camCanvas.canvasGraph.addCell(el);
  }


  openTable(element: joint.shapes.noctua.NodeCell) {
    const activity = element.prop('activity') as Activity
    this.selectedElement = element;
    // activity.type = element.get('type');
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.camTable);
    this.noctuaCommonMenuService.openRightDrawer();

    activity.expanded = true;
    this._camsService.currentMatch.activityDisplayId = activity.displayId;
    const q = `#${activity.displayId}`;
    this.noctuaCommonMenuService.scrollTo(q);
  }

  openConnector(element: joint.shapes.noctua.NodeLink) {
    const self = this;
    this.selectedElement = element;
    const source = element.get('source');
    const target = element.get('source');

    if (!source || !target) return
    self._activityConnectorService.initializeForm(source.id, target.id);
    self._activityConnectorService.selectPanel(ConnectorPanel.FORM)

    this.noctuaCommonMenuService.selectRightPanel(RightPanel.connectorForm);
    this.noctuaCommonMenuService.openRightDrawer();

  }

  save() {
    const self = this;
    const cells: joint.dia.Cell[] = this.camCanvas.canvasGraph.getCells();
    const cams = [];
    const triples = [];

    each(cells, (cell: joint.dia.Cell) => {
      const type = cell.get('type');

      if (type === NodeCellType.link) {
        const subject = cell.get('source');
        const object = cell.get('target');

        triples.push({
          subject: {
            uuid: subject.id,
          },
          predicate: {
            id: cell.get('id'),
          },
          object: {
            uuid: object.id
          }
        });
      } else {
        cams.push({
          uuid: cell.get('id'),
          id: cell.get('id'),
          position: cell.get('position'),
          size: cell.get('size'),
        });
      }
    });

    const cam = {
      cams,
      triples
    };

  }
}
