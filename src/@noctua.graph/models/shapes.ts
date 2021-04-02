import { Component, OnInit, Input, Output, EventEmitter, ViewChild, AfterViewInit, Injectable } from '@angular/core';
import * as jQuery from 'jquery';
import 'jqueryui';
import * as _ from 'lodash';
import * as joint from 'jointjs';
import * as Backbone from 'backbone';

declare module 'jointjs' {
  namespace shapes {
    namespace noctua {
      class StencilNode extends joint.dia.Link { }
      class NodeCell extends joint.dia.Element { }
      class NodeCellList extends joint.dia.Element { }
      class NodeLink extends joint.dia.Link { }
    }
  }
}

export const enum NodeCellType {
  link = 'noctua.NodeLink',
  cell = 'noctua.NodeCell',
}

const Link = joint.dia.Link;
const portAttrs = {
  '.port-body': {
    fill: '#16A085',
    r: 10,
    magnet: true
  },
  'text': {
    'text': '',
    'font-size': 12,
    'ref-x': '50%',
    'ref-y': .5,
    'text-anchor': 'middle',
    'y-alignment': 'middle',
  }
};

export const StencilNode = joint.dia.Element.define('noctua.StencilNode', {
  size: { width: 90, height: 110 },
  attrs: {
    body: {
      refWidth: '100%',
      refHeight: '100%',
      fill: '#FFFFFF',
      stroke: 'black'
    },
    iconBackground: {
      ref: 'icon',
      refWidth: '100%',
      refHeight: '100%',
      fill: '#FF0'
    },
    icon: {
      x: 5,
      y: 5,
      refWidth: '100%',
      height: 70,
    },
    label: {
      y: 85,
      height: '30px',
      refX: '50%',
      // refY: '50%',
      // refY2: 10,
      fill: '#555555',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      //fontWeight: 'bold',
      fontFamily: 'sans-serif',
      fontSize: 12,
      textWrap: {
        ellipsis: false,
        width: '90%'
      }
    }
  }
}, {
  markup: [{
    tagName: 'rect',
    selector: 'body'
  }, {
    tagName: 'rect',
    selector: 'statusLine'
  }, {
    tagName: 'rect',
    selector: 'iconBackground'
  }, {
    tagName: 'image',
    selector: 'icon'
  }, {
    tagName: 'text',
    selector: 'label'
  }]
}, {

});

export const NodeCell = joint.dia.Element.define('noctua.NodeCell', {
  attrs: {
    root: {
      magnet: false,
    },
    wrapper: {
      //magnet: true,
      refWidth: '100%',
      refHeight: '100%',
      // fill: '#FF0000',
      stroke: 'rgba(0,0,255,0.3)',
    },
    body: {
      refWidth: '100%',
      refHeight: '100%',
      fill: '#FFFFFF',
    },
    statusLine: {
      x: 0,
      y: 0,
      width: 3,
      refHeight: '100%',
      fill: '#6871AC'
    },
    nodeType: {
      x: 0,
      refX: '50%',
      y: 20,
      fill: '#6871AC',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      fontSize: 12,
      style: 'text-transform: uppercase'
    },
    noctuaTitle: {
      x: 0,
      refX: '50%',
      refY: '35px',
      fill: '#000000',
      textAnchor: 'middle',
      textVerticalAnchor: 'top',
      // fontFamily: 'sans-serif',
      fontSize: 12,
      text: '',
      textWrap: {
        width: -50,
        height: -40,
        ellipsis: true
      }
    }
  },
  inPorts: ['top', 'bottom', 'left',],
  outPorts: ['right'],

  /*  ports: {
     groups: {
       left: { position: 'left', attrs: portAttrs },
       top: { position: 'top', attrs: portAttrs },
       bottom: { position: 'bottom', attrs: portAttrs },
       right: { position: 'right', attrs: portAttrs }
     }
   } */

  ports: {
    groups: {
      left: {
        position: 'left',
        attrs: portAttrs,
        markup: '<circle class="port-body"/><text/>'
      },
      bottom: {
        position: 'bottom',
        attrs: portAttrs,
        markup: '<circle class="port-body"/><text/>'
      },
      top: {
        position: 'top',
        attrs: portAttrs,
        markup: '<circle class="port-body"/><text/>'
      },
      right: {
        position: 'right',
        attrs: {
          '.port-body': {
            fill: '#E74C3C',
            r: 10,
            magnet: 'passive'
          }
        },
        markup: '<circle class="port-body"/>'
      }
    },
    items: [{
      id: 'top',
      group: 'top'
    }, {
      id: 'right',
      group: 'right'
    }, {
      id: 'bottom',
      group: 'bottom'
    }, {
      id: 'left',
      group: 'left'
    }],
  },
}, {
  markup: [{
    tagName: 'rect',
    selector: 'wrapper'
  }, {
    tagName: 'rect',
    selector: 'body'
  }, {
    tagName: 'rect',
    selector: 'statusLine'
  }, {
    tagName: 'text',
    selector: 'nodeType'
  }, {
    tagName: 'text',
    selector: 'noctuaTitle'
  }],

}, {
  create: function (text) {
    return new this({
      attrs: {
        label: { text: text }
      }
    });
  }
});

