import { Component, OnChanges, AfterViewInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ViewContainerRef, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDrawer } from '@angular/material/sidenav';
import { map, filter, delay, combineLatest, reduce, catchError, retry, tap } from 'rxjs/operators';
import { BehaviorSubject, of, forkJoin, Observable, Subscriber } from 'rxjs';
import 'rxjs/add/observable/combineLatest';

import { ContextMenuComponent } from 'ngx-contextmenu';
import { NodeService } from './services/node.service';
import { CamDiagramService } from './../services/cam-diagram.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NoctuaActivityFormService, NoctuaFormMenuService } from 'noctua-form-base';
import { CamService } from 'noctua-form-base'
import { Activity } from 'noctua-form-base';
import { ActivityNode } from 'noctua-form-base';

@Component({
  selector: 'noc-nodes-container',
  templateUrl: './nodes-container.component.html',
  styleUrls: ['./nodes-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodesContainerComponent implements OnChanges, AfterViewInit {
  @ViewChild('nodes', { read: ViewContainerRef, static: true }) viewContainerRef: ViewContainerRef;
  @Input() nodes: any[];
  @ViewChild(ContextMenuComponent, { static: true }) public basicMenu: ContextMenuComponent;

  constructor(
    public noctuaFormMenuService: NoctuaFormMenuService,
    public camDiagramService: CamDiagramService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    private nodeService: NodeService) { }

  addActivity(event) {
    let location = {
      x: event.clientX,
      y: event.clientY
    }

    this.openForm(location);
  }

  openForm(location?) {
    this.noctuaActivityFormService.mfLocation = location;
    this.noctuaActivityFormService.initializeForm();
    //this.noctuaFormMenuService.openRightDrawer(this.noctuaFormMenuService.panel.activityForm)
  }

  ngOnChanges() {
    const self = this;

    this.nodeService.setRootViewContainerRef(this.viewContainerRef);
    this.nodeService.clear();
    if (this.nodes.length > 0) {
      this.nodes.forEach(node => {
        this.nodeService.addDynamicNode(node);
      })

      Observable.combineLatest(self.camDiagramService.onNodesReady).subscribe((nodes) => {
        self.connectNodes();
      })
    }
  }

  ngAfterViewInit() {
    this.camDiagramService.initJsPlumbInstance();
    //  this.nodeService.jsPlumbInstance.setZoom(0.25);
  }

  connectNodes() {
    const self = this;
    self.camDiagramService.jsPlumbInstance.batch(function () {
      self.nodes.forEach((activity: Activity) => {
        let connections = activity.activityConnections;

        //connections.forEach(connection => {
        //   let effect = self.camDiagramService.getCausalEffect(activity.connectionId, connection.object.uuid);

        //   self.camDiagramService.jsPlumbInstance.connect({
        //      source: activity.connectionId,
        //     target: connection.object.uuid,
        //     type: "basic",
        // paintStyle: { strokeWidth: 1, stroke: '#000000' },
        // endpointStyle: { fill: '#000000' }
        //    });
        //  });
      });

      self.camDiagramService.registeJSPlumbrEvents()
    })
  }

}