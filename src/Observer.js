function defineReactive (data, key, val) {

    observe(val)   // 遍历所有属性

    var dep = new Dep()

    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
            if (Dep.target) {
                // 订阅者初始化  需要把订阅者自己添加到订阅者容器
                dep.addSub(Dep.target)
            }
            return val
        },
        set: function (newVal) {
            if (val === newVal) {
                return
            }

            val = newVal

            dep.notify()  // 数据变化  通知所有订阅者
        }
    })
}


function observe (data) {
    if (!data || typeof data !== 'object') {
        return
    }
    Object.keys(data).forEach(function(key) {
        defineReactive(data, key, data[key]);
    })
}

// 订阅者容器
function Dep () {
    this.subs = []
}
Dep.prototype = {
    addSub: function (sub) {
        this.subs.push(sub)
    },
    notify: function () {
        this.subs.map((item, index) => {
            item.update()
        })
    }
}

// 订阅者 
function Watcher (vm, exp, cb) {
    this.cb = cb
    this.vm = vm
    this.exp = exp
    this.value = this.get()    // 将自己添加到订阅者容器
}
Watcher.prototype = {
    update: function () {
        this.run()
    },
    run: function () {
        var value = this.vm.data[this.exp]
        var oldVal = this.value
        if (oldVal !== value) {
            this.value = value
            this.cb.call(this.vm, value, oldVal)
        }
    },
    get: function () {
        Dep.target = this   // 缓存自己
        var value = this.vm.data[this.exp]   // 强制执行监听器里的get函数
        Dep.target = null   // 释放自己
        return value
    }
}

// 模板解析
function Compile (el, vm) {
    this.vm = vm
    this.el = document.querySelector(el)
    this.fragment = null
    this.init()
}

Compile.prototype = {
    init: function () {
        if (this.el) {
            this.fragment = this.nodeTofragment(this.el)  // fragment 缓存
            this.compileElement(this.fragment)            // 解析模板
            this.el.appendChild(this.fragment)            // 把fragment 缓存 返回到dom
        } else {
            console.log('dom元素不存在')
        }
    },

    // 创建fragment缓存
    nodeTofragment: function (el) {
        var fragment = document.createDocumentFragment()
        var child = el.firstChild
        while (child) {
            fragment.appendChild(child)
            child = el.firstChild
            console.log(child)
        }
        return fragment
    },

    // 判断是文本模板 还是v-指令 模板
    compileElement: function (el) {
        var childNodes = el.childNodes
        childNodes.forEach(node => {
            var reg = /\{\{(.*)\}\}/
            var text = node.textContent

            if (this.isElementNode(node)) {
                this.compile(node)
            } else if (this.isTextNode(node) && reg.test(text)) {
                // 文本节点
                this.compileText(node, reg.exec(text)[1])
            }
            
            // 继续 解析子节点
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    },

    // 解析 (v-model、事件指令) 指令模板
    compile: function (node) {
        var nodeAttrs = node.attributes
        Array.prototype.forEach.call(nodeAttrs, (attr) => {
            var attrName = attr.name
            if (this.isDirective(attrName)) {
                // 判断是不是 v- 开头的指令
                var exp = attr.value
                var dir = attrName.substring(2)
                if (this.isEventDirective) {
                    // 是否 v-on  事件指令
                    this.compileEvent(node, this.vm, exp, dir)
                } else {
                    // v-model 指令
                    this.compileModel(node, this.vm, exp, dir)
                }
                
                node.removeAttribute(attrName)
            }
        })
    },

    // 文本模板
    compileText: function (node, exp) {
        var initText = this.vm[exp]
        this.updateText(node, initText)
        new Watcher(this.vm, exp, (value) => {
            this.updateText(node, value)
        })
    },

    // 事件指令 解析
    compileEvent: function (node, vm, exp, dir) {
        var eventType = dir.split(":")[1]
        var cb = vm.methods && vm.methods[exp]

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false)
        }
    },

    // v-model 解析
    compileModel: function (node, vm, exp, dir) {
        var val = this.vm[exp]
        this.modelUpdater(node, val)

        new Watcher(this.vm, exp, value => {
            this.modelUpdater(node, value)
        })

        node.addEventListener('input', e => {
            var newValue = e.target.value
            if (val === newValue) {
                return
            }

            this.vm[exp] = newValue
            val = newValue
        })
    },

    // 更新文本模板数据
    updateText: function (node, value) {
        node.textContent = value ? value : ''
    },

    // model 双向绑定 数据更新
    modelUpdater: function (node, value, oldValue) {
        node.value = value ? value : ''
    },

    // 判断是否是 v- 开头的指令
    isDirective: function (attr) {
        return attr.startsWith('v-')
    },

    // 判断是否是 事件指令
    isEventDirective: function (dir) {
        return attr.startsWith('on:')
    },

    // 判断是否是 element 标签
    isElementNode: function (node) {
        return node.nodeType*1 === 1
    },

    // 判断是否是文本标签
    isTextNode: function (node) {
        return node.nodeType*1 === 3
    }

}

// vuz 实例
function Vuz (options) {

    this.vm = this
    this.data = options.data

    Object.keys(this.data).map(key => {
        this.proxyKeys(key)
    })

    observe(this.data)


    new Compile(options.el, this.vm)

    return this
}

Vuz.prototype = {
    proxyKeys: function (key) {
        Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            get: () => {
                return this.data[key]
            },
            set: (newVal) => {
                this.data[key] = newVal
            }
        })
    }
}