export const NodeCellList = joint.dia.Element.define('noctua.NodeCellList', {
  attrs: {
    'rect': { width: 200 },

    '.uml-class-name-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#3400db' },
    '.uml-class-attrs-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#FF80b9' },
    '.uml-class-methods-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#0080b9' },

    '.uml-class-name-text': {
      'ref': '.uml-class-name-rect',
      'ref-y': .5,
      'ref-x': .5,
      'text-anchor': 'middle',
      'y-alignment': 'middle',
      'font-weight': 'bold',
      'fill': 'black',
      'font-size': 12,
      'font-family': 'Times New Roman'
    },
    '.uml-class-attrs-text': {
      'ref': '.uml-class-attrs-rect', 'ref-y': 5, 'ref-x': 5,
      'fill': 'black', 'font-size': 12, 'font-family': 'Times New Roman'
    },
    '.uml-class-methods-text': {
      'ref': '.uml-class-methods-rect', 'ref-y': 5, 'ref-x': 5,
      'fill': 'black', 'font-size': 12, 'font-family': 'Times New Roman'
    }
  },

  name: [],
  attributes: [],
  methods: []
}, {
  markup: [
    '<g class="rotatable">',
    '<g class="scalable">',
    '<rect class="uml-class-name-rect"/><rect class="uml-class-attrs-rect"/><rect class="uml-class-methods-rect"/>',
    '</g>',
    '<text class="uml-class-name-text"/><text class="uml-class-attrs-text"/><text class="uml-class-methods-text"/>',
    '</g>'
  ].join(''),

  initialize: function () {

    this.on('change:name change:attributes change:methods', function () {
      this.updateRectangles();
      this.trigger('uml-update');
    }, this);

    this.updateRectangles();

    joint.dia.Element.prototype.initialize.apply(this, arguments);
  },

  getClassName: function () {
    return this.get('name');
  },

  updateRectangles: function () {

    const attrs = this.get('attrs');

    const rects = [
      { type: 'name', text: this.getClassName() },
      { type: 'attrs', text: this.get('attributes') },
      { type: 'methods', text: this.get('methods') }
    ];

    let offsetY = 0;

    rects.forEach(function (rect) {

      const lines = Array.isArray(rect.text) ? rect.text : [rect.text];
      const rectHeight = lines.length * 20 + 20;

      attrs['.uml-class-' + rect.type + '-text'].text = lines.join('\n');
      attrs['.uml-class-' + rect.type + '-rect'].height = rectHeight;
      attrs['.uml-class-' + rect.type + '-rect'].transform = 'translate(0,' + offsetY + ')';

      offsetY += rectHeight;
    });
  }

});


export const NodeLink = joint.shapes.devs.Link.define('noctua.NodeLink', {
  attrs: {
    line: {
      connection: true,
      stroke: '#005580',
      strokeWidth: 1,
      strokeLinejoin: 'round',
      /*  sourceMarker: {
         type: 'rect',
         width: 10,
         height: 20,
         y: -10,
         stroke: 'none'
       }, */
      targetMarker: {
        type: 'path',
        fill: '#005580',
        d: 'M 10 -5 0 0 10 5 Z'
      }
    },
    defaultLabel: {
      markup: [
        {
          tagName: 'rect',
          selector: 'body'
        }, {
          tagName: 'text',
          selector: 'label'
        }
      ],
      attrs: {
        label: {
          text: {
            text: '150'
          },
          fill: 'blue',
          fontSize: 10,
          textAnchor: 'middle',
          yAlignment: 'middle',
          pointerEvents: 'none'
        },
        body: {
          ref: 'label',
          fill: 'pink',
          stroke: '#005580',
          strokeWidth: 1,
          refWidth: '120%',
          refHeight: '120%',
          refX: '-10%',
          refY: '-10%'
        }
      },
      position: {
        distance: 100, // default absolute position
        args: {
          absoluteDistance: true
        }
      }
    }
  }
}, {
  markup: [{
    tagName: 'path',
    selector: 'line',
    attributes: {
      'fill': 'none',
      'pointer-events': 'none'
    }
  }]
}, {

});




