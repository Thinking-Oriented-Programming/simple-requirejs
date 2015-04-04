(function(){
  var root;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  define('Abstract-widget', ['state', 'util'], function(State, util){
    var AbstractWidget;
    return AbstractWidget = (function(){
      AbstractWidget.displayName = 'AbstractWidget';
      var prototype = AbstractWidget.prototype, constructor = AbstractWidget;
      prototype.widgetNameIndex = {};
      function AbstractWidget(spec, model, isIncludeByTemplate){
        var ref$;
        this.spec = spec;
        this.model = model;
        this.isIncludeByTemplate = isIncludeByTemplate;
        this.modelName = (ref$ = this.spec).modelName;
        this.itemTemplateName = ref$.itemTemplateName;
        this.name = spec.name = this.getWidgetName(spec.name);
        this.initialState();
        this.initialDom();
        this.reactiveToAppState();
        this.setDataState();
        this.bindData();
      }
      prototype.getWidgetName = function(widgetName){
        var index;
        index = this.widgetNameIndex[widgetName] != null
          ? ++this.widgetNameIndex[widgetName]
          : this.widgetNameIndex[widgetName] = 0;
        if (index === 0) {
          return widgetName;
        } else {
          return widgetName + "(" + index + ")";
        }
      };
      prototype.getState = function(){
        if (!State[this.dataStateName]) {
          throw new Error("can't find data of " + this.dataStateName);
        }
        return State[this.dataStateName];
      };
      prototype.initialState = function(){
        this.stateNames = ['hidden', 'shown'];
        if (this.spec.statesNames != null) {
          this.stateNames = this.stateNames.concat(this.spec.statesNames);
        }
        this.state = State.add("a-plus-widgets-" + this.name, 'hidden');
      };
      prototype.initialDom = function(){
        this.widgetContainer = $("<div data-b-plus-widget-container></div>");
        this.createDom();
        this.widgetContainer.append(this.dom);
        this.changeWidgetContainerClassWhenStateChanged();
      };
      prototype.changeWidgetContainerClassWhenStateChanged = function(){
        var this$ = this;
        this.state.observe(function(state){
          this$.widgetContainer.attr('class', state.replace(/\./g, ' '));
        });
      };
      prototype.reactiveToAppState = function(){
        var s, this$ = this;
        if (State.appState) {
          this.parseWidgetStatesAppStatesMap();
          State.appState.observe(function(appState){
            var widgetState, ref$, appStates, own$ = {}.hasOwnProperty;
            for (widgetState in ref$ = this$.widgetStatesAppStatesMap || {}) if (own$.call(ref$, widgetState)) {
              appStates = ref$[widgetState];
              if (in$(appState, appStates)) {
                this$.state(widgetState);
                return;
              }
            }
            if (this$.name === 'create-assignment') {
              console.log(this$.isIncludeByTemplate ? 'normal' : 'hidden');
            }
            this$.state(this$.isIncludeByTemplate ? 'normal' : 'hidden');
          });
          if (s = State.appState()) {
            State.appState(s);
          }
        }
      };
      prototype.parseWidgetStatesAppStatesMap = function(){
        this.runtime = root.bPlusAppEngine.appSpec.runtime;
        this.widgetStatesAppStatesMap = {};
        this.deduceFromStatesNames();
        this.deduceFromStatesWidgets();
      };
      prototype.deduceFromStatesNames = function(){
        var i$, ref$, len$, appState;
        for (i$ = 0, len$ = (ref$ = this.runtime.states).length; i$ < len$; ++i$) {
          appState = ref$[i$];
          if (this.appStateIsWidgetName(appState)) {
            this.addNormalStateForWidget(appState);
          }
        }
      };
      prototype.deduceFromStatesWidgets = function(){
        var appState, ref$, widgets, own$ = {}.hasOwnProperty;
        for (appState in ref$ = this.runtime.statesWidgets) if (own$.call(ref$, appState)) {
          widgets = ref$[appState];
          if (in$(this.name, widgets) && !this.isIncludeByTemplate) {
            this.addNormalStateForWidget(appState);
          }
        }
      };
      prototype.addNormalStateForWidget = function(appState){
        var ref$;
        (ref$ = this.widgetStatesAppStatesMap).normal || (ref$.normal = []);
        this.widgetStatesAppStatesMap.normal.push(appState);
      };
      prototype.appStateIsWidgetName = function(appState){
        return this.name === appState.replace('.', '-').camelize();
      };
      prototype.bindData = function(){
        this.bindComputationsStates();
      };
      prototype.bindComputationsStates = function(){
        var i$, ref$, own$ = {}.hasOwnProperty;
        for (i$ in ref$ = this.model['@computations']) if (own$.call(ref$, i$)) {
          (fn$.call(this, i$, ref$[i$]));
        }
        function fn$(name, computation){
          var this$ = this;
          if (State[computation.observe] == null) {
            State.bind(computation.observe, null);
          }
          State[computation.observe].observe(function(newValue){
            this$.applyComputation(name, computation);
          });
        }
      };
      prototype.fillComputedData = function(){
        var self, compute, name, ref$, computation, own$ = {}.hasOwnProperty;
        self = this;
        compute = this.applyComputationOnItem || this.applyComputation;
        for (name in ref$ = this.model['@computations']) if (own$.call(ref$, name)) {
          computation = ref$[name];
          compute.call(self, name, computation);
        }
      };
      prototype.applyComputation = function(){};
      prototype.createDom = function(){};
      prototype.setDataState = function(){};
      prototype.activate = function(){};
      return AbstractWidget;
    }());
  });
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
