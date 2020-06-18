(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.d3 = factory());
}(this, (function () { 'use strict';

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;

  function descending(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  function extent(values, valueof) {
    let min;
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
    return [min, max];
  }

  function max(values, valueof) {
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null
            && (max < value || (max === undefined && value >= value))) {
          max = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null
            && (max < value || (max === undefined && value >= value))) {
          max = value;
        }
      }
    }
    return max;
  }

  function min(values, valueof) {
    let min;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null
            && (min > value || (min === undefined && value >= value))) {
          min = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null
            && (min > value || (min === undefined && value >= value))) {
          min = value;
        }
      }
    }
    return min;
  }

  // Based on https://github.com/mourner/quickselect
  // ISC license, Copyright 2018 Vladimir Agafonkin.
  function quickselect(array, k, left = 0, right = array.length - 1, compare = ascending) {
    while (right > left) {
      if (right - left > 600) {
        const n = right - left + 1;
        const m = k - left + 1;
        const z = Math.log(n);
        const s = 0.5 * Math.exp(2 * z / 3);
        const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
        const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
        const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
        quickselect(array, k, newLeft, newRight, compare);
      }

      const t = array[k];
      let i = left;
      let j = right;

      swap(array, left, k);
      if (compare(array[right], t) > 0) swap(array, left, right);

      while (i < j) {
        swap(array, i, j), ++i, --j;
        while (compare(array[i], t) < 0) ++i;
        while (compare(array[j], t) > 0) --j;
      }

      if (compare(array[left], t) === 0) swap(array, left, j);
      else ++j, swap(array, j, right);

      if (j <= k) left = j + 1;
      if (k <= j) right = j - 1;
    }
    return array;
  }

  function swap(array, i, j) {
    const t = array[i];
    array[i] = array[j];
    array[j] = t;
  }

  function* numbers(values, valueof) {
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          yield value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          yield value;
        }
      }
    }
  }

  function quantile(values, p, valueof) {
    values = Float64Array.from(numbers(values, valueof));
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return min(values);
    if (p >= 1) return max(values);
    var n,
        i = (n - 1) * p,
        i0 = Math.floor(i),
        value0 = max(quickselect(values, i0).subarray(0, i0 + 1)),
        value1 = min(values.subarray(i0 + 1));
    return value0 + (value1 - value0) * (i - i0);
  }

  function mean(values, valueof) {
    let count = 0;
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value != null && (value = +value) >= value) {
          ++count, sum += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
          ++count, sum += value;
        }
      }
    }
    if (count) return sum / count;
  }

  function median(values, valueof) {
    return quantile(values, 0.5, valueof);
  }

  function* flatten(arrays) {
    for (const array of arrays) {
      yield* array;
    }
  }

  function merge(arrays) {
    return Array.from(flatten(arrays));
  }

  function transpose(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  }

  function length(d) {
    return d.length;
  }

  var slice = Array.prototype.slice;

  function identity(x) {
    return x;
  }

  var top = 1,
      right = 2,
      bottom = 3,
      left = 4,
      epsilon = 1e-6;

  function translateX(x) {
    return "translate(" + (x + 0.5) + ",0)";
  }

  function translateY(y) {
    return "translate(0," + (y + 0.5) + ")";
  }

  function number(scale) {
    return function(d) {
      return +scale(d);
    };
  }

  function center(scale) {
    var offset = Math.max(0, scale.bandwidth() - 1) / 2; // Adjust for 0.5px offset.
    if (scale.round()) offset = Math.round(offset);
    return function(d) {
      return +scale(d) + offset;
    };
  }

  function entering() {
    return !this.__axis;
  }

  function axis(orient, scale) {
    var tickArguments = [],
        tickValues = null,
        tickFormat = null,
        tickSizeInner = 6,
        tickSizeOuter = 6,
        tickPadding = 3,
        k = orient === top || orient === left ? -1 : 1,
        x = orient === left || orient === right ? "x" : "y",
        transform = orient === top || orient === bottom ? translateX : translateY;

    function axis(context) {
      var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
          format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity) : tickFormat,
          spacing = Math.max(tickSizeInner, 0) + tickPadding,
          range = scale.range(),
          range0 = +range[0] + 0.5,
          range1 = +range[range.length - 1] + 0.5,
          position = (scale.bandwidth ? center : number)(scale.copy()),
          selection = context.selection ? context.selection() : context,
          path = selection.selectAll(".domain").data([null]),
          tick = selection.selectAll(".tick").data(values, scale).order(),
          tickExit = tick.exit(),
          tickEnter = tick.enter().append("g").attr("class", "tick"),
          line = tick.select("line"),
          text = tick.select("text");

      path = path.merge(path.enter().insert("path", ".tick")
          .attr("class", "domain")
          .attr("stroke", "currentColor"));

      tick = tick.merge(tickEnter);

      line = line.merge(tickEnter.append("line")
          .attr("stroke", "currentColor")
          .attr(x + "2", k * tickSizeInner));

      text = text.merge(tickEnter.append("text")
          .attr("fill", "currentColor")
          .attr(x, k * spacing)
          .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

      if (context !== selection) {
        path = path.transition(context);
        tick = tick.transition(context);
        line = line.transition(context);
        text = text.transition(context);

        tickExit = tickExit.transition(context)
            .attr("opacity", epsilon)
            .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d) : this.getAttribute("transform"); });

        tickEnter
            .attr("opacity", epsilon)
            .attr("transform", function(d) { var p = this.parentNode.__axis; return transform(p && isFinite(p = p(d)) ? p : position(d)); });
      }

      tickExit.remove();

      path
          .attr("d", orient === left || orient == right
              ? (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter : "M0.5," + range0 + "V" + range1)
              : (tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + ",0.5H" + range1));

      tick
          .attr("opacity", 1)
          .attr("transform", function(d) { return transform(position(d)); });

      line
          .attr(x + "2", k * tickSizeInner);

      text
          .attr(x, k * spacing)
          .text(format);

      selection.filter(entering)
          .attr("fill", "none")
          .attr("font-size", 10)
          .attr("font-family", "sans-serif")
          .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

      selection
          .each(function() { this.__axis = position; });
    }

    axis.scale = function(_) {
      return arguments.length ? (scale = _, axis) : scale;
    };

    axis.ticks = function() {
      return tickArguments = slice.call(arguments), axis;
    };

    axis.tickArguments = function(_) {
      return arguments.length ? (tickArguments = _ == null ? [] : slice.call(_), axis) : tickArguments.slice();
    };

    axis.tickValues = function(_) {
      return arguments.length ? (tickValues = _ == null ? null : slice.call(_), axis) : tickValues && tickValues.slice();
    };

    axis.tickFormat = function(_) {
      return arguments.length ? (tickFormat = _, axis) : tickFormat;
    };

    axis.tickSize = function(_) {
      return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
    };

    axis.tickSizeInner = function(_) {
      return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
    };

    axis.tickSizeOuter = function(_) {
      return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
    };

    axis.tickPadding = function(_) {
      return arguments.length ? (tickPadding = +_, axis) : tickPadding;
    };

    return axis;
  }

  function axisBottom(scale) {
    return axis(bottom, scale);
  }

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix = "$"; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
    if (onupdate != null) update = onupdate(update);
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending$1;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending$1(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  var filterEvents = {};

  var event = null;

  if (typeof document !== "undefined") {
    var element = document.documentElement;
    if (!("onmouseenter" in element)) {
      filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function(event1) {
      var event0 = event; // Events can be reentrant (e.g., focus).
      event = event1;
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
        event = event0;
      }
    };
  }

  function parseTypenames$1(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function customEvent(event1, listener, that, args) {
    var event0 = event;
    event1.sourceEvent = event;
    event = event1;
    try {
      return listener.apply(that, args);
    } finally {
      event = event0;
    }
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection([[document.documentElement]], root);
  }

  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  function sourceEvent() {
    var current = event, source;
    while (source = current.sourceEvent) current = source;
    return current;
  }

  function point(node, event) {
    var svg = node.ownerSVGElement || node;

    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }

    var rect = node.getBoundingClientRect();
    return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
  }

  function mouse(node) {
    var event = sourceEvent();
    if (event.changedTouches) event = event.changedTouches[0];
    return point(node, event);
  }

  function touch(node, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

    for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return point(node, touch);
      }
    }

    return null;
  }

  function nopropagation() {
    event.stopImmediatePropagation();
  }

  function noevent() {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function dragDisable(view) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", noevent, true);
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", noevent, true);
    } else {
      root.__noselect = root.style.MozUserSelect;
      root.style.MozUserSelect = "none";
    }
  }

  function yesdrag(view, noclick) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", null);
    if (noclick) {
      selection.on("click.drag", noevent, true);
      setTimeout(function() { selection.on("click.drag", null); }, 0);
    }
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", null);
    } else {
      root.style.MozUserSelect = root.__noselect;
      delete root.__noselect;
    }
  }

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function DragEvent(target, type, subject, id, active, x, y, dx, dy, dispatch) {
    this.target = target;
    this.type = type;
    this.subject = subject;
    this.identifier = id;
    this.active = active;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this._ = dispatch;
  }

  DragEvent.prototype.on = function() {
    var value = this._.on.apply(this._, arguments);
    return value === this._ ? this : value;
  };

  // Ignore right-click, since that should open the context menu.
  function defaultFilter() {
    return !event.ctrlKey && !event.button;
  }

  function defaultContainer() {
    return this.parentNode;
  }

  function defaultSubject(d) {
    return d == null ? {x: event.x, y: event.y} : d;
  }

  function defaultTouchable() {
    return navigator.maxTouchPoints || ("ontouchstart" in this);
  }

  function drag() {
    var filter = defaultFilter,
        container = defaultContainer,
        subject = defaultSubject,
        touchable = defaultTouchable,
        gestures = {},
        listeners = dispatch("start", "drag", "end"),
        active = 0,
        mousedownx,
        mousedowny,
        mousemoving,
        touchending,
        clickDistance2 = 0;

    function drag(selection) {
      selection
          .on("mousedown.drag", mousedowned)
        .filter(touchable)
          .on("touchstart.drag", touchstarted)
          .on("touchmove.drag", touchmoved)
          .on("touchend.drag touchcancel.drag", touchended)
          .style("touch-action", "none")
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }

    function mousedowned() {
      if (touchending || !filter.apply(this, arguments)) return;
      var gesture = beforestart("mouse", container.apply(this, arguments), mouse, this, arguments);
      if (!gesture) return;
      select(event.view).on("mousemove.drag", mousemoved, true).on("mouseup.drag", mouseupped, true);
      dragDisable(event.view);
      nopropagation();
      mousemoving = false;
      mousedownx = event.clientX;
      mousedowny = event.clientY;
      gesture("start");
    }

    function mousemoved() {
      noevent();
      if (!mousemoving) {
        var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
        mousemoving = dx * dx + dy * dy > clickDistance2;
      }
      gestures.mouse("drag");
    }

    function mouseupped() {
      select(event.view).on("mousemove.drag mouseup.drag", null);
      yesdrag(event.view, mousemoving);
      noevent();
      gestures.mouse("end");
    }

    function touchstarted() {
      if (!filter.apply(this, arguments)) return;
      var touches = event.changedTouches,
          c = container.apply(this, arguments),
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = beforestart(touches[i].identifier, c, touch, this, arguments)) {
          nopropagation();
          gesture("start");
        }
      }
    }

    function touchmoved() {
      var touches = event.changedTouches,
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          noevent();
          gesture("drag");
        }
      }
    }

    function touchended() {
      var touches = event.changedTouches,
          n = touches.length, i, gesture;

      if (touchending) clearTimeout(touchending);
      touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          nopropagation();
          gesture("end");
        }
      }
    }

    function beforestart(id, container, point, that, args) {
      var p = point(container, id), s, dx, dy,
          sublisteners = listeners.copy();

      if (!customEvent(new DragEvent(drag, "beforestart", s, id, active, p[0], p[1], 0, 0, sublisteners), function() {
        if ((event.subject = s = subject.apply(that, args)) == null) return false;
        dx = s.x - p[0] || 0;
        dy = s.y - p[1] || 0;
        return true;
      })) return;

      return function gesture(type) {
        var p0 = p, n;
        switch (type) {
          case "start": gestures[id] = gesture, n = active++; break;
          case "end": delete gestures[id], --active; // nobreak
          case "drag": p = point(container, id), n = active; break;
        }
        customEvent(new DragEvent(drag, type, s, id, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], sublisteners), sublisteners.apply, sublisteners, [type, that, args]);
      };
    }

    drag.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant$1(!!_), drag) : filter;
    };

    drag.container = function(_) {
      return arguments.length ? (container = typeof _ === "function" ? _ : constant$1(_), drag) : container;
    };

    drag.subject = function(_) {
      return arguments.length ? (subject = typeof _ === "function" ? _ : constant$1(_), drag) : subject;
    };

    drag.touchable = function(_) {
      return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$1(!!_), drag) : touchable;
    };

    drag.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? drag : value;
    };

    drag.clickDistance = function(_) {
      return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
    };

    return drag;
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
      reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
      reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
      reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
      reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
      reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    copy: function(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable: function() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return "#" + hex(this.r) + hex(this.g) + hex(this.b);
  }

  function rgb_formatRgb() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }

  function hex(value) {
    value = Math.max(0, Math.min(255, Math.round(value) || 0));
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "hsl(" : "hsla(")
          + (this.h || 0) + ", "
          + (this.s || 0) * 100 + "%, "
          + (this.l || 0) * 100 + "%"
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  function constant$2(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant$2(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function numberArray(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0,
        c = b.slice(),
        i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }

  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(na),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = interpolate(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function interpolate(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant$2(b)
        : (t === "number" ? interpolateNumber
        : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
        : b instanceof color ? interpolateRgb
        : b instanceof Date ? date
        : isNumberArray(b) ? numberArray
        : Array.isArray(b) ? genericArray
        : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
        : interpolateNumber)(a, b);
  }

  var degrees = 180 / Math.PI;

  var identity$1 = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var cssNode,
      cssRoot,
      cssView,
      svgNode;

  function parseCss(value) {
    if (value === "none") return identity$1;
    if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
    cssNode.style.transform = value;
    value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
    cssRoot.removeChild(cssNode);
    value = value.slice(7, -1).split(",");
    return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
  }

  function parseSvg(value) {
    if (value == null) return identity$1;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var frame = 0, // is an animation frame pending?
      timeout = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout$1(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(function(elapsed) {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "cancel", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set$1(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }

  function get$1(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout$1(start);

        // Interrupt the active transition, if any.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions.
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout$1(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(node, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set$1(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set$1(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get$1(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set$1(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get$1(node, id).value[name];
    };
  }

  function interpolate$1(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color ? interpolateRgb
        : (c = color(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrConstantNS$1(fullname, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function attrFunctionNS$1(fullname, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function transition_attr(name, value) {
    var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate$1;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
  }

  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }

  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }

  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get$1(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set$1(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set$1(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get$1(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set$1(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get$1(this.node(), id).ease;
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set$1;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get$1(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection$1 = selection.prototype.constructor;

  function transition_selection() {
    return new Selection$1(this._groups, this._parents);
  }

  function styleNull(name, interpolate) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }

  function styleRemove$1(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function styleFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          value1 = value(this),
          string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function styleMaybeRemove(id, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
    return function() {
      var schedule = set$1(this, id),
          on = schedule.on,
          listener = schedule.value[key] == null ? remove || (remove = styleRemove$1(name)) : undefined;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

      schedule.on = on1;
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate$1;
    return value == null ? this
        .styleTween(name, styleNull(name, i))
        .on("end.style." + name, styleRemove$1(name))
      : typeof value === "function" ? this
        .styleTween(name, styleFunction$1(name, i, tweenValue(this, "style." + name, value)))
        .each(styleMaybeRemove(this._id, name))
      : this
        .styleTween(name, styleConstant$1(name, i, value), priority)
        .on("end.style." + name, null);
  }

  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }

  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction$1(tweenValue(this, "text", value))
        : textConstant$1(value == null ? "" : value + ""));
  }

  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }

  function textTween(value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_textTween(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, textTween(value));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get$1(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  function transition_end() {
    var on0, on1, that = this, id = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = {value: reject},
          end = {value: function() { if (--size === 0) resolve(); }};

      that.each(function() {
        var schedule = set$1(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }

        schedule.on = on1;
      });
    });
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function transition(name) {
    return selection().transition(name);
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    textTween: transition_textTween,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease,
    end: transition_end
  };

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        return defaultTiming.time = now(), defaultTiming;
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  function constant$3(x) {
    return function() {
      return x;
    };
  }

  function BrushEvent(target, type, selection) {
    this.target = target;
    this.type = type;
    this.selection = selection;
  }

  function nopropagation$1() {
    event.stopImmediatePropagation();
  }

  function noevent$1() {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  var MODE_DRAG = {name: "drag"},
      MODE_SPACE = {name: "space"},
      MODE_HANDLE = {name: "handle"},
      MODE_CENTER = {name: "center"};

  function number1(e) {
    return [+e[0], +e[1]];
  }

  function number2(e) {
    return [number1(e[0]), number1(e[1])];
  }

  function toucher(identifier) {
    return function(target) {
      return touch(target, event.touches, identifier);
    };
  }

  var X = {
    name: "x",
    handles: ["w", "e"].map(type),
    input: function(x, e) { return x == null ? null : [[+x[0], e[0][1]], [+x[1], e[1][1]]]; },
    output: function(xy) { return xy && [xy[0][0], xy[1][0]]; }
  };

  var Y = {
    name: "y",
    handles: ["n", "s"].map(type),
    input: function(y, e) { return y == null ? null : [[e[0][0], +y[0]], [e[1][0], +y[1]]]; },
    output: function(xy) { return xy && [xy[0][1], xy[1][1]]; }
  };

  var cursors = {
    overlay: "crosshair",
    selection: "move",
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };

  var flipX = {
    e: "w",
    w: "e",
    nw: "ne",
    ne: "nw",
    se: "sw",
    sw: "se"
  };

  var flipY = {
    n: "s",
    s: "n",
    nw: "sw",
    ne: "se",
    se: "ne",
    sw: "nw"
  };

  var signsX = {
    overlay: +1,
    selection: +1,
    n: null,
    e: +1,
    s: null,
    w: -1,
    nw: -1,
    ne: +1,
    se: +1,
    sw: -1
  };

  var signsY = {
    overlay: +1,
    selection: +1,
    n: -1,
    e: null,
    s: +1,
    w: null,
    nw: -1,
    ne: -1,
    se: +1,
    sw: +1
  };

  function type(t) {
    return {type: t};
  }

  // Ignore right-click, since that should open the context menu.
  function defaultFilter$1() {
    return !event.ctrlKey && !event.button;
  }

  function defaultExtent() {
    var svg = this.ownerSVGElement || this;
    if (svg.hasAttribute("viewBox")) {
      svg = svg.viewBox.baseVal;
      return [[svg.x, svg.y], [svg.x + svg.width, svg.y + svg.height]];
    }
    return [[0, 0], [svg.width.baseVal.value, svg.height.baseVal.value]];
  }

  function defaultTouchable$1() {
    return navigator.maxTouchPoints || ("ontouchstart" in this);
  }

  // Like d3.local, but with the name “__brush” rather than auto-generated.
  function local(node) {
    while (!node.__brush) if (!(node = node.parentNode)) return;
    return node.__brush;
  }

  function empty$1(extent) {
    return extent[0][0] === extent[1][0]
        || extent[0][1] === extent[1][1];
  }

  function brushX() {
    return brush(X);
  }

  function brush(dim) {
    var extent = defaultExtent,
        filter = defaultFilter$1,
        touchable = defaultTouchable$1,
        keys = true,
        listeners = dispatch("start", "brush", "end"),
        handleSize = 6,
        touchending;

    function brush(group) {
      var overlay = group
          .property("__brush", initialize)
        .selectAll(".overlay")
        .data([type("overlay")]);

      overlay.enter().append("rect")
          .attr("class", "overlay")
          .attr("pointer-events", "all")
          .attr("cursor", cursors.overlay)
        .merge(overlay)
          .each(function() {
            var extent = local(this).extent;
            select(this)
                .attr("x", extent[0][0])
                .attr("y", extent[0][1])
                .attr("width", extent[1][0] - extent[0][0])
                .attr("height", extent[1][1] - extent[0][1]);
          });

      group.selectAll(".selection")
        .data([type("selection")])
        .enter().append("rect")
          .attr("class", "selection")
          .attr("cursor", cursors.selection)
          .attr("fill", "#777")
          .attr("fill-opacity", 0.3)
          .attr("stroke", "#fff")
          .attr("shape-rendering", "crispEdges");

      var handle = group.selectAll(".handle")
        .data(dim.handles, function(d) { return d.type; });

      handle.exit().remove();

      handle.enter().append("rect")
          .attr("class", function(d) { return "handle handle--" + d.type; })
          .attr("cursor", function(d) { return cursors[d.type]; });

      group
          .each(redraw)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("mousedown.brush", started)
        .filter(touchable)
          .on("touchstart.brush", started)
          .on("touchmove.brush", touchmoved)
          .on("touchend.brush touchcancel.brush", touchended)
          .style("touch-action", "none")
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }

    brush.move = function(group, selection) {
      if (group.selection) {
        group
            .on("start.brush", function() { emitter(this, arguments).beforestart().start(); })
            .on("interrupt.brush end.brush", function() { emitter(this, arguments).end(); })
            .tween("brush", function() {
              var that = this,
                  state = that.__brush,
                  emit = emitter(that, arguments),
                  selection0 = state.selection,
                  selection1 = dim.input(typeof selection === "function" ? selection.apply(this, arguments) : selection, state.extent),
                  i = interpolate(selection0, selection1);

              function tween(t) {
                state.selection = t === 1 && selection1 === null ? null : i(t);
                redraw.call(that);
                emit.brush();
              }

              return selection0 !== null && selection1 !== null ? tween : tween(1);
            });
      } else {
        group
            .each(function() {
              var that = this,
                  args = arguments,
                  state = that.__brush,
                  selection1 = dim.input(typeof selection === "function" ? selection.apply(that, args) : selection, state.extent),
                  emit = emitter(that, args).beforestart();

              interrupt(that);
              state.selection = selection1 === null ? null : selection1;
              redraw.call(that);
              emit.start().brush().end();
            });
      }
    };

    brush.clear = function(group) {
      brush.move(group, null);
    };

    function redraw() {
      var group = select(this),
          selection = local(this).selection;

      if (selection) {
        group.selectAll(".selection")
            .style("display", null)
            .attr("x", selection[0][0])
            .attr("y", selection[0][1])
            .attr("width", selection[1][0] - selection[0][0])
            .attr("height", selection[1][1] - selection[0][1]);

        group.selectAll(".handle")
            .style("display", null)
            .attr("x", function(d) { return d.type[d.type.length - 1] === "e" ? selection[1][0] - handleSize / 2 : selection[0][0] - handleSize / 2; })
            .attr("y", function(d) { return d.type[0] === "s" ? selection[1][1] - handleSize / 2 : selection[0][1] - handleSize / 2; })
            .attr("width", function(d) { return d.type === "n" || d.type === "s" ? selection[1][0] - selection[0][0] + handleSize : handleSize; })
            .attr("height", function(d) { return d.type === "e" || d.type === "w" ? selection[1][1] - selection[0][1] + handleSize : handleSize; });
      }

      else {
        group.selectAll(".selection,.handle")
            .style("display", "none")
            .attr("x", null)
            .attr("y", null)
            .attr("width", null)
            .attr("height", null);
      }
    }

    function emitter(that, args, clean) {
      return (!clean && that.__brush.emitter) || new Emitter(that, args);
    }

    function Emitter(that, args) {
      this.that = that;
      this.args = args;
      this.state = that.__brush;
      this.active = 0;
    }

    Emitter.prototype = {
      beforestart: function() {
        if (++this.active === 1) this.state.emitter = this, this.starting = true;
        return this;
      },
      start: function() {
        if (this.starting) this.starting = false, this.emit("start");
        else this.emit("brush");
        return this;
      },
      brush: function() {
        this.emit("brush");
        return this;
      },
      end: function() {
        if (--this.active === 0) delete this.state.emitter, this.emit("end");
        return this;
      },
      emit: function(type) {
        customEvent(new BrushEvent(brush, type, dim.output(this.state.selection)), listeners.apply, listeners, [type, this.that, this.args]);
      }
    };

    function started() {
      if (touchending && !event.touches) return;
      if (!filter.apply(this, arguments)) return;

      var that = this,
          type = event.target.__data__.type,
          mode = (keys && event.metaKey ? type = "overlay" : type) === "selection" ? MODE_DRAG : (keys && event.altKey ? MODE_CENTER : MODE_HANDLE),
          signX = dim === Y ? null : signsX[type],
          signY = dim === X ? null : signsY[type],
          state = local(that),
          extent = state.extent,
          selection = state.selection,
          W = extent[0][0], w0, w1,
          N = extent[0][1], n0, n1,
          E = extent[1][0], e0, e1,
          S = extent[1][1], s0, s1,
          dx = 0,
          dy = 0,
          moving,
          shifting = signX && signY && keys && event.shiftKey,
          lockX,
          lockY,
          pointer = event.touches ? toucher(event.changedTouches[0].identifier) : mouse,
          point0 = pointer(that),
          point = point0,
          emit = emitter(that, arguments, true).beforestart();

      if (type === "overlay") {
        if (selection) moving = true;
        state.selection = selection = [
          [w0 = dim === Y ? W : point0[0], n0 = dim === X ? N : point0[1]],
          [e0 = dim === Y ? E : w0, s0 = dim === X ? S : n0]
        ];
      } else {
        w0 = selection[0][0];
        n0 = selection[0][1];
        e0 = selection[1][0];
        s0 = selection[1][1];
      }

      w1 = w0;
      n1 = n0;
      e1 = e0;
      s1 = s0;

      var group = select(that)
          .attr("pointer-events", "none");

      var overlay = group.selectAll(".overlay")
          .attr("cursor", cursors[type]);

      if (event.touches) {
        emit.moved = moved;
        emit.ended = ended;
      } else {
        var view = select(event.view)
            .on("mousemove.brush", moved, true)
            .on("mouseup.brush", ended, true);
        if (keys) view
            .on("keydown.brush", keydowned, true)
            .on("keyup.brush", keyupped, true);

        dragDisable(event.view);
      }

      nopropagation$1();
      interrupt(that);
      redraw.call(that);
      emit.start();

      function moved() {
        var point1 = pointer(that);
        if (shifting && !lockX && !lockY) {
          if (Math.abs(point1[0] - point[0]) > Math.abs(point1[1] - point[1])) lockY = true;
          else lockX = true;
        }
        point = point1;
        moving = true;
        noevent$1();
        move();
      }

      function move() {
        var t;

        dx = point[0] - point0[0];
        dy = point[1] - point0[1];

        switch (mode) {
          case MODE_SPACE:
          case MODE_DRAG: {
            if (signX) dx = Math.max(W - w0, Math.min(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
            if (signY) dy = Math.max(N - n0, Math.min(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
            break;
          }
          case MODE_HANDLE: {
            if (signX < 0) dx = Math.max(W - w0, Math.min(E - w0, dx)), w1 = w0 + dx, e1 = e0;
            else if (signX > 0) dx = Math.max(W - e0, Math.min(E - e0, dx)), w1 = w0, e1 = e0 + dx;
            if (signY < 0) dy = Math.max(N - n0, Math.min(S - n0, dy)), n1 = n0 + dy, s1 = s0;
            else if (signY > 0) dy = Math.max(N - s0, Math.min(S - s0, dy)), n1 = n0, s1 = s0 + dy;
            break;
          }
          case MODE_CENTER: {
            if (signX) w1 = Math.max(W, Math.min(E, w0 - dx * signX)), e1 = Math.max(W, Math.min(E, e0 + dx * signX));
            if (signY) n1 = Math.max(N, Math.min(S, n0 - dy * signY)), s1 = Math.max(N, Math.min(S, s0 + dy * signY));
            break;
          }
        }

        if (e1 < w1) {
          signX *= -1;
          t = w0, w0 = e0, e0 = t;
          t = w1, w1 = e1, e1 = t;
          if (type in flipX) overlay.attr("cursor", cursors[type = flipX[type]]);
        }

        if (s1 < n1) {
          signY *= -1;
          t = n0, n0 = s0, s0 = t;
          t = n1, n1 = s1, s1 = t;
          if (type in flipY) overlay.attr("cursor", cursors[type = flipY[type]]);
        }

        if (state.selection) selection = state.selection; // May be set by brush.move!
        if (lockX) w1 = selection[0][0], e1 = selection[1][0];
        if (lockY) n1 = selection[0][1], s1 = selection[1][1];

        if (selection[0][0] !== w1
            || selection[0][1] !== n1
            || selection[1][0] !== e1
            || selection[1][1] !== s1) {
          state.selection = [[w1, n1], [e1, s1]];
          redraw.call(that);
          emit.brush();
        }
      }

      function ended() {
        nopropagation$1();
        if (event.touches) {
          if (event.touches.length) return;
          if (touchending) clearTimeout(touchending);
          touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
        } else {
          yesdrag(event.view, moving);
          view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null);
        }
        group.attr("pointer-events", "all");
        overlay.attr("cursor", cursors.overlay);
        if (state.selection) selection = state.selection; // May be set by brush.move (on start)!
        if (empty$1(selection)) state.selection = null, redraw.call(that);
        emit.end();
      }

      function keydowned() {
        switch (event.keyCode) {
          case 16: { // SHIFT
            shifting = signX && signY;
            break;
          }
          case 18: { // ALT
            if (mode === MODE_HANDLE) {
              if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
              if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
              mode = MODE_CENTER;
              move();
            }
            break;
          }
          case 32: { // SPACE; takes priority over ALT
            if (mode === MODE_HANDLE || mode === MODE_CENTER) {
              if (signX < 0) e0 = e1 - dx; else if (signX > 0) w0 = w1 - dx;
              if (signY < 0) s0 = s1 - dy; else if (signY > 0) n0 = n1 - dy;
              mode = MODE_SPACE;
              overlay.attr("cursor", cursors.selection);
              move();
            }
            break;
          }
          default: return;
        }
        noevent$1();
      }

      function keyupped() {
        switch (event.keyCode) {
          case 16: { // SHIFT
            if (shifting) {
              lockX = lockY = shifting = false;
              move();
            }
            break;
          }
          case 18: { // ALT
            if (mode === MODE_CENTER) {
              if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
              if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
              mode = MODE_HANDLE;
              move();
            }
            break;
          }
          case 32: { // SPACE
            if (mode === MODE_SPACE) {
              if (event.altKey) {
                if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                mode = MODE_CENTER;
              } else {
                if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
                if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
                mode = MODE_HANDLE;
              }
              overlay.attr("cursor", cursors[type]);
              move();
            }
            break;
          }
          default: return;
        }
        noevent$1();
      }
    }

    function touchmoved() {
      emitter(this, arguments).moved();
    }

    function touchended() {
      emitter(this, arguments).ended();
    }

    function initialize() {
      var state = this.__brush || {selection: null};
      state.extent = number2(extent.apply(this, arguments));
      state.dim = dim;
      return state;
    }

    brush.extent = function(_) {
      return arguments.length ? (extent = typeof _ === "function" ? _ : constant$3(number2(_)), brush) : extent;
    };

    brush.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant$3(!!_), brush) : filter;
    };

    brush.touchable = function(_) {
      return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$3(!!_), brush) : touchable;
    };

    brush.handleSize = function(_) {
      return arguments.length ? (handleSize = +_, brush) : handleSize;
    };

    brush.keyModifiers = function(_) {
      return arguments.length ? (keys = !!_, brush) : keys;
    };

    brush.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? brush : value;
    };

    return brush;
  }

  var prefix = "$";

  function Map$1() {}

  Map$1.prototype = map.prototype = {
    constructor: Map$1,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map(object, f) {
    var map = new Map$1;

    // Copy constructor.
    if (object instanceof Map$1) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function nest() {
    var keys = [],
        sortKeys = [],
        sortValues,
        rollup,
        nest;

    function apply(array, depth, createResult, setResult) {
      if (depth >= keys.length) {
        if (sortValues != null) array.sort(sortValues);
        return rollup != null ? rollup(array) : array;
      }

      var i = -1,
          n = array.length,
          key = keys[depth++],
          keyValue,
          value,
          valuesByKey = map(),
          values,
          result = createResult();

      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
          values.push(value);
        } else {
          valuesByKey.set(keyValue, [value]);
        }
      }

      valuesByKey.each(function(values, key) {
        setResult(result, key, apply(values, depth, createResult, setResult));
      });

      return result;
    }

    function entries(map, depth) {
      if (++depth > keys.length) return map;
      var array, sortKey = sortKeys[depth - 1];
      if (rollup != null && depth >= keys.length) array = map.entries();
      else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
      return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
    }

    return nest = {
      object: function(array) { return apply(array, 0, createObject, setObject); },
      map: function(array) { return apply(array, 0, createMap, setMap); },
      entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
      key: function(d) { keys.push(d); return nest; },
      sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
      sortValues: function(order) { sortValues = order; return nest; },
      rollup: function(f) { rollup = f; return nest; }
    };
  }

  function createObject() {
    return {};
  }

  function setObject(object, key, value) {
    object[key] = value;
  }

  function createMap() {
    return map();
  }

  function setMap(map, key, value) {
    map.set(key, value);
  }

  function Set() {}

  var proto = map.prototype;

  Set.prototype = set$2.prototype = {
    constructor: Set,
    has: proto.has,
    add: function(value) {
      value += "";
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each
  };

  function set$2(object, f) {
    var set = new Set;

    // Copy constructor.
    if (object instanceof Set) object.each(function(value) { set.add(value); });

    // Otherwise, assume it’s an array.
    else if (object) {
      var i = -1, n = object.length;
      if (f == null) while (++i < n) set.add(object[i]);
      else while (++i < n) set.add(f(object[i], i, object));
    }

    return set;
  }

  var initialRadius = 10,
      initialAngle = Math.PI * (3 - Math.sqrt(5));

  function forceSimulation(nodes) {
    var simulation,
        alpha = 1,
        alphaMin = 0.001,
        alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
        alphaTarget = 0,
        velocityDecay = 0.6,
        forces = new Map(),
        stepper = timer(step),
        event = dispatch("tick", "end");

    if (nodes == null) nodes = [];

    function step() {
      tick();
      event.call("tick", simulation);
      if (alpha < alphaMin) {
        stepper.stop();
        event.call("end", simulation);
      }
    }

    function tick(iterations) {
      var i, n = nodes.length, node;

      if (iterations === undefined) iterations = 1;

      for (var k = 0; k < iterations; ++k) {
        alpha += (alphaTarget - alpha) * alphaDecay;

        forces.forEach(function(force) {
          force(alpha);
        });

        for (i = 0; i < n; ++i) {
          node = nodes[i];
          if (node.fx == null) node.x += node.vx *= velocityDecay;
          else node.x = node.fx, node.vx = 0;
          if (node.fy == null) node.y += node.vy *= velocityDecay;
          else node.y = node.fy, node.vy = 0;
        }
      }

      return simulation;
    }

    function initializeNodes() {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.index = i;
        if (node.fx != null) node.x = node.fx;
        if (node.fy != null) node.y = node.fy;
        if (isNaN(node.x) || isNaN(node.y)) {
          var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
          node.x = radius * Math.cos(angle);
          node.y = radius * Math.sin(angle);
        }
        if (isNaN(node.vx) || isNaN(node.vy)) {
          node.vx = node.vy = 0;
        }
      }
    }

    function initializeForce(force) {
      if (force.initialize) force.initialize(nodes);
      return force;
    }

    initializeNodes();

    return simulation = {
      tick: tick,

      restart: function() {
        return stepper.restart(step), simulation;
      },

      stop: function() {
        return stepper.stop(), simulation;
      },

      nodes: function(_) {
        return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
      },

      alpha: function(_) {
        return arguments.length ? (alpha = +_, simulation) : alpha;
      },

      alphaMin: function(_) {
        return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
      },

      alphaDecay: function(_) {
        return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
      },

      alphaTarget: function(_) {
        return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
      },

      velocityDecay: function(_) {
        return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
      },

      force: function(name, _) {
        return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
      },

      find: function(x, y, radius) {
        var i = 0,
            n = nodes.length,
            dx,
            dy,
            d2,
            node,
            closest;

        if (radius == null) radius = Infinity;
        else radius *= radius;

        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dx = x - node.x;
          dy = y - node.y;
          d2 = dx * dx + dy * dy;
          if (d2 < radius) closest = node, radius = d2;
        }

        return closest;
      },

      on: function(name, _) {
        return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
      }
    };
  }

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimal(1.23) returns ["123", 0].
  function formatDecimal(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatNumerals(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }

  formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
    this.align = specifier.align === undefined ? ">" : specifier.align + "";
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === undefined ? undefined : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === undefined ? "" : specifier.type + "";
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width === undefined ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
        + (this.trim ? "~" : "")
        + this.type;
  };

  // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
  function formatTrim(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": function(x) { return Math.round(x).toString(10); },
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  function identity$2(x) {
    return x;
  }

  var map$1 = Array.prototype.map,
      prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function formatLocale(locale) {
    var group = locale.grouping === undefined || locale.thousands === undefined ? identity$2 : formatGroup(map$1.call(locale.grouping, Number), locale.thousands + ""),
        currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
        currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
        decimal = locale.decimal === undefined ? "." : locale.decimal + "",
        numerals = locale.numerals === undefined ? identity$2 : formatNumerals(map$1.call(locale.numerals, String)),
        percent = locale.percent === undefined ? "%" : locale.percent + "",
        minus = locale.minus === undefined ? "-" : locale.minus + "",
        nan = locale.nan === undefined ? "NaN" : locale.nan + "";

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // The "" type, and any invalid type, is an alias for ".12~g".
      else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision === undefined ? 6
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Determine the sign. -0 is not less than 0, but 1 / -0 is!
          var valueNegative = value < 0 || 1 / value < 0;

          // Perform the initial formatting.
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

          // Trim insignificant zeros.
          if (trim) value = formatTrim(value);

          // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": value = valuePrefix + value + valueSuffix + padding; break;
          case "=": value = valuePrefix + padding + value + valueSuffix; break;
          case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
          default: value = padding + valuePrefix + value + valueSuffix; break;
        }

        return numerals(value);
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale;
  var format;
  var formatPrefix;

  defaultLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-"
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  var t0 = new Date,
      t1 = new Date;

  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
    }

    interval.floor = function(date) {
      return floori(date = new Date(+date)), date;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };

    interval.round = function(date) {
      var d0 = interval(date),
          d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [], previous;
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
      while (previous < start && start < stop);
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
          } else while (--step >= 0) {
            while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
          }
        }
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  }

  var durationMinute = 6e4;
  var durationDay = 864e5;
  var durationWeek = 6048e5;

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var year = newInterval(function(date) {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  year.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / durationDay;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / durationWeek;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcYear = newInterval(function(date) {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newDate(y, m, d) {
    return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
  }

  function formatLocale$1(locale) {
    var locale_dateTime = locale.dateTime,
        locale_date = locale.date,
        locale_time = locale.time,
        locale_periods = locale.periods,
        locale_weekdays = locale.days,
        locale_shortWeekdays = locale.shortDays,
        locale_months = locale.months,
        locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
        periodLookup = formatLookup(locale_periods),
        weekdayRe = formatRe(locale_weekdays),
        weekdayLookup = formatLookup(locale_weekdays),
        shortWeekdayRe = formatRe(locale_shortWeekdays),
        shortWeekdayLookup = formatLookup(locale_shortWeekdays),
        monthRe = formatRe(locale_months),
        monthLookup = formatLookup(locale_months),
        shortMonthRe = formatRe(locale_shortMonths),
        shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };

    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };

    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function(date) {
        var string = [],
            i = -1,
            j = 0,
            n = specifier.length,
            c,
            pad,
            format;

        if (!(date instanceof Date)) date = new Date(+date);

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad = c === "e" ? " " : "0";
            if (format = formats[c]) c = format(date, pad);
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }

    function newParse(specifier, Z) {
      return function(string) {
        var d = newDate(1900, undefined, 1),
            i = parseSpecifier(d, specifier, string += "", 0),
            week, day$1;
        if (i != string.length) return null;

        // If a UNIX timestamp is specified, return it.
        if ("Q" in d) return new Date(d.Q);
        if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

        // If this is utcParse, never use the local timezone.
        if (Z && !("Z" in d)) d.Z = 0;

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ("p" in d) d.H = d.H % 12 + d.p * 12;

        // If the month was not specified, inherit from the quarter.
        if (d.m === undefined) d.m = "q" in d ? d.q : 0;

        // Convert day-of-week and week-of-year to day-of-year.
        if ("V" in d) {
          if (d.V < 1 || d.V > 53) return null;
          if (!("w" in d)) d.w = 1;
          if ("Z" in d) {
            week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
            week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
            week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
            week = day.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
          day$1 = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return localDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
          n = specifier.length,
          m = string.length,
          c,
          parse;

      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }

    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() { return specifier; };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", false);
        p.toString = function() { return specifier; };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() { return specifier; };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier += "", true);
        p.toString = function() { return specifier; };
        return p;
      }
    };
  }

  var pads = {"-": "", "_": " ", "0": "0"},
      numberRe = /^\s*\d+/, // note: ignores next directive
      percentRe = /^%/,
      requoteRe = /[\\^$*+?|[\]().{}]/g;

  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "",
        string = (sign ? -value : value) + "",
        length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }

  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }

  function formatLookup(names) {
    var map = {}, i = -1, n = names.length;
    while (++i < n) map[names[i].toLowerCase()] = i;
    return map;
  }

  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }

  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }

  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + day.count(year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + "000";
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function formatWeekNumberSunday(d, p) {
    return pad(sunday.count(year(d) - 1, d), p, 2);
  }

  function formatWeekNumberISO(d, p) {
    var day = d.getDay();
    d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
    return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
  }

  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(monday.count(year(d) - 1, d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+"))
        + pad(z / 60 | 0, "0", 2)
        + pad(z % 60, "0", 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + "000";
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }

  function formatUTCWeekNumberISO(d, p) {
    var day = d.getUTCDay();
    d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
    return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }

  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return "+0000";
  }

  function formatLiteralPercent() {
    return "%";
  }

  function formatUnixTimestamp(d) {
    return +d;
  }

  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1000);
  }

  var locale$1;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;

  defaultLocale$1({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  function defaultLocale$1(definition) {
    locale$1 = formatLocale$1(definition);
    timeFormat = locale$1.format;
    timeParse = locale$1.parse;
    utcFormat = locale$1.utcFormat;
    utcParse = locale$1.utcParse;
    return locale$1;
  }

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  var _d = require('d3');

  var _d2 = _interopRequireDefault(_d);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  // Implementation derived from http://bl.ocks.org/dbuezas/9306799.

  /**
   * Default config.
   */

  var defaults = {
    // target element or selector to contain the svg
    target: '#chart',

    // width of chart
    width: 500,

    // height of chart
    height: 250,

    // transition easing function
    ease: 'linear',

    // transition duration
    duration: 600,

    // donut thickness
    thickness: 50,

    // label accessor function
    label: function label(d) {
      return d.data.label;
    },

    // color range
    color: ['RGB(0, 177, 240)', 'rgb(243, 43, 101)'],

    // color interpolation
    colorInterpolate: _d2.default.interpolateHsl
  };

  /**
   * Mid angle.
   */

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  /**
   * PieChart.
   */

  var PieChart = function () {

    /**
     * Construct with the given `config`.
     */

    function PieChart(config) {
      _classCallCheck(this, PieChart);

      this.set(config);
      this.init();
    }

    /**
     * Set configuration options.
     */

    _createClass(PieChart, [{
      key: 'set',
      value: function set(config) {
        Object.assign(this, defaults, config);
      }

      /**
       * Initialize the chart.
       */

    }, {
      key: 'init',
      value: function init() {
        var target = this.target;
        var width = this.width;
        var height = this.height;
        var thickness = this.thickness;
        var color = this.color;
        var colorInterpolate = this.colorInterpolate;


        this.radius = Math.min(width, height) / 2;

        this.chart = _d2.default.select(target).attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + width / 2 + ', ' + height / 2 + ')');

        this.chart.append('g').attr('class', 'slices');

        this.chart.append('g').attr('class', 'labels');

        this.chart.append('g').attr('class', 'lines');

        this.pie = _d2.default.layout.pie().value(function (d) {
          return d.value;
        });

        this.innerArc = _d2.default.svg.arc().outerRadius((this.radius - thickness) * 0.7).innerRadius(this.radius * 0.7);

        this.outerArc = _d2.default.svg.arc().innerRadius(this.radius * 0.8).outerRadius(this.radius * 0.8);

        this.color = _d2.default.scale.linear().interpolate(colorInterpolate).range(color);
      }

      /**
       * Render slices.
       */

    }, {
      key: 'renderSlices',
      value: function renderSlices(data) {
        var chart = this.chart;
        var color = this.color;
        var pie = this.pie;
        var innerArc = this.innerArc;
        var outerArc = this.outerArc;
        var duration = this.duration;
        var ease = this.ease;


        color.domain([0, data.length]);

        var slice = chart.select('.slices').selectAll('path.slice').data(pie(data), function (d) {
          return d.data.label;
        });

        slice.enter().insert('path').attr('class', 'slice').style('fill', function (d, i) {
          return color(i);
        });

        slice.transition().duration(duration).ease(ease).attrTween('d', function (d) {
          this._current = this._current || d;
          var interpolate = _d2.default.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            return innerArc(interpolate(t));
          };
        });

        slice.exit().remove();
      }

      /**
       * Render slice labels.
       */

    }, {
      key: 'renderLabels',
      value: function renderLabels(data) {
        var chart = this.chart;
        var pie = this.pie;
        var outerArc = this.outerArc;
        var radius = this.radius;
        var label = this.label;
        var duration = this.duration;
        var ease = this.ease;


        var text = chart.select('.labels').selectAll('text').data(pie(data), function (d) {
          return d.data.label;
        });

        text.enter().append('text').attr('dy', '.35em').text(label);

        text.transition().duration(duration).ease(ease).attrTween('transform', function (d) {
          this._current = this._current || d;
          var interpolate = _d2.default.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            var pos = outerArc.centroid(d2);
            pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
          };
        }).styleTween('text-anchor', function (d) {
          this._current = this._current || d;
          var interpolate = _d2.default.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            return midAngle(d2) < Math.PI ? 'start' : 'end';
          };
        });

        text.exit().remove();
      }

      /**
       * Render label lines.
       */

    }, {
      key: 'renderLines',
      value: function renderLines(data) {
        var chart = this.chart;
        var pie = this.pie;
        var innerArc = this.innerArc;
        var outerArc = this.outerArc;
        var radius = this.radius;
        var duration = this.duration;
        var ease = this.ease;


        var polyline = chart.select('.lines').selectAll('polyline').data(pie(data), function (d) {
          return d.data.label;
        });

        polyline.enter().append('polyline');

        polyline.transition().duration(duration).ease(ease).attrTween('points', function (d) {
          this._current = this._current || d;
          var interpolate = _d2.default.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            var pos = outerArc.centroid(d2);
            pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
            return [innerArc.centroid(d2), outerArc.centroid(d2), pos];
          };
        });

        polyline.exit().remove();
      }

      /**
       * Render the chart against the given `data` which takes
       * an array of objects with a `.label` and numeric `.value`.
       */

    }, {
      key: 'render',
      value: function render(data) {
        this.renderSlices(data);
        this.renderLabels(data);
        this.renderLines(data);
      }

      /**
       * Update the chart against the given `data`.
       */

    }, {
      key: 'update',
      value: function update(data) {
        this.render(data);
      }
    }]);

    return PieChart;
  }();

  exports.default = PieChart;

  var pie = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  const epsilon$1 = 1e-6;

  class Path {
    constructor() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }
    moveTo(x, y) {
      this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
    }
    closePath() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    }
    lineTo(x, y) {
      this._ += `L${this._x1 = +x},${this._y1 = +y}`;
    }
    arc(x, y, r) {
      x = +x, y = +y, r = +r;
      const x0 = x + r;
      const y0 = y;
      if (r < 0) throw new Error("negative radius");
      if (this._x1 === null) this._ += `M${x0},${y0}`;
      else if (Math.abs(this._x1 - x0) > epsilon$1 || Math.abs(this._y1 - y0) > epsilon$1) this._ += "L" + x0 + "," + y0;
      if (!r) return;
      this._ += `A${r},${r},0,1,1,${x - r},${y}A${r},${r},0,1,1,${this._x1 = x0},${this._y1 = y0}`;
    }
    rect(x, y, w, h) {
      this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${+w}v${+h}h${-w}Z`;
    }
    value() {
      return this._ || null;
    }
  }

  class Polygon {
    constructor() {
      this._ = [];
    }
    moveTo(x, y) {
      this._.push([x, y]);
    }
    closePath() {
      this._.push(this._[0].slice());
    }
    lineTo(x, y) {
      this._.push([x, y]);
    }
    value() {
      return this._.length ? this._ : null;
    }
  }

  class Voronoi {
    constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
      if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
      this.delaunay = delaunay;
      this._circumcenters = new Float64Array(delaunay.points.length * 2);
      this.vectors = new Float64Array(delaunay.points.length * 2);
      this.xmax = xmax, this.xmin = xmin;
      this.ymax = ymax, this.ymin = ymin;
      this._init();
    }
    update() {
      this.delaunay.update();
      this._init();
      return this;
    }
    _init() {
      const {delaunay: {points, hull, triangles}, vectors} = this;

      // Compute circumcenters.
      const circumcenters = this.circumcenters = this._circumcenters.subarray(0, triangles.length / 3 * 2);
      for (let i = 0, j = 0, n = triangles.length, x, y; i < n; i += 3, j += 2) {
        const t1 = triangles[i] * 2;
        const t2 = triangles[i + 1] * 2;
        const t3 = triangles[i + 2] * 2;
        const x1 = points[t1];
        const y1 = points[t1 + 1];
        const x2 = points[t2];
        const y2 = points[t2 + 1];
        const x3 = points[t3];
        const y3 = points[t3 + 1];

        const dx = x2 - x1;
        const dy = y2 - y1;
        const ex = x3 - x1;
        const ey = y3 - y1;
        const bl = dx * dx + dy * dy;
        const cl = ex * ex + ey * ey;
        const ab = (dx * ey - dy * ex) * 2;

        if (!ab) {
          // degenerate case (collinear diagram)
          x = (x1 + x3) / 2 - 1e8 * ey;
          y = (y1 + y3) / 2 + 1e8 * ex;
        }
        else if (Math.abs(ab) < 1e-8) {
          // almost equal points (degenerate triangle)
          x = (x1 + x3) / 2;
          y = (y1 + y3) / 2;
        } else {
          const d = 1 / ab;
          x = x1 + (ey * bl - dy * cl) * d;
          y = y1 + (dx * cl - ex * bl) * d;
        }
        circumcenters[j] = x;
        circumcenters[j + 1] = y;
      }

      // Compute exterior cell rays.
      let h = hull[hull.length - 1];
      let p0, p1 = h * 4;
      let x0, x1 = points[2 * h];
      let y0, y1 = points[2 * h + 1];
      vectors.fill(0);
      for (let i = 0; i < hull.length; ++i) {
        h = hull[i];
        p0 = p1, x0 = x1, y0 = y1;
        p1 = h * 4, x1 = points[2 * h], y1 = points[2 * h + 1];
        vectors[p0 + 2] = vectors[p1] = y0 - y1;
        vectors[p0 + 3] = vectors[p1 + 1] = x1 - x0;
      }
    }
    render(context) {
      const buffer = context == null ? context = new Path : undefined;
      const {delaunay: {halfedges, inedges, hull}, circumcenters, vectors} = this;
      if (hull.length <= 1) return null;
      for (let i = 0, n = halfedges.length; i < n; ++i) {
        const j = halfedges[i];
        if (j < i) continue;
        const ti = Math.floor(i / 3) * 2;
        const tj = Math.floor(j / 3) * 2;
        const xi = circumcenters[ti];
        const yi = circumcenters[ti + 1];
        const xj = circumcenters[tj];
        const yj = circumcenters[tj + 1];
        this._renderSegment(xi, yi, xj, yj, context);
      }
      let h0, h1 = hull[hull.length - 1];
      for (let i = 0; i < hull.length; ++i) {
        h0 = h1, h1 = hull[i];
        const t = Math.floor(inedges[h1] / 3) * 2;
        const x = circumcenters[t];
        const y = circumcenters[t + 1];
        const v = h0 * 4;
        const p = this._project(x, y, vectors[v + 2], vectors[v + 3]);
        if (p) this._renderSegment(x, y, p[0], p[1], context);
      }
      return buffer && buffer.value();
    }
    renderBounds(context) {
      const buffer = context == null ? context = new Path : undefined;
      context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
      return buffer && buffer.value();
    }
    renderCell(i, context) {
      const buffer = context == null ? context = new Path : undefined;
      const points = this._clip(i);
      if (points === null || !points.length) return;
      context.moveTo(points[0], points[1]);
      let n = points.length;
      while (points[0] === points[n-2] && points[1] === points[n-1] && n > 1) n -= 2;
      for (let i = 2; i < n; i += 2) {
        if (points[i] !== points[i-2] || points[i+1] !== points[i-1])
          context.lineTo(points[i], points[i + 1]);
      }
      context.closePath();
      return buffer && buffer.value();
    }
    *cellPolygons() {
      const {delaunay: {points}} = this;
      for (let i = 0, n = points.length / 2; i < n; ++i) {
        const cell = this.cellPolygon(i);
        if (cell) cell.index = i, yield cell;
      }
    }
    cellPolygon(i) {
      const polygon = new Polygon;
      this.renderCell(i, polygon);
      return polygon.value();
    }
    _renderSegment(x0, y0, x1, y1, context) {
      let S;
      const c0 = this._regioncode(x0, y0);
      const c1 = this._regioncode(x1, y1);
      if (c0 === 0 && c1 === 0) {
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
      } else if (S = this._clipSegment(x0, y0, x1, y1, c0, c1)) {
        context.moveTo(S[0], S[1]);
        context.lineTo(S[2], S[3]);
      }
    }
    contains(i, x, y) {
      if ((x = +x, x !== x) || (y = +y, y !== y)) return false;
      return this.delaunay._step(i, x, y) === i;
    }
    *neighbors(i) {
      const ci = this._clip(i);
      if (ci) for (const j of this.delaunay.neighbors(i)) {
        const cj = this._clip(j);
        // find the common edge
        if (cj) loop: for (let ai = 0, li = ci.length; ai < li; ai += 2) {
          for (let aj = 0, lj = cj.length; aj < lj; aj += 2) {
            if (ci[ai] == cj[aj]
            && ci[ai + 1] == cj[aj + 1]
            && ci[(ai + 2) % li] == cj[(aj + lj - 2) % lj]
            && ci[(ai + 3) % li] == cj[(aj + lj - 1) % lj]
            ) {
              yield j;
              break loop;
            }
          }
        }
      }
    }
    _cell(i) {
      const {circumcenters, delaunay: {inedges, halfedges, triangles}} = this;
      const e0 = inedges[i];
      if (e0 === -1) return null; // coincident point
      const points = [];
      let e = e0;
      do {
        const t = Math.floor(e / 3);
        points.push(circumcenters[t * 2], circumcenters[t * 2 + 1]);
        e = e % 3 === 2 ? e - 2 : e + 1;
        if (triangles[e] !== i) break; // bad triangulation
        e = halfedges[e];
      } while (e !== e0 && e !== -1);
      return points;
    }
    _clip(i) {
      // degenerate case (1 valid point: return the box)
      if (i === 0 && this.delaunay.hull.length === 1) {
        return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
      }
      const points = this._cell(i);
      if (points === null) return null;
      const {vectors: V} = this;
      const v = i * 4;
      return V[v] || V[v + 1]
          ? this._clipInfinite(i, points, V[v], V[v + 1], V[v + 2], V[v + 3])
          : this._clipFinite(i, points);
    }
    _clipFinite(i, points) {
      const n = points.length;
      let P = null;
      let x0, y0, x1 = points[n - 2], y1 = points[n - 1];
      let c0, c1 = this._regioncode(x1, y1);
      let e0, e1;
      for (let j = 0; j < n; j += 2) {
        x0 = x1, y0 = y1, x1 = points[j], y1 = points[j + 1];
        c0 = c1, c1 = this._regioncode(x1, y1);
        if (c0 === 0 && c1 === 0) {
          e0 = e1, e1 = 0;
          if (P) P.push(x1, y1);
          else P = [x1, y1];
        } else {
          let S, sx0, sy0, sx1, sy1;
          if (c0 === 0) {
            if ((S = this._clipSegment(x0, y0, x1, y1, c0, c1)) === null) continue;
            [sx0, sy0, sx1, sy1] = S;
          } else {
            if ((S = this._clipSegment(x1, y1, x0, y0, c1, c0)) === null) continue;
            [sx1, sy1, sx0, sy0] = S;
            e0 = e1, e1 = this._edgecode(sx0, sy0);
            if (e0 && e1) this._edge(i, e0, e1, P, P.length);
            if (P) P.push(sx0, sy0);
            else P = [sx0, sy0];
          }
          e0 = e1, e1 = this._edgecode(sx1, sy1);
          if (e0 && e1) this._edge(i, e0, e1, P, P.length);
          if (P) P.push(sx1, sy1);
          else P = [sx1, sy1];
        }
      }
      if (P) {
        e0 = e1, e1 = this._edgecode(P[0], P[1]);
        if (e0 && e1) this._edge(i, e0, e1, P, P.length);
      } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
        return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
      }
      return P;
    }
    _clipSegment(x0, y0, x1, y1, c0, c1) {
      while (true) {
        if (c0 === 0 && c1 === 0) return [x0, y0, x1, y1];
        if (c0 & c1) return null;
        let x, y, c = c0 || c1;
        if (c & 0b1000) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax;
        else if (c & 0b0100) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin;
        else if (c & 0b0010) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax;
        else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin;
        if (c0) x0 = x, y0 = y, c0 = this._regioncode(x0, y0);
        else x1 = x, y1 = y, c1 = this._regioncode(x1, y1);
      }
    }
    _clipInfinite(i, points, vx0, vy0, vxn, vyn) {
      let P = Array.from(points), p;
      if (p = this._project(P[0], P[1], vx0, vy0)) P.unshift(p[0], p[1]);
      if (p = this._project(P[P.length - 2], P[P.length - 1], vxn, vyn)) P.push(p[0], p[1]);
      if (P = this._clipFinite(i, P)) {
        for (let j = 0, n = P.length, c0, c1 = this._edgecode(P[n - 2], P[n - 1]); j < n; j += 2) {
          c0 = c1, c1 = this._edgecode(P[j], P[j + 1]);
          if (c0 && c1) j = this._edge(i, c0, c1, P, j), n = P.length;
        }
      } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
        P = [this.xmin, this.ymin, this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax];
      }
      return P;
    }
    _edge(i, e0, e1, P, j) {
      while (e0 !== e1) {
        let x, y;
        switch (e0) {
          case 0b0101: e0 = 0b0100; continue; // top-left
          case 0b0100: e0 = 0b0110, x = this.xmax, y = this.ymin; break; // top
          case 0b0110: e0 = 0b0010; continue; // top-right
          case 0b0010: e0 = 0b1010, x = this.xmax, y = this.ymax; break; // right
          case 0b1010: e0 = 0b1000; continue; // bottom-right
          case 0b1000: e0 = 0b1001, x = this.xmin, y = this.ymax; break; // bottom
          case 0b1001: e0 = 0b0001; continue; // bottom-left
          case 0b0001: e0 = 0b0101, x = this.xmin, y = this.ymin; break; // left
        }
        if ((P[j] !== x || P[j + 1] !== y) && this.contains(i, x, y)) {
          P.splice(j, 0, x, y), j += 2;
        }
      }
      if (P.length > 4) {
        for (let i = 0; i < P.length; i+= 2) {
          const j = (i + 2) % P.length, k = (i + 4) % P.length;
          if (P[i] === P[j] && P[j] === P[k]
          || P[i + 1] === P[j + 1] && P[j + 1] === P[k + 1])
            P.splice(j, 2), i -= 2;
        }
      }
      return j;
    }
    _project(x0, y0, vx, vy) {
      let t = Infinity, c, x, y;
      if (vy < 0) { // top
        if (y0 <= this.ymin) return null;
        if ((c = (this.ymin - y0) / vy) < t) y = this.ymin, x = x0 + (t = c) * vx;
      } else if (vy > 0) { // bottom
        if (y0 >= this.ymax) return null;
        if ((c = (this.ymax - y0) / vy) < t) y = this.ymax, x = x0 + (t = c) * vx;
      }
      if (vx > 0) { // right
        if (x0 >= this.xmax) return null;
        if ((c = (this.xmax - x0) / vx) < t) x = this.xmax, y = y0 + (t = c) * vy;
      } else if (vx < 0) { // left
        if (x0 <= this.xmin) return null;
        if ((c = (this.xmin - x0) / vx) < t) x = this.xmin, y = y0 + (t = c) * vy;
      }
      return [x, y];
    }
    _edgecode(x, y) {
      return (x === this.xmin ? 0b0001
          : x === this.xmax ? 0b0010 : 0b0000)
          | (y === this.ymin ? 0b0100
          : y === this.ymax ? 0b1000 : 0b0000);
    }
    _regioncode(x, y) {
      return (x < this.xmin ? 0b0001
          : x > this.xmax ? 0b0010 : 0b0000)
          | (y < this.ymin ? 0b0100
          : y > this.ymax ? 0b1000 : 0b0000);
    }
  }

  function initRange(domain, range) {
    switch (arguments.length) {
      case 0: break;
      case 1: this.range(domain); break;
      default: this.range(range).domain(domain); break;
    }
    return this;
  }

  const implicit = Symbol("implicit");

  function ordinal() {
    var index = new Map(),
        domain = [],
        range = [],
        unknown = implicit;

    function scale(d) {
      var key = d + "", i = index.get(key);
      if (!i) {
        if (unknown !== implicit) return unknown;
        index.set(key, i = domain.push(d));
      }
      return range[(i - 1) % range.length];
    }

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [], index = new Map();
      for (const value of _) {
        const key = value + "";
        if (index.has(key)) continue;
        index.set(key, domain.push(value));
      }
      return scale;
    };

    scale.range = function(_) {
      return arguments.length ? (range = Array.from(_), scale) : range.slice();
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.copy = function() {
      return ordinal(domain, range).unknown(unknown);
    };

    initRange.apply(scale, arguments);

    return scale;
  }

  var pi = Math.PI,
      tau = 2 * pi,
      epsilon$2 = 1e-6,
      tauEpsilon = tau - epsilon$2;

  function Path$1() {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
  }

  function path() {
    return new Path$1;
  }

  Path$1.prototype = path.prototype = {
    constructor: Path$1,
    moveTo: function(x, y) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
    },
    closePath: function() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    },
    lineTo: function(x, y) {
      this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    quadraticCurveTo: function(x1, y1, x, y) {
      this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    bezierCurveTo: function(x1, y1, x2, y2, x, y) {
      this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    arcTo: function(x1, y1, x2, y2, r) {
      x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
      var x0 = this._x1,
          y0 = this._y1,
          x21 = x2 - x1,
          y21 = y2 - y1,
          x01 = x0 - x1,
          y01 = y0 - y1,
          l01_2 = x01 * x01 + y01 * y01;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x1,y1).
      if (this._x1 === null) {
        this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
      else if (!(l01_2 > epsilon$2));

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$2) || !r) {
        this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Otherwise, draw an arc!
      else {
        var x20 = x2 - x0,
            y20 = y2 - y0,
            l21_2 = x21 * x21 + y21 * y21,
            l20_2 = x20 * x20 + y20 * y20,
            l21 = Math.sqrt(l21_2),
            l01 = Math.sqrt(l01_2),
            l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
            t01 = l / l01,
            t21 = l / l21;

        // If the start tangent is not coincident with (x0,y0), line to.
        if (Math.abs(t01 - 1) > epsilon$2) {
          this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
        }

        this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
      }
    },
    arc: function(x, y, r, a0, a1, ccw) {
      x = +x, y = +y, r = +r, ccw = !!ccw;
      var dx = r * Math.cos(a0),
          dy = r * Math.sin(a0),
          x0 = x + dx,
          y0 = y + dy,
          cw = 1 ^ ccw,
          da = ccw ? a0 - a1 : a1 - a0;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x0,y0).
      if (this._x1 === null) {
        this._ += "M" + x0 + "," + y0;
      }

      // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
      else if (Math.abs(this._x1 - x0) > epsilon$2 || Math.abs(this._y1 - y0) > epsilon$2) {
        this._ += "L" + x0 + "," + y0;
      }

      // Is this arc empty? We’re done.
      if (!r) return;

      // Does the angle go the wrong way? Flip the direction.
      if (da < 0) da = da % tau + tau;

      // Is this a complete circle? Draw two arcs to complete the circle.
      if (da > tauEpsilon) {
        this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
      }

      // Is this arc non-empty? Draw an arc!
      else if (da > epsilon$2) {
        this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
    },
    rect: function(x, y, w, h) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
    },
    toString: function() {
      return this._;
    }
  };

  function constant$4(x) {
    return function constant() {
      return x;
    };
  }

  var abs = Math.abs;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var max$1 = Math.max;
  var min$1 = Math.min;
  var sin = Math.sin;
  var sqrt = Math.sqrt;

  var epsilon$3 = 1e-12;
  var pi$1 = Math.PI;
  var halfPi = pi$1 / 2;
  var tau$1 = 2 * pi$1;

  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
  }

  function asin(x) {
    return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
  }

  function arcInnerRadius(d) {
    return d.innerRadius;
  }

  function arcOuterRadius(d) {
    return d.outerRadius;
  }

  function arcStartAngle(d) {
    return d.startAngle;
  }

  function arcEndAngle(d) {
    return d.endAngle;
  }

  function arcPadAngle(d) {
    return d && d.padAngle; // Note: optional!
  }

  function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
    var x10 = x1 - x0, y10 = y1 - y0,
        x32 = x3 - x2, y32 = y3 - y2,
        t = y32 * x10 - x32 * y10;
    if (t * t < epsilon$3) return;
    t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
    return [x0 + t * x10, y0 + t * y10];
  }

  // Compute perpendicular offset line of length rc.
  // http://mathworld.wolfram.com/Circle-LineIntersection.html
  function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
    var x01 = x0 - x1,
        y01 = y0 - y1,
        lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
        ox = lo * y01,
        oy = -lo * x01,
        x11 = x0 + ox,
        y11 = y0 + oy,
        x10 = x1 + ox,
        y10 = y1 + oy,
        x00 = (x11 + x10) / 2,
        y00 = (y11 + y10) / 2,
        dx = x10 - x11,
        dy = y10 - y11,
        d2 = dx * dx + dy * dy,
        r = r1 - rc,
        D = x11 * y10 - x10 * y11,
        d = (dy < 0 ? -1 : 1) * sqrt(max$1(0, r * r * d2 - D * D)),
        cx0 = (D * dy - dx * d) / d2,
        cy0 = (-D * dx - dy * d) / d2,
        cx1 = (D * dy + dx * d) / d2,
        cy1 = (-D * dx + dy * d) / d2,
        dx0 = cx0 - x00,
        dy0 = cy0 - y00,
        dx1 = cx1 - x00,
        dy1 = cy1 - y00;

    // Pick the closer of the two intersection points.
    // TODO Is there a faster way to determine which intersection to use?
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

    return {
      cx: cx0,
      cy: cy0,
      x01: -ox,
      y01: -oy,
      x11: cx0 * (r1 / r - 1),
      y11: cy0 * (r1 / r - 1)
    };
  }

  function arc() {
    var innerRadius = arcInnerRadius,
        outerRadius = arcOuterRadius,
        cornerRadius = constant$4(0),
        padRadius = null,
        startAngle = arcStartAngle,
        endAngle = arcEndAngle,
        padAngle = arcPadAngle,
        context = null;

    function arc() {
      var buffer,
          r,
          r0 = +innerRadius.apply(this, arguments),
          r1 = +outerRadius.apply(this, arguments),
          a0 = startAngle.apply(this, arguments) - halfPi,
          a1 = endAngle.apply(this, arguments) - halfPi,
          da = abs(a1 - a0),
          cw = a1 > a0;

      if (!context) context = buffer = path();

      // Ensure that the outer radius is always larger than the inner radius.
      if (r1 < r0) r = r1, r1 = r0, r0 = r;

      // Is it a point?
      if (!(r1 > epsilon$3)) context.moveTo(0, 0);

      // Or is it a circle or annulus?
      else if (da > tau$1 - epsilon$3) {
        context.moveTo(r1 * cos(a0), r1 * sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon$3) {
          context.moveTo(r0 * cos(a1), r0 * sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
        var a01 = a0,
            a11 = a1,
            a00 = a0,
            a10 = a1,
            da0 = da,
            da1 = da,
            ap = padAngle.apply(this, arguments) / 2,
            rp = (ap > epsilon$3) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
            rc = min$1(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
            rc0 = rc,
            rc1 = rc,
            t0,
            t1;

        // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
        if (rp > epsilon$3) {
          var p0 = asin(rp / r0 * sin(ap)),
              p1 = asin(rp / r1 * sin(ap));
          if ((da0 -= p0 * 2) > epsilon$3) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
          else da0 = 0, a00 = a10 = (a0 + a1) / 2;
          if ((da1 -= p1 * 2) > epsilon$3) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
          else da1 = 0, a01 = a11 = (a0 + a1) / 2;
        }

        var x01 = r1 * cos(a01),
            y01 = r1 * sin(a01),
            x10 = r0 * cos(a10),
            y10 = r0 * sin(a10);

        // Apply rounded corners?
        if (rc > epsilon$3) {
          var x11 = r1 * cos(a11),
              y11 = r1 * sin(a11),
              x00 = r0 * cos(a00),
              y00 = r0 * sin(a00),
              oc;

          // Restrict the corner radius according to the sector angle.
          if (da < pi$1 && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
            var ax = x01 - oc[0],
                ay = y01 - oc[1],
                bx = x11 - oc[0],
                by = y11 - oc[1],
                kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
                lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = min$1(rc, (r0 - lc) / (kc - 1));
            rc1 = min$1(rc, (r1 - lc) / (kc + 1));
          }
        }

        // Is the sector collapsed to a line?
        if (!(da1 > epsilon$3)) context.moveTo(x01, y01);

        // Does the sector’s outer ring have rounded corners?
        else if (rc1 > epsilon$3) {
          t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
          t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

          context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
            context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the outer ring just a circular arc?
        else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

        // Is there no inner ring, and it’s a circular sector?
        // Or perhaps it’s an annular sector collapsed due to padding?
        if (!(r0 > epsilon$3) || !(da0 > epsilon$3)) context.lineTo(x10, y10);

        // Does the sector’s inner ring (or point) have rounded corners?
        else if (rc0 > epsilon$3) {
          t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
          t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

          context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
            context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the inner ring just a circular arc?
        else context.arc(0, 0, r0, a10, a00, cw);
      }

      context.closePath();

      if (buffer) return context = null, buffer + "" || null;
    }

    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
          a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$1 / 2;
      return [cos(a) * r, sin(a) * r];
    };

    arc.innerRadius = function(_) {
      return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : innerRadius;
    };

    arc.outerRadius = function(_) {
      return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : outerRadius;
    };

    arc.cornerRadius = function(_) {
      return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : cornerRadius;
    };

    arc.padRadius = function(_) {
      return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), arc) : padRadius;
    };

    arc.startAngle = function(_) {
      return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : startAngle;
    };

    arc.endAngle = function(_) {
      return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : endAngle;
    };

    arc.padAngle = function(_) {
      return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : padAngle;
    };

    arc.context = function(_) {
      return arguments.length ? ((context = _ == null ? null : _), arc) : context;
    };

    return arc;
  }

  function Linear(context) {
    this._context = context;
  }

  Linear.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; // proceed
        default: this._context.lineTo(x, y); break;
      }
    }
  };

  function curveLinear(context) {
    return new Linear(context);
  }

  function x(p) {
    return p[0];
  }

  function y(p) {
    return p[1];
  }

  function line() {
    var x$1 = x,
        y$1 = y,
        defined = constant$4(true),
        context = null,
        curve = curveLinear,
        output = null;

    function line(data) {
      var i,
          n = data.length,
          d,
          defined0 = false,
          buffer;

      if (context == null) output = curve(buffer = path());

      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) output.lineStart();
          else output.lineEnd();
        }
        if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
      }

      if (buffer) return output = null, buffer + "" || null;
    }

    line.x = function(_) {
      return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$4(+_), line) : x$1;
    };

    line.y = function(_) {
      return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$4(+_), line) : y$1;
    };

    line.defined = function(_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : constant$4(!!_), line) : defined;
    };

    line.curve = function(_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
    };

    line.context = function(_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
    };

    return line;
  }

  function area() {
    var x0 = x,
        x1 = null,
        y0 = constant$4(0),
        y1 = y,
        defined = constant$4(true),
        context = null,
        curve = curveLinear,
        output = null;

    function area(data) {
      var i,
          j,
          k,
          n = data.length,
          d,
          defined0 = false,
          buffer,
          x0z = new Array(n),
          y0z = new Array(n);

      if (context == null) output = curve(buffer = path());

      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) {
            j = i;
            output.areaStart();
            output.lineStart();
          } else {
            output.lineEnd();
            output.lineStart();
            for (k = i - 1; k >= j; --k) {
              output.point(x0z[k], y0z[k]);
            }
            output.lineEnd();
            output.areaEnd();
          }
        }
        if (defined0) {
          x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
          output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
        }
      }

      if (buffer) return output = null, buffer + "" || null;
    }

    function arealine() {
      return line().defined(defined).curve(curve).context(context);
    }

    area.x = function(_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$4(+_), x1 = null, area) : x0;
    };

    area.x0 = function(_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$4(+_), area) : x0;
    };

    area.x1 = function(_) {
      return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), area) : x1;
    };

    area.y = function(_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$4(+_), y1 = null, area) : y0;
    };

    area.y0 = function(_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$4(+_), area) : y0;
    };

    area.y1 = function(_) {
      return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), area) : y1;
    };

    area.lineX0 =
    area.lineY0 = function() {
      return arealine().x(x0).y(y0);
    };

    area.lineY1 = function() {
      return arealine().x(x0).y(y1);
    };

    area.lineX1 = function() {
      return arealine().x(x1).y(y0);
    };

    area.defined = function(_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : constant$4(!!_), area) : defined;
    };

    area.curve = function(_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
    };

    area.context = function(_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
    };

    return area;
  }

  var slice$1 = Array.prototype.slice;

  var circle = {
    draw: function(context, size) {
      var r = Math.sqrt(size / pi$1);
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau$1);
    }
  };

  var cross = {
    draw: function(context, size) {
      var r = Math.sqrt(size / 5) / 2;
      context.moveTo(-3 * r, -r);
      context.lineTo(-r, -r);
      context.lineTo(-r, -3 * r);
      context.lineTo(r, -3 * r);
      context.lineTo(r, -r);
      context.lineTo(3 * r, -r);
      context.lineTo(3 * r, r);
      context.lineTo(r, r);
      context.lineTo(r, 3 * r);
      context.lineTo(-r, 3 * r);
      context.lineTo(-r, r);
      context.lineTo(-3 * r, r);
      context.closePath();
    }
  };

  var tan30 = Math.sqrt(1 / 3),
      tan30_2 = tan30 * 2;

  var diamond = {
    draw: function(context, size) {
      var y = Math.sqrt(size / tan30_2),
          x = y * tan30;
      context.moveTo(0, -y);
      context.lineTo(x, 0);
      context.lineTo(0, y);
      context.lineTo(-x, 0);
      context.closePath();
    }
  };

  var ka = 0.89081309152928522810,
      kr = Math.sin(pi$1 / 10) / Math.sin(7 * pi$1 / 10),
      kx = Math.sin(tau$1 / 10) * kr,
      ky = -Math.cos(tau$1 / 10) * kr;

  var star = {
    draw: function(context, size) {
      var r = Math.sqrt(size * ka),
          x = kx * r,
          y = ky * r;
      context.moveTo(0, -r);
      context.lineTo(x, y);
      for (var i = 1; i < 5; ++i) {
        var a = tau$1 * i / 5,
            c = Math.cos(a),
            s = Math.sin(a);
        context.lineTo(s * r, -c * r);
        context.lineTo(c * x - s * y, s * x + c * y);
      }
      context.closePath();
    }
  };

  var square = {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  };

  var sqrt3 = Math.sqrt(3);

  var triangle = {
    draw: function(context, size) {
      var y = -Math.sqrt(size / (sqrt3 * 3));
      context.moveTo(0, y * 2);
      context.lineTo(-sqrt3 * y, -y);
      context.lineTo(sqrt3 * y, -y);
      context.closePath();
    }
  };

  var c = -0.5,
      s = Math.sqrt(3) / 2,
      k = 1 / Math.sqrt(12),
      a = (k / 2 + 1) * 3;

  var wye = {
    draw: function(context, size) {
      var r = Math.sqrt(size / a),
          x0 = r / 2,
          y0 = r * k,
          x1 = x0,
          y1 = r * k + r,
          x2 = -x1,
          y2 = y1;
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
      context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
      context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
      context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
      context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
      context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
      context.closePath();
    }
  };

  var symbols = [
    circle,
    cross,
    diamond,
    square,
    star,
    triangle,
    wye
  ];

  function none$1(series, order) {
    if (!((n = series.length) > 1)) return;
    for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
      s0 = s1, s1 = series[order[i]];
      for (j = 0; j < m; ++j) {
        s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
      }
    }
  }

  function none$2(series) {
    var n = series.length, o = new Array(n);
    while (--n >= 0) o[n] = n;
    return o;
  }

  function stackValue(d, key) {
    return d[key];
  }

  function stack() {
    var keys = constant$4([]),
        order = none$2,
        offset = none$1,
        value = stackValue;

    function stack(data) {
      var kz = keys.apply(this, arguments),
          i,
          m = data.length,
          n = kz.length,
          sz = new Array(n),
          oz;

      for (i = 0; i < n; ++i) {
        for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
          si[j] = sij = [0, +value(data[j], ki, j, data)];
          sij.data = data[j];
        }
        si.key = ki;
      }

      for (i = 0, oz = order(sz); i < n; ++i) {
        sz[oz[i]].index = i;
      }

      offset(sz, oz);
      return sz;
    }

    stack.keys = function(_) {
      return arguments.length ? (keys = typeof _ === "function" ? _ : constant$4(slice$1.call(_)), stack) : keys;
    };

    stack.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant$4(+_), stack) : value;
    };

    stack.order = function(_) {
      return arguments.length ? (order = _ == null ? none$2 : typeof _ === "function" ? _ : constant$4(slice$1.call(_)), stack) : order;
    };

    stack.offset = function(_) {
      return arguments.length ? (offset = _ == null ? none$1 : _, stack) : offset;
    };

    return stack;
  }

  // each data MUST have a uniq id for direct-access, which defaults to its 'id' attribute
  // each data MUST have a value to sort on, which default to its 'value' attribute

  // data in SortedDirectAccessDoublyLinkedList are sorted by 'value', from min to max, in a doubly-linked list
  // each node in the doubly-linked list is of the form {datum: , value: , prev: , next: }
  // 'datum' refers to the original datum; 'value' is retrieved from data, 'prev'/'next' refer to previous/next value-based nodes

  function SortedDirectAccessDoublyLinkedList () {
    this._valueAccessor =          // accessor to the value to sort on
      function (obj) {
        return obj.value;
      };
    this._idAccessor =         // accessor to the uniq id
      function (obj) {
        return obj.id;
      };
    this._min = null;             // reference to a doubly-linked node with the min value
    this._max = null;             // reference to a doubly-linked node with the max value
    this._closestTo0 = null;      // reference to the doubly-linked node with the value closest or egal to 0
    this.size = 0;                // number of data in the doubly-linked list
    this._idToNode = {};          // direct access to a node of the doubly-linked list
  }

  SortedDirectAccessDoublyLinkedList.prototype.valueAccessor = function (_) {
    if (!arguments.length) { return this._valueAccessor; }
    this._valueAccessor = _;

    //for chaining purpose
    return this;
  };

  SortedDirectAccessDoublyLinkedList.prototype.idAccessor = function (_) {
    if (!arguments.length) { return this._idAccessor; }
    this._idAccessor = _;

    //for chaining purpose
    return this;
  };

  SortedDirectAccessDoublyLinkedList.prototype.min = function () {
    return this._min;
  };

  SortedDirectAccessDoublyLinkedList.prototype.max = function () {
    return this._max;
  };

  SortedDirectAccessDoublyLinkedList.prototype.closestTo0 = function () {
    return this._closestTo0;
  };

  SortedDirectAccessDoublyLinkedList.prototype.dln = function (datum){
    // dln = doubly-linked node
    return this._idToNode[this._idAccessor(datum)];
  };

  SortedDirectAccessDoublyLinkedList.prototype.empty = function () {
    this._min = null;
    this._max = null;
    this._closestTo0 = null;
    this.size = 0;
    this._idToNode = {};

    //for chaining purpose
    return this;
  };

  SortedDirectAccessDoublyLinkedList.prototype.add = function (datum){
    //create a new doubly-linked node
    var dln = {
      datum: datum, // original datum
      value: this._valueAccessor(datum), // store datum's value, intensively used when sorting
      prev: null,	// previous value-based node
      next: null		// next value-based node
    };

    //insert node in the adequate position in the doubly-linked list
    if (this.size === 0) { //special case: no node in the list yet
      this._min = this._max = this._closestTo0 = dln;
    } else {
      if (dln.value <= this._min.value) {//special case: new datum is the min
        dln.next = this._min;
        dln.next.prev = dln;
        this._min = dln;
      } else if (dln.value >= this._max.value) { //special case: new datum is the max
        dln.prev = this._max;
        dln.prev.next = dln;
        this._max = dln;
      } else {
        //insert the node at the adequate position
        var current = this._max;
        //loop to find immediate prev
        while (current.value > dln.value) {
          current = current.prev;
        }
        dln.prev = current;
        dln.next = current.next;
        dln.next.prev = dln;
        dln.prev.next = dln;
      }
      if (Math.abs(dln.value) < Math.abs(this._closestTo0.value)) {
        this._closestTo0 = dln;
      }
    }

    //direct access to the node
    this._idToNode[this._idAccessor(datum)] = dln;

    //update size
    this.size++;

    //for chaining purpose
    return this;
  };

  SortedDirectAccessDoublyLinkedList.prototype.addMany = function (data) {

    data.forEach( function (datum, item) {
      this.add(datum);
    }, this);

    //for chaining purpose
    return this;
  };

  SortedDirectAccessDoublyLinkedList.prototype.remove = function (datum) {
    var dln = this.dln(datum);

    //remove node from the doubly-linked list
    if (this.size === 1) { //special case: last item to remove
      this._min = this._max = this._closestTo0 = null;
    } else {
      if (dln === this._closestTo0) {
        if (this._closestTo0.next === null) {
          //closestTo0 is also the max, consider merge code with below
          this._closestTo0 = dln.prev;
        } else if (this._closestTo0.prev === null) {
          //closestTo0 is also the min, consider merge code with below
          this._closestTo0 = dln.prev;
        } else {
          //consider merge code with below
          var prevAbsValue = Math.abs(this._closestTo0.prev.value);
          var nextAbsValue = Math.abs(this._closestTo0.next.value);
          if (prevAbsValue < nextAbsValue) {
            this._closestTo0 = this._closestTo0.prev;
          } else {
            this._closestTo0 = this._closestTo0.next;
          }
        }
      }
      if (dln === this._min) { //special case: datum is the min
        this._min = this._min.next;
        this._min.prev = null;
      } else if (dln === this._max) { //special case: datum is the max
        this._max = this._max.prev;
        this._max.next = null;
      } else {
        //remove pointers to the node
        dln.next.prev = dln.prev;
        dln.prev.next = dln.next;
      }
    }

    delete this._idToNode[this._idAccessor(datum)]; //remove direct access to the node
    dln = null; // carbage collector

    //update size
    this.size--;

    //for chaining purpose
    return this;
  };

  function beeswarm () {
    /////// Inputs ///////
    var data = [];                  // original data to arrange
    var radius = 4;                 // default radius
    var orientation = "horizontal"; // default orientation; "vertical" also available
    var side = "symetric";          // default side; "positive" and "negative" are also available
    var distributeOn =              // accessor to the x value
            function (datum) {
              return datum.x;
            };

    /////// Internals ///////
    var minDistanceBetweenCircles;
    var minSquareDistanceBetweenCircles;
    var xBasedDataManager;          // for collision detection, x-based sorted direct-access doubly-linked list of data, used to find nearest already arranged data
    var xBasedColliderManager;      // for collision detection, x-based sorted direct-access doubly-linked list of already arranged data, limit collision detection to already arranged neighbours
    var yBasedColliderManager;      // for collision detection, y-based sorted direct-access doubly-linked list of already arranged data, limit collision detection to already arranged neighbours
    var arrangement;                // result, array of {datum: , x: , y: }

    //--> for metrics purpose
    var totalPossibleColliders, maxPossibleColliders,
        totalTestedPlacements,
        visitedColliderCount, totalVisitedColliders, maxVisitedColliders;
    //<-- for metrics purpose

    function _beeswarm () {}       // constructor ???

    ///////////////////////
    ///////// API /////////
    ///////////////////////

    _beeswarm.data = function(_) {
      if (!arguments.length) { return data; }
      data = _;

      return _beeswarm;
    };

    _beeswarm.radius = function (_) {
      if (!arguments.length) { return radius; }
      radius = _;

      return _beeswarm;
    };

    _beeswarm.orientation = function (_) {
      if (!arguments.length) { return orientation; }
      if (_ === "horizontal" ||
          _ === "vertical"
         ) {
        orientation = _;
      }

      return _beeswarm;
    };

    _beeswarm.side = function (_) {
      if (!arguments.length) { return side; }
      if (_ === "symetric" ||
          _ === "positive" ||
          _ === "negative"
         ) {
        side = _;
      }

      return _beeswarm;
    };

    _beeswarm.distributeOn = function (_) {
      if (!arguments.length) { return distributeOn; }
      distributeOn = _;

      return _beeswarm;
    };

    _beeswarm.arrange = function() {
      initArrangement();
      arrangement.forEach(function (d) {
        var bestYPosition = -Infinity,
            relativeYPos,
            xBasedPossibleColliders = gatherXBasedPossibleColliders(d);
        if (xBasedPossibleColliders.length===0) {
          bestYPosition = 0;
        } else {
          yBasedColliderManager.empty();
          yBasedColliderManager.addMany(xBasedPossibleColliders);
          // try to place on the x-axis
          d.free = 0;
          if (!collidesWithOther(d, yBasedColliderManager.closestTo0())) {
            bestYPosition = 0;
            //-->for metrics purpose
            totalVisitedColliders += visitedColliderCount;
            if (visitedColliderCount > maxVisitedColliders) {
              maxVisitedColliders = visitedColliderCount;
            }
            visitedColliderCount = 0;
            totalTestedPlacements += 1;
            //<--for metrics purpose
          } else {
            xBasedPossibleColliders.forEach(function(xbpc) {
              // try to place below and above an already arranged datum
              relativeYPos = yPosRelativeToXbpc(xbpc, d);
              placeBelow(d, xbpc, relativeYPos);
              if (isAuthorizedPlacement(d) &&
                  isBetterPlacement(d, bestYPosition) &&
                  !collidesWithOther(d, yBasedColliderManager.dln(xbpc))) {
                bestYPosition = d.free;
              }
              //-->for metrics purpose
              totalVisitedColliders += visitedColliderCount;
              if (visitedColliderCount > maxVisitedColliders) {
                maxVisitedColliders = visitedColliderCount;
              }
              visitedColliderCount = 0;
              totalTestedPlacements += 1;
              //<--for metrics purpose
              placeAbove(d, xbpc, relativeYPos);
              if (isAuthorizedPlacement(d) &&
                  isBetterPlacement(d, bestYPosition) &&
                  !collidesWithOther(d, yBasedColliderManager.dln(xbpc))) {
                bestYPosition = d.free;
              }
              //-->for metrics purpose
              totalVisitedColliders += visitedColliderCount;
              if (visitedColliderCount > maxVisitedColliders) {
                maxVisitedColliders = visitedColliderCount;
              }
              visitedColliderCount = 0;
              totalTestedPlacements += 1;
              //<--for metrics purpose
          	});
          }
        }
        d.free = bestYPosition;
        if (orientation === "horizontal") {
          d.x = d.fixed;
          d.y = bestYPosition;
        } else {
          d.x = bestYPosition;
          d.y = d.fixed;
        }
        xBasedColliderManager.add(d);
      });
      return arrangement;
    };

    _beeswarm.metrics = function () {
      return {
        totalPossibleColliders: totalPossibleColliders,
        maxPossibleColliders: maxPossibleColliders,
        totalTestedPlacements: totalTestedPlacements,
        visitedColliderCount: visitedColliderCount,
        totalVisitedColliders: totalVisitedColliders,
        maxVisitedColliders: maxVisitedColliders
      };
    };

    ///////////////////////
    /////// Private ///////
    ///////////////////////

    function initArrangement () {
      arrangement = data.map(function (d,i) {
        return {
          datum: d,
          id: i,
          fixed: distributeOn(d),
          free: -Infinity
        };
      });

      minDistanceBetweenCircles = 2*radius;
      minSquareDistanceBetweenCircles = Math.pow(minDistanceBetweenCircles, 2);
      xBasedDataManager = new SortedDirectAccessDoublyLinkedList()
        .valueAccessor(function(d){return d.fixed;})
        .addMany(arrangement);
      xBasedColliderManager = new SortedDirectAccessDoublyLinkedList()
        .valueAccessor(function(d){return d.fixed;});
      yBasedColliderManager = new SortedDirectAccessDoublyLinkedList()
        .valueAccessor(function(d){return d.free;});


      //-->for metrics purpose
      totalPossibleColliders = maxPossibleColliders = 0;
      totalTestedPlacements = 0;
      visitedColliderCount = totalVisitedColliders = maxVisitedColliders =0;
      //<--for metrics purpose
    }

  	function findNearestPossibleCollider(dln, visitedDln, direction) {
      if (visitedDln === null) { // special case: max reached
        return null;
      } else if ((direction==="prev") ?
                 dln.value - visitedDln.value > minDistanceBetweenCircles :
                 visitedDln.value - dln.value > minDistanceBetweenCircles
                ) {
        // stop visit, remaining data are too far away
        return null;
      } else {// visitedDln is close enought
        if (isFinite(visitedDln.datum.free)) { // visitedDln is already arranged, and hence is the nearest possible x-based collider
          return(visitedDln.datum);
        }
        // continue finding
        return findNearestPossibleCollider(dln, visitedDln[direction], direction);
      }
    }

    function visitToGatherXBasedPossibleColliders(dln, visitedDln, direction, xBasedPossibleColliders) {
      if (visitedDln === null) { // special case: extreme reached
        return;
      } else if ((direction==="prev") ?
                 dln.value - visitedDln.value > minDistanceBetweenCircles :
                 visitedDln.value - dln.value > minDistanceBetweenCircles
                ) {
        // stop visit, remaining data are too far away
        return;
      } else {// visitedDln is close enought
        // visitedDln is already arranged, and hence is a possible x-based collider
        xBasedPossibleColliders.push(visitedDln.datum);
        // continue gathering
        visitToGatherXBasedPossibleColliders(dln, visitedDln[direction], direction, xBasedPossibleColliders);
      }
    }

    function gatherXBasedPossibleColliders (datum) {
      var xBasedPossibleColliders = [];
      var dln = xBasedDataManager.dln(datum);
      //use xBasedDataManager to retrieve nearest already arranged data
      var nearestXPrevAlreadyArrangedData = findNearestPossibleCollider(dln, dln.prev, "prev");
      var nearestXNextAlreadyArrangedData = findNearestPossibleCollider(dln, dln.next, "next");

      //use xBasedColliderManager to retrieve already arranged data that may collide with datum (ie, close enought to datum considering x position)
      if (nearestXPrevAlreadyArrangedData != null) {
        //visit x-prev already arranged nodes
        dln = xBasedColliderManager.dln(nearestXPrevAlreadyArrangedData);
        visitToGatherXBasedPossibleColliders(dln, dln, "prev", xBasedPossibleColliders);
      }

      if (nearestXNextAlreadyArrangedData != null) {
        //visit x-next already arranged nodes
        dln = xBasedColliderManager.dln(nearestXNextAlreadyArrangedData);
        visitToGatherXBasedPossibleColliders(dln, dln, "next", xBasedPossibleColliders);
      }

      //-->for metrics purpose
      totalPossibleColliders += xBasedPossibleColliders.length;
      if (xBasedPossibleColliders.length > maxPossibleColliders) {
        maxPossibleColliders = xBasedPossibleColliders.length;
      }
      //<--for metrics purpose
      return xBasedPossibleColliders;
    }

    function isAuthorizedPlacement(datum) {
      if (side === "symetric") {
        return true;
      } else if (side === "positive") {
        return datum.free>=0;
      } else {
        return datum.free<=0;
      }
    }

    function isBetterPlacement(datum, bestYPosition) {
      return Math.abs(datum.free) < Math.abs(bestYPosition);
    }

    function yPosRelativeToXbpc(xbpc, d) {
      // handle Float approximation with +1E-6
      return Math.sqrt(minSquareDistanceBetweenCircles-Math.pow(d.fixed-xbpc.fixed,2))+1E-6;
    }

    function placeBelow(d, aad, relativeYPos) {
      d.free = aad.free - relativeYPos;
    }

    function placeAbove(d, aad, relativeYPos) {
      d.free = aad.free + relativeYPos;
    }

    function areCirclesColliding(d0, d1) {
      visitedColliderCount++; //for metrics prupose

      return (Math.pow(d1.free-d0.free, 2) + Math.pow(d1.fixed-d0.fixed, 2)) < minSquareDistanceBetweenCircles;
    }

    function visitToDetectCollisionWithOther(datum, visitedDln, direction, visitCount) {
      if (visitedDln === null) { // special case: y_max reached, no collision detected
        return false;
      } else if ((direction==="prev") ?
                 datum.free - visitedDln.datum.free > minDistanceBetweenCircles :
                 visitedDln.datum.free - datum.free > minDistanceBetweenCircles
                ) {
        // stop visit, no collision detected, remaining data are too far away
        return false;
      } else if (areCirclesColliding(datum, visitedDln.datum)) {
        return true;
      } else {
        // continue visit
        return visitToDetectCollisionWithOther(datum, visitedDln[direction], direction);
      }
    }

    function collidesWithOther (datum, visitedDln) {
      //visit prev dlns for collision check
      // if (visitToDetectCollisionWithOther(datum, visitedDln.prev, "prev", visitCount++)) {
      if (visitToDetectCollisionWithOther(datum, visitedDln, "prev")) {
        return true;
      } else {
        //visit next dlns for collision check
        // return visitToDetectCollisionWithOther(datum, visitedDln.next, "next", visitCount++);
        return visitToDetectCollisionWithOther(datum, visitedDln, "next");
      }
    }

    return _beeswarm;
  }

  var index = {
    extent: extent,
    merge: merge,
    descending: descending,
    median: median,
    quantile: quantile,
    ascending: ascending,
    max: max,
    bisector: bisector,
    mean: mean,
    transpose: transpose,
    bisect: bisectRight,
    axisBottom: axisBottom,
    brushX: brushX,
    set: set$2,
    nest: nest,
    map: map,
    drag: drag,
    forceSimulation: forceSimulation,
    format: format,
    timerFlush: timerFlush,
    transition: transition,
    timeFormat: timeFormat,
    rgb: rgb,
    pie: pie,
    interpolate: interpolate,
    interpolateString: interpolateString,
    interpolateNumber: interpolateNumber,
    Voronoi: Voronoi,
    scaleOrdinal: ordinal,
    event: event,
    selection: selection,
    mouse: mouse,
    area: area,
    line: line,
    symbols: symbols,
    arc: arc,
    stack: stack,
    dispatch: dispatch,
    beeswarm: beeswarm,
  };

  return index;

})));