export const ClassView = joint.dia.ElementView.extend({

  initialize: function () {

    joint.dia.ElementView.prototype.initialize.apply(this, arguments);

    this.listenTo(this.model, 'uml-update', function () {
      this.update();
      this.resize();
    });
  }
});

export const AbstractView = ClassView;
/* 
export const Interface = Class.define('uml.Interface', {
  attrs: {
    '.uml-class-name-rect': { fill: '#f1c40f' },
    '.uml-class-attrs-rect': { fill: '#f39c12' },
    '.uml-class-methods-rect': { fill: '#f39c12' }
  }
}, {
  getClassName: function () {
    return ['<<Interface>>', this.get('name')];
  }
});
export const InterfaceView = ClassView; */

export const Generalization = Link.define('uml.Generalization', {
  attrs: { '.marker-target': { d: 'M 20 0 L 0 10 L 20 20 z', fill: 'white' } }
});

export const Implementation = Link.define('uml.Implementation', {
  attrs: {
    '.marker-target': { d: 'M 20 0 L 0 10 L 20 20 z', fill: 'white' },
    '.connection': { 'stroke-dasharray': '3,3' }
  }
});

export const Aggregation = Link.define('uml.Aggregation', {
  attrs: { '.marker-target': { d: 'M 40 10 L 20 20 L 0 10 L 20 0 z', fill: 'white' } }
});

export const Composition = Link.define('uml.Composition', {
  attrs: { '.marker-target': { d: 'M 40 10 L 20 20 L 0 10 L 20 0 z', fill: 'black' } }
});

export const Association = Link.define('uml.Association');

// Statechart
/* 
export const State = Generic.define('uml.State', {
  attrs: {
    '.uml-state-body': {
      'width': 200, 'height': 200, 'rx': 10, 'ry': 10,
      'fill': '#ecf0f1', 'stroke': '#bdc3c7', 'stroke-width': 3
    },
    '.uml-state-separator': {
      'stroke': '#bdc3c7', 'stroke-width': 2
    },
    '.uml-state-name': {
      'ref': '.uml-state-body', 'ref-x': .5, 'ref-y': 5, 'text-anchor': 'middle',
      'fill': '#000000', 'font-family': 'Courier New', 'font-size': 14
    },
    '.uml-state-events': {
      'ref': '.uml-state-separator', 'ref-x': 5, 'ref-y': 5,
      'fill': '#000000', 'font-family': 'Courier New', 'font-size': 14
    }
  },

  name: 'State',
  events: []

}, {
  markup: [
    '<g class="rotatable">',
    '<g class="scalable">',
    '<rect class="uml-state-body"/>',
    '</g>',
    '<path class="uml-state-separator"/>',
    '<text class="uml-state-name"/>',
    '<text class="uml-state-events"/>',
    '</g>'
  ].join(''),

  initialize: function () {

    this.on({
      'change:name': this.updateName,
      'change:events': this.updateEvents,
      'change:size': this.updatePath
    }, this);

    this.updateName();
    this.updateEvents();
    this.updatePath();

    Generic.prototype.initialize.apply(this, arguments);
  },

  updateName: function () {

    this.attr('.uml-state-name/text', this.get('name'));
  },

  updateEvents: function () {

    this.attr('.uml-state-events/text', this.get('events').join('\n'));
  },

  updatePath: function () {

    var d = 'M 0 20 L ' + this.get('size').width + ' 20';

    // We are using `silent: true` here because updatePath() is meant to be called
    // on resize and there's no need to to update the element twice (`change:size`
    // triggers also an update).
    this.attr('.uml-state-separator/d', d, { silent: true });
  }
});

export const StartState = Circle.define('uml.StartState', {
  type: 'uml.StartState',
  attrs: { circle: { 'fill': '#34495e', 'stroke': '#2c3e50', 'stroke-width': 2, 'rx': 1 } }
});

export const EndState = Generic.define('uml.EndState', {
  size: { width: 20, height: 20 },
  attrs: {
    'circle.outer': {
      transform: 'translate(10, 10)',
      r: 10,
      fill: '#ffffff',
      stroke: '#2c3e50'
    },

    'circle.inner': {
      transform: 'translate(10, 10)',
      r: 6,
      fill: '#34495e'
    }
  }
}, {
  markup: '<g class="rotatable"><g class="scalable"><circle class="outer"/><circle class="inner"/></g></g>',
}); */

export const Transition = Link.define('uml.Transition', {
  attrs: {
    '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z', fill: '#34495e', stroke: '#2c3e50' },
    '.connection': { stroke: '#2c3e50' }
  }
});
