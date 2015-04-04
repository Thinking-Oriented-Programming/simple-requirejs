(function(){
  var root, ref$, DependencyNotExistException, getDep, reEvaluatePendingMap, reEvaluatePendingModules, reEvaluatePendingRequireFns, isAlreadyInMap, startDependenciesChecking, check;
  root = (ref$ = typeof module != 'undefined' && module !== null ? module.exports : void 8) != null ? ref$ : this;
  root.__modules__ || (root.__modules__ = {});
  root.__pendingModules__ || (root.__pendingModules__ = {});
  root.__pendingRequireFns__ || (root.__pendingRequireFns__ = {});
  root.__pendingRequireFnsAmount__ || (root.__pendingRequireFnsAmount__ = 0);
  root.__DependencyNotExistException__ = DependencyNotExistException = (function(){
    DependencyNotExistException.displayName = 'DependencyNotExistException';
    var prototype = DependencyNotExistException.prototype, constructor = DependencyNotExistException;
    function DependencyNotExistException(value){
      this.value = value;
      this.message = "not existed";
      this.toString = function(){
        return this.value + this.message;
      };
    }
    return DependencyNotExistException;
  }());
  getDep = function(dep){
    if (!root.__modules__[dep]) {
      throw new DependencyNotExistException(dep);
    }
    return root.__modules__[dep];
  };
  reEvaluatePendingMap = function(map, evaluateFn){
    var amountBeforeEvaluate, key, value, amountAfterEvaluate, results$ = [];
    amountBeforeEvaluate = Object.keys(map).length;
    while (amountAfterEvaluate !== amountBeforeEvaluate && Object.keys(map).length !== 0) {
      amountBeforeEvaluate = Object.keys(map).length;
      for (key in map) {
        value = map[key];
        evaluateFn(key, value);
      }
      results$.push(amountAfterEvaluate = Object.keys(map).length);
    }
    return results$;
  };
  reEvaluatePendingModules = function(){
    reEvaluatePendingMap(root.__pendingModules__, function(name, module){
      return root.define(name, module.dependencies, module.fn);
    });
  };
  reEvaluatePendingRequireFns = function(){
    reEvaluatePendingMap(root.__pendingRequireFns__, function(key, req){
      return root.require(req.dependencies, req.fn);
    });
  };
  root.define = function(name, dependencies, moduleFn){
    var deps, res$, i$, len$, dep, error;
    if (root.__modules__[name]) {
      throw new Error(name + " has already been defined.");
    }
    try {
      res$ = [];
      for (i$ = 0, len$ = dependencies.length; i$ < len$; ++i$) {
        dep = dependencies[i$];
        res$.push(getDep(dep));
      }
      deps = res$;
      root.__modules__[name] = moduleFn.apply(root, deps);
      if (root.__pendingModules__[name]) {
        delete root.__pendingModules__[name];
      }
      reEvaluatePendingModules();
      return reEvaluatePendingRequireFns();
    } catch (e$) {
      error = e$;
      if (error instanceof DependencyNotExistException) {
        if (!root.__pendingModules__[name]) {
          return root.__pendingModules__[name] = {
            dependencies: dependencies,
            fn: moduleFn
          };
        }
      } else {
        throw new Error(error.stack);
      }
    }
  };
  root.require = function(dependencies, fn){
    var deps, res$, i$, len$, dep, key, ref$, req, error, results$ = [];
    startDependenciesChecking();
    try {
      res$ = [];
      for (i$ = 0, len$ = dependencies.length; i$ < len$; ++i$) {
        dep = dependencies[i$];
        res$.push(getDep(dep));
      }
      deps = res$;
      fn.apply(root, deps);
      for (key in ref$ = root.__pendingRequireFns__) {
        req = ref$[key];
        if (root.__pendingRequireFns__[key].fn === fn) {
          delete root.__pendingRequireFns__[key];
          break;
        }
      }
      return results$;
    } catch (e$) {
      error = e$;
      if (error instanceof DependencyNotExistException) {
        if (!isAlreadyInMap(req = {
          dependencies: dependencies,
          fn: fn
        }, root.__pendingRequireFns__)) {
          return root.__pendingRequireFns__[root.__pendingRequireFnsAmount__++] = req;
        }
      } else {
        throw new Error(error.stack);
      }
    }
  };
  root.requireIfExisted = function(dependencies, fn){
    var deps, res$, i$, len$, dep, error;
    try {
      res$ = [];
      for (i$ = 0, len$ = dependencies.length; i$ < len$; ++i$) {
        dep = dependencies[i$];
        res$.push(getDep(dep));
      }
      deps = res$;
      return fn.apply(root, deps);
    } catch (e$) {
      error = e$;
      if (error instanceof DependencyNotExistException) {
        console.log("developer doen't provide extension");
        return fn.apply(root, deps);
      } else {
        throw new Error(error.stack);
      }
    }
  };
  isAlreadyInMap = function(checkedValue, map){
    var key, value;
    for (key in map) {
      value = map[key];
      if (value.fn === checkedValue.fn && value.dependencies === checkedValue.dependencies) {
        return true;
      }
    }
    return false;
  };
  startDependenciesChecking = function(){
    var timer, isSet;
    timer = null;
    isSet = false;
    return function(){
      if (typeof Meteor != 'undefined' && Meteor !== null) {
        if (!isSet) {
          Meteor.startup(check);
        }
        isSet = true;
      } else {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(check, 0);
      }
    };
  }();
  check = function(){
    var existModule, pendings, name, ref$, module, i$, ref1$, len$, dependency, index, pendingFn;
    existModule = Object.keys(root.__modules__);
    pendings = [];
    for (name in ref$ = root.__pendingModules__) {
      module = ref$[name];
      for (i$ = 0, len$ = (ref1$ = module.dependencies).length; i$ < len$; ++i$) {
        dependency = ref1$[i$];
        if (!in$(dependency, pendings) && !in$(dependency, existModule)) {
          pendings.push(dependency);
        }
      }
    }
    for (index in ref$ = root.__pendingRequireFns__) {
      pendingFn = ref$[index];
      for (i$ = 0, len$ = (ref1$ = pendingFn.dependencies).length; i$ < len$; ++i$) {
        dependency = ref1$[i$];
        if (!in$(dependency, pendings) && !in$(dependency, existModule)) {
          pendings.push(dependency);
        }
      }
    }
    if (pendings.length) {
      throw new Error("can't find dependencies: " + pendings.join(', '));
    }
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
