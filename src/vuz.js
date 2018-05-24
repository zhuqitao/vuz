function observerData(data, key, val) {
	observe(val)

	var dep = new Dep()

	Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function() {
			if (Dep.target) {
				dep.subs.push(Dep.target)
			}
			return val
		},
		set: function(newVal) {
			if (val === newVal) {
				return
			}
			val = newVal
			dep.notify()
		}
	})
}

function observe(data) {
	if (data && typeof data !== 'object' && typeof data !== 'function') {
		return
	}
	for (let key in data) {
		observerData(data, key, data[key])
	}
}

function Dep() {
	this.subs = []
}
Dep.proyotype = {
	addSub: function(sub) {
		this.subs.push(sub)
	},
	notify: function() {
		this.subs.map((item, index) => {
			item.update()
		})
	}
}

function Watcher(vm, exp, cb) {
	this.vm = vm
	this.exp = exp
	this.cb = cb
	this.value = this.get()
}
Watcher.proyotype = {
	update: function() {
		this.run()
	},
	run: function() {
		var value = this.vm.data[exp]
		var oldVal = this.value
		if (value !== oldVal) {
			this.value = value
			this.cb.call(vm, this.value, oldVal)
		}
	},
	get: function() {
		Dep.target = this
		var value = this.vm.data[this.exp] // 强制获取 vm中的data  触发 data的set
		Dep.target = null
		return value
	}
}

function Compile(el, vm) {
	this.vm = vm
	this.el = document.querySelector(el)
	this.fragment = null
	this.init()
}
Compile.prototype = {
	init: function() {
		if (this.el) {
			this.fragment = this.nodeToFragment(this.el)
			this.complieElement(this.fragment)
			this.el.appendChild(fragment)
		} else {
			alert('dom 元素不存在')
		}
	},

	nodeToFragment: function(el) {
		var fragment = document.createDocumentFragment()
		var firstChild = el.firstChild
		while (firstChild) {
			fragment.appendChild(firstChild)
			firstChild = el.firstChild
		}
		return fragment
	},

	complieElement: function(el) {
		var childNodes = el.childNodes
		childNodes.forEach(node => {

			var reg = /\{\{(.*)\}\}/
			var text = node.textContent

			if (this.isElementNode(node)) {
				// 节点
				this.compileNode(node)
			} else if (this.isTextNode(node) && reg.test(text)) {
				this.compileText(node, reg.exec(text)[1])
			}

			if (node.childNodes && node.childNodes.length > 0) {
				this.complieElement(node)
			}
		})
	},

	compileText: function(node, exp) {
		var initText = this.vm.data[exp]
		this.updateText(node, initText)

		new Watcher(this.vm, exp, (value) => {
			this.updateText(node, value)
		})
	},

	compileNode: function(node) {
		var attrs = node.attributes
		attrs = Array.from(attrs)
		attrs.map(attr => {
			var attrName = attr.name
			var dir = attrName.slice(2)
			var exp = attr.value
			if (this.isDirective(attrName)) {
				if (this.isEventDirective) {
					this.compileEvent(node, this.vm, exp, dir)
				} else {
					this.compileModel(node, this.vm, exp, dir)
				}
			}
		})
		// Array.prototype.forEach.call(attrs, (attr) => {
		// 	console.log(attr)
		// })
	},

	// 事件指令 解析
	compileEvent: function(node, vm, exp, dir) {
		// alert()
		var eventType = dir.split(":")[1]
		var cb = vm.methods && vm.methods[exp]

		if (eventType && cb) {
			node.addEventListener(eventType, cb.bind(vm), false)
		}
	},

	// v-model 解析
	compileModel: function(node, vm, exp, dir) {
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

	isElementNode: function(node) {
		return node.nodeType * 1 === 1
	},

	// 判断是否是 v- 开头的指令
	isDirective: function(attr) {
		return attr.startsWith('v-')
	},

	// 判断是否是 事件指令
	isEventDirective: function(dir) {
		return dir.startsWith('on:')
	},

	isTextNode: function(node) {
		return node.nodeType * 1 === 3
	},

	updateText: function(ndoe, value) {
		node.textContent = value ? value : ''
	},
	// model 双向绑定 数据更新
	modelUpdater: function(node, value, oldValue) {
		node.value = value ? value : ''
	},
}

function Vuz(option) {
	this.data = option.data
	this.methods = option.methods

	observe(this.data)

	new Compile(option.el, this)
	return this
}

Vuz.prototype = {
	proxy: function() {
		for (let key in this.data) {
			Object.defineProperty(this, key, {
				enumerable: true,
				configurable: true,
				get: function() {
					return this.data[key]
				},
				set: function(newVal) {
					if (newVal !== this.data[key]) {
						this.data[key] = newVal
					}

				}
			})
		}

	}
}