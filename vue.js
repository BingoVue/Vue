class Vue{
  constructor(options){
    // 保存传入选项
    this.$options = options
    this.$data = options.data
    // 响应化
    this.observe(this.$data)

    // 依赖收集
    // new Watcher(this, "test")
    // this.test
    new Compiler(options.el, this)

    // 执行一下钩子
    if(options.created){
      options.created.call(this)
    }
  }

  observe(value){
    if(!value || typeof value !== "object"){
      return
    }
    // 遍历，执行数据响应式
    Object.keys(value).forEach(key=>{
      this.defineReactive(value, key, value[key])
      // 代理data中的属性到vue根上 
      this.proxyData(key);
    })
  }

  defineReactive(obj, key, val){
    // 递归
    this.observe(val)
    // 创建Dep实例和key一一对应
    const dep = new Dep()

    // 给obj定义属性
    Object.defineProperty(obj, key, {
      get(){
        // 依赖收集
        Dep.target && dep.addDep(Dep.target)
        return val
      },
      set(newVal){
        if(newVal === val) return
        val = newVal
        dep.notify()
      }
    })
  }

  // 在vue根上定义属性代理data中的数据 
  proxyData(key) { 
    Object.defineProperty(this, key, { 
      get() { 
        return this.$data[key]; 
      },
      set(newVal) { 
        this.$data[key] = newVal;
      } 
    }); 
  }
}

class Dep {
  constructor(){
    this.deps = []
  }

  addDep(dep){
    this.deps.push(dep)
  }

  notify(){
    // 通知所有watcher更新
    this.deps.forEach(dep => dep.update())
  }
}

// 负责创建data中key和更新函数的映射关系
class Watcher {
  constructor(vm, key, cb){
    this.vm = vm
    this.key = key
    this.cb = cb
    Dep.target = this  // 把watcher实例附加到Dep静态属性上
    this.vm[this.key] // 触发依赖收集
    Dep.target = null
  }

  update(){
    // console.log(`${this.key}属性更新了`)
    this.cb.call(this.vm, this.vm[this.key])
  }
}