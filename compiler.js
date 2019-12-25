class Compiler {
  // el: 宿主元素选择器
  // vm: Vue实例
  constructor(el, vm){
    this.$vm = vm;
    this.$el = document.querySelector(el)

    // 执行编译
    this.compile(this.$el)
  }

  compile(el){
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node=>{
      // 判断节点类型
      if(this.isElement(node)){
        // 元素<div></div>
        // console.log('编译元素：', node.nodeName)
        this.compileElement(node)
      }else if(this.isInter(node)){
        // 插值文本{{xxx}}
        // console.log('编译插值文本：', node.textContent)
        this.compileText(node)
      }
      // 递归可能存在的子元素
      if (node.childNodes && node.childNodes.length > 0) { 
        this.compile(node); 
      }
    })
  }

  isElement(node){
    return node.nodeType === 1
  }
  
  isInter(node){
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  // 编译插值文本
  compileText(node){
    // {{xxx}}
    // node.textContent = this.$vm[RegExp.$1]
    this.update(node, RegExp.$1, 'text')
  }

  // 负责更新dom，同时创建watcher实例在两者之间挂钩
  update(node, exp, dir){
    // 首次初始化
    const updaterFn = this[dir+'Updater']
    updaterFn && updaterFn(node, this.$vm[exp])
    // 更新
    new Watcher(this.$vm, exp, function(value){
      updaterFn && updaterFn(node, value)
    })
  }
  textUpdater(node, value){
    node.textContent = value
  }

  htmlUpdater(node, value){
    node.innerHTML = value
  }

  modelUpdater(node, value){
    node.value = value
  }

  compileElement(node){
    // 获取属性
    const nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr=>{
      const attrName = attr.name  // k-text
      const exp = attr.value    // exp

      if(this.isDirective(attrName)){
        // 截取指令名字
        const dir = attrName.substring(2) // text
        // 执行相应更新函数
        this[dir] && this[dir](node, exp)
      }
      // 事件处理
      if(this.isEvent(attrName)){
        // @click="onClick"
        const dir = attrName.substring(1)
        this.eventHandler(node, exp, dir)
      }
    })
  }

  isDirective(attr){
    return attr.indexOf('k-') === 0
  }

  isEvent(attr){
    return attr.indexOf('@') === 0
  }

  text(node, exp){
    this.update(node, exp, 'text')
  }

  html(node, exp){
    this.update(node, exp, 'html')
  }

  model(node, exp){
    this.update(node, exp, 'model')

    // 事件监听
    node.addEventListener('input', e=>{
      this.$vm[exp] = e.target.value
    })
  }

  eventHandler(node, exp, dir){
    const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp]
    if(fn){
      node.addEventListener(dir, fn.bind(this.$vm))
    }
  }
}