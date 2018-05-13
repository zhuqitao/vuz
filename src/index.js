var ele = document.getElementById('name')
var vuz = new Vuz({
    el: '#vm',
    data: {
        name: 'zhuqitao',
        id: '1'
    }
})

setTimeout(function () {
    vuz.name = 'tao'
}, 2000)
