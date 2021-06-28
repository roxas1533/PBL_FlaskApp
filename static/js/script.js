var socket = io();
$(document).ready(function(){
    
    // socket.on('connect', function() {
    //     socket.emit('message', {data: '接続しました'});
    // });
    socket.on('res', param => {
        $("#textContent").append("<p>"+param["name"]+"\t>>"+param["data"]+"</p>")
    });
});
function buttonClick(){
    textBox=document.getElementById("msg")
    textName=document.getElementById("name")
    msg=textBox.value
    if (msg) {
        socket.emit('message', {name:textName.value,data: msg});
        textBox.value=''
    }
}