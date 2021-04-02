import { Injectable } from '@angular/core';
import 'jqueryui';
import * as joint from 'jointjs';
import { each, cloneDeep } from 'lodash';
import { CamCanvas } from '../models/cam-canvas';
import { CamStencil } from '../models/cam-stencil';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { Activity, ActivityType, Cam, CamService, NoctuaActivityFormService, NoctuaFormConfigService } from 'noctua-form-base';
import { NodeLink, NodeCell, NoctuaShapesService } from '@noctua.graph/services/shapes.service';
import { NodeType } from 'scard-graph-ts';
import { NodeCellType } from '@noctua.graph/models/shapes';
import { noctuaStencil } from '@noctua.graph/data/cam-stencil';
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
  camCanvas: CamCanvas;
  camStencil: CamStencil;

  constructor(
    private _camService: CamService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private noctuaDataService: NoctuaDataService,
    private noctuaFormConfigService: NoctuaFormConfigService,
    private activityFormService: NoctuaActivityFormService,
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
    self.camCanvas.onElementAdd = self.createActivity.bind(self);
  }

  initializeStencils() {
    const self = this;

    self.camStencil = new CamStencil(self.camCanvas, noctuaStencil.camStencil);
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

  createActivity(activityType: ActivityType) {
    const self = this;
    const activity = self.noctuaFormConfigService.createActivityModel(activityType);

    self.openForm(activity);
    return activity;
  }


  openForm(activity: Activity) {
    // const activity = element.prop('activity') as Activity
    //  this.selectedElement = element;
    // activity.type = element.get('type');
    //this.activityFormService.initializeForm(activity);
    // this.noctuaCommonMenuService.selectRightPanel(RightPanel.activityForm);
    // this.noctuaCommonMenuService.openRightDrawer();

    this.noctuaFormDialogService.openCreateActivityDialog(activity)

  }

  openTable(element: joint.shapes.noctua.NodeCell) {
    const activity = element.prop('activity') as Activity
    this.selectedElement = element;
    // activity.type = element.get('type');
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.camTable);
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
