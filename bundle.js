(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3-array'), require('d3-axis'), require('d3-brush'), require('d3-collection'), require('d3-drag'), require('d3-force'), require('d3-format'), require('d3-timer'), require('d3-transition'), require('d3-time-format'), require('d3-color'), require('d3-pie'), require('d3-interpolate'), require('d3-delaunay'), require('d3-scale'), require('d3-selection'), require('d3-shape'), require('d3-dispatch'), require('d3-beeswarm')) :
  typeof define === 'function' && define.amd ? define(['d3-array', 'd3-axis', 'd3-brush', 'd3-collection', 'd3-drag', 'd3-force', 'd3-format', 'd3-timer', 'd3-transition', 'd3-time-format', 'd3-color', 'd3-pie', 'd3-interpolate', 'd3-delaunay', 'd3-scale', 'd3-selection', 'd3-shape', 'd3-dispatch', 'd3-beeswarm'], factory) :
  (global = global || self, global.d3 = factory(global.d3Array, global.d3Axis, global.d3Brush, global.d3Collection, global.d3Drag, global.d3Force, global.d3Format, global.d3Timer, global.d3Transition, global.d3TimeFormat, global.d3Color, global.d3Pie, global.d3Interpolate, global.d3Delaunay, global.d3Scale, global.d3Selection, global.d3Shape, global.d3Dispatch, global.d3Beeswarm));
}(this, (function (d3Array, d3Axis, d3Brush, d3Collection, d3Drag, d3Force, d3Format, d3Timer, d3Transition, d3TimeFormat, d3Color, d3Pie, d3Interpolate, d3Delaunay, d3Scale, d3Selection, d3Shape, d3Dispatch, d3Beeswarm) { 'use strict';

  var index = {
    extent: d3Array.extent,
    merge: d3Array.merge,
    descending: d3Array.descending,
    median: d3Array.median,
    quantile: d3Array.quantile,
    ascending: d3Array.ascending,
    max: d3Array.max,
    bisector: d3Array.bisector,
    mean: d3Array.mean,
    transpose: d3Array.transpose,
    bisect: d3Array.bisect,
    axisBottom: d3Axis.axisBottom,
    brushX: d3Brush.brushX,
    set: d3Collection.set,
    nest: d3Collection.nest,
    map: d3Collection.map,
    drag: d3Drag.drag,
    forceSimulation: d3Force.forceSimulation,
    format: d3Format.format,
    timerFlush: d3Timer.timerFlush,
    transition: d3Transition.transition,
    timeFormat: d3TimeFormat.timeFormat,
    rgb: d3Color.rgb,
    pie: d3Pie.pie,
    interpolate: d3Interpolate.interpolate,
    interpolateString: d3Interpolate.interpolateString,
    interpolateNumber: d3Interpolate.interpolateNumber,
    Voronoi: d3Delaunay.Voronoi,
    scaleOrdinal: d3Scale.scaleOrdinal,
    event: d3Selection.event,
    selection: d3Selection.selection,
    mouse: d3Selection.mouse,
    area: d3Shape.area,
    line: d3Shape.line,
    symbols: d3Shape.symbols,
    arc: d3Shape.arc,
    stack: d3Shape.stack,
    dispatch: d3Dispatch.dispatch,
    beeswarm: d3Beeswarm.beeswarm,
  };

  return index;

})));
