# 用来模拟requirejs的loading
# 目前必须按照依赖顺序在package.js用api.useFile添加模块，然后在最后一个模块中require添加好的模块

# throw new Error "NO window object exist. This simple requirejs loader could only be used in browser!" if not window

root = module?.exports ? @

root.__modules__ ||= {}
root.__pending-modules__ ||= {}
root.__pending-require-fns__ ||= {}
root.__pending-require-fns-amount__ ||= 0

root.__Dependency-not-exist-exception__ = class Dependency-not-exist-exception
  (@value)->
    @message =  "not existed"
    @to-string = -> @value + @message

get-dep = (dep)->
  throw new Dependency-not-exist-exception dep if not root.__modules__[dep]
  root.__modules__[dep]

re-evaluate-pending-map = (map, evaluate-fn)->
  amount-before-evaluate = Object.keys map .length
  while amount-after-evaluate isnt amount-before-evaluate and Object.keys map .length isnt 0
    amount-before-evaluate = Object.keys map .length
    [evaluate-fn key, value for key, value of map]
    amount-after-evaluate = Object.keys map .length


re-evaluate-pending-modules = !-> re-evaluate-pending-map root.__pending-modules__, (name, module)->
  root.define name, module.dependencies, module.fn

re-evaluate-pending-require-fns = !-> re-evaluate-pending-map root.__pending-require-fns__, (key, req)->
  root.require req.dependencies, req.fn

root.define = (name, dependencies, module-fn)->
  throw new Error "#{name} has already been defined." if root.__modules__[name]
  try
    deps = [get-dep dep for dep in dependencies]
    root.__modules__[name] = module-fn.apply root, deps
    delete root.__pending-modules__[name] if root.__pending-modules__[name]
    re-evaluate-pending-modules!
    re-evaluate-pending-require-fns!
  catch error
    if error instanceof Dependency-not-exist-exception
      root.__pending-modules__[name] = {dependencies, fn: module-fn} if not root.__pending-modules__[name]
    else
      throw new Error error.stack

root.require = (dependencies, fn)->
  start-dependencies-checking! # 正常的
  try
    deps = [get-dep dep for dep in dependencies]
    fn.apply root, deps
    for key, req of root.__pending-require-fns__
      if root.__pending-require-fns__[key].fn is fn
        delete root.__pending-require-fns__[key] 
        break
  catch error 
    if error instanceof Dependency-not-exist-exception
      root.__pending-require-fns__[root.__pending-require-fns-amount__++] = req if not is-already-in-map req = {dependencies, fn}, root.__pending-require-fns__
      # TODO: 定时检查是否满足了条件，fn得以执行了
    else
      throw new Error error.stack

# 找到则用，没找到的，当其为undefined，不理会.
root.require-if-existed = (dependencies, fn)-> # set-timeout -> # 在所有模块加载完成之后，再进行此操作
  try
    deps = [get-dep dep for dep in dependencies]
    fn.apply root, deps
  catch error
    if error instanceof Dependency-not-exist-exception
      console.log "developer doen't provide extension"
      fn.apply root, deps
    else
      throw new Error error.stack
# , 0


is-already-in-map = (checked-value, map)->
  [return true for key, value of map when value.fn is checked-value.fn and value.dependencies is checked-value.dependencies]
  false

start-dependencies-checking = do -> # 闭包，保证只check一次
  timer = null ; is-set = false
  !-> 
    if Meteor? # 有meteor的环境，package的require和app代码的require，会在不同event-loop里。只需要最后在Meteor启动后，进行一次检查就好
      Meteor.startup check if not is-set
      is-set := true
    else  # 若非如此，则假设所有require，均在一个event loop里完成。
      clear-timeout timer if timer # 多次调用，只会留下最后一个timer
      timer := set-timeout check, 0

check = !->
  exist-module = Object.keys root.__modules__
  pendings = []
  for name, module of root.__pending-modules__
    for dependency in module.dependencies
      pendings.push dependency if dependency not in pendings and dependency not in exist-module
      
  for index, pending-fn of root.__pending-require-fns__
    for dependency in pending-fn.dependencies
      pendings.push dependency if dependency not in pendings and dependency not in exist-module

  throw new Error "can't find dependencies: #{pendings.join(', ')}" if pendings.length

