// 1. 最初に読まれる
cons("------");

// 1-A. ファイルを読むボタン
let btn_fileRead = $('btn_fileRead');
btn_fileRead.addEventListener('change', fileRead);
let p_msg = $("p_msg");
let jsonData;
let isFileRoaded = false;

// 1-B. 描画初期設定
const elemCanvas = $("canvas");//element
const cvSizeX = 720, cvSizeY = 360;//canvas_size
elemCanvas.setAttribute('width', cvSizeX + "px");
elemCanvas.setAttribute('height', cvSizeY + "px");
const transX = 100, transY = 30;//ダイヤグラムの基準点

// 1-C. canvasContext初期設定
let ctx; 
if(elemCanvas.getContext){
	ctx = elemCanvas.getContext('2d');
	ctx.font = '18px sans-serif';
	ctx.translate(transX, transY);
}

// 1-D. 縮尺
const scales = [0.01, 0.012, 0.015, 0.02, 0.024, 0.03, 0.04, 0.05, 0.06, 0.075, 0.1, 0.12, 0.15, 0.2, 0.24, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.2, 1.5, 2, 2.4, 3, 4, 5, 6, 7.5, 10, 12, 15, 20, 24, 30, 40, 50, 60, 75, 100];

// 1-E. 縮尺補正値,x:60分, y:10km
const correctScaleX = 1100 / cvSizeX; 
const correctScaleY = 11300 / cvSizeY;
let sX = 29, sY = 20; // 縮尺初期値 sx=15:60分、sy=20:10km
let deltaX = -32400, deltaY = 0; // スクロール量

// 1-F. canvas上のドラッグのリスナ
elemCanvas.addEventListener('mousedown', handleMouseDowned, false);
elemCanvas.addEventListener('mousemove', handleMouseMoved, false);
elemCanvas.addEventListener('mouseup', handleMouseUpped, false);
elemCanvas.addEventListener('wheel', getScroll, false);
elemCanvas.addEventListener('wheel', function(event){
	event.preventDefault();
}, {passive: false});

// 1-G. ドラッグしたかクリックしたかを判別する
let clicked = false;
let moveCount = 0;
let dragStartX, dragStartY; //ドラッグする最初の位置

// 2. JSONファイルを読み込む
function fileRead() {
	let file = event.target.files[0];
	let reader = new FileReader();
	reader.onload = function (event) {
		jsonData = JSON.parse(event.target.result);
		cons(jsonData);
		showJsonData();
	}
	reader.readAsText(file);
}

// 2-A. JSONファイルのデータを読み込む
function showJsonData() {
	$("read").setAttribute('style', 'display:none');
	isFileRoaded = true;
	$("copName").innerText = jsonData.copName;
	let travelSection_text = jsonData.lines[0].name;
	cons(jsonData.lines.length);
	for(i = 1; i < jsonData.lines.length; i++){
		travelSection_text += '、' + jsonData.lines[i].name;
	}
	$('travelSection').innerText = travelSection_text;
	$("description").innerText = jsonData.description;
}

// 3. canvas内の操作
// 3-A. マウスでクリックしたら、その場所を記録する
function handleMouseDowned(e){
	let rect = e.target.getBoundingClientRect();
	moveCount = 0;
	dragStartX = (e.clientX - rect.left - transX) / scales[sX] * correctScaleX - deltaX;
	dragStartY = (e.clientY - rect.top - transY) / scales[sY] * correctScaleY - deltaY;
	// cons("|-移動前：" + dragStartX + ", " + dragStartY);
	clicked = true;
	isAutoScroll = false;
}

// 3-B. ドラッグ中も移動しながら描画する
function handleMouseMoved(e){
	if(clicked && isFileRoaded){
		let rect = e.target.getBoundingClientRect();
		deltaX = (e.clientX - rect.left - transX) / scales[sX] * correctScaleX - dragStartX;
		deltaY = (e.clientY - rect.top - transY) / scales[sY] * correctScaleY - dragStartY;
		// cons("--移動中：" + moveCount);
		moveCount++;
		draw();
	}
}

// 3-C. マウスを離したとき
function handleMouseUpped(e){
	if(clicked){
		let rect = e.target.getBoundingClientRect();
		let x = e.clientX - rect.left - transX;
		let y = e.clientY - rect.top - transY;
		cons("-|移動後：" + moveCount);
		clicked = false;
		if(moveCount < 15 && isFileRoaded) draw();
	}
}

// 3-D. スクロールしたとき
function getScroll(e){
	if(isFileRoaded){
		if(e.ctrlKey && e.shiftKey){// 拡大縮小
			if(e.deltaY < 0) sY++;
			else sY--;
			if(e.deltaY < 0) sX ++;
			else sX--;
		}else if(e.shiftKey){//縦軸拡大
			if(e.deltaY < 0) sY++;
			else sY--;
		}else if(e.ctrlKey){//横軸拡大
			if(e.deltaY < 0) sX ++;
			else sX--;
		}else{//横移動
			deltaX = deltaX - e.deltaY / (125 / 36 * scales[sX]);
			isAutoScroll = false;
		}
		if(sX <= -1) sX = 0;
		if(sX >= 41) sX = 40;
		if(sY <= -1) sY = 0;
		if(sY >= 41) sY = 40;

		// cons(e.deltaY);
		draw();
	}
}

// 3-E. 廃止
// function findUnyou(){
// 	draw();
// 	ctx.lineWidth = 1;
// 	ctx.strokeStyle = "black";
// 	ctx.strokeRect(translateX(dragStartX) - 5, translateY(dragStartY) - 5, 10, 10);
// }

// 4. 描画処理内容
let gridXSpanA;//横軸親目盛間隔、時刻表記する
let gridXSpanB;//横軸子目盛間隔
function draw(){
	// リフレッシュ
	ctx.clearRect(-transX, -transY, cvSizeX, cvSizeY);

	// 4-A. 縦罫線の間隔を設定
	if(sX < 3){
		gridXSpanA = 10800;
		gridXSpanB = 3600;
	}else if(sX < 6){
		gridXSpanA = 7200;
		gridXSpanB = 1800;
	}else if(sX < 8){
		gridXSpanA = 3600;
		gridXSpanB = 900;
	}else if(sX < 11){
		gridXSpanA = 1800;
		gridXSpanB = 600;
	}else if(sX < 13){
		gridXSpanA = 1200;
		gridXSpanB = 300;
	}else if(sX < 17){
		gridXSpanA = 600;
		gridXSpanB = 120;
	}else if(sX < 20){
		gridXSpanA = 300;
		gridXSpanB = 60;
	}else if(sX < 23){
		gridXSpanA = 120;
		gridXSpanB = 30;
	}else if(sX < 29){
		gridXSpanA = 60;
		gridXSpanB = 10;
	}else{
		gridXSpanA = 60;
		gridXSpanB = 5;
	}

	// 4-B. 縦副罫線
	ctx.strokeStyle = "#ccc";
	for(i = 0; i < 108000; i += gridXSpanB){
		ctx.strokeRect(translateX(i), 0, 0, cvSizeY);
	}

	// 4-C. 縦主罫線
	ctx.strokeStyle = "#888";
	ctx.lineWidth = 0.8;
	for(i = 0; i < 108000; i += gridXSpanA){
		let hour = Math.floor(i / 3600);
		let min = (i - hour * 3600) / 60;
		if(min < 10) min = "0" + min;
		ctx.fillText(hour + ':' + min, translateX(i), -5);
		ctx.strokeRect(translateX(i), 0, 0, cvSizeY);
	}

	// 4-D. 運用 / ダイヤデータを読み込むコードを今度書く
	ctx.strokeStyle = "#283";
	ctx.lineWidth = 1.5;
	let tmp = 16 * 3600 + 20 * 60;// 試験のための差分
	ctx.beginPath();
	ctx.moveTo(translateX(tmp + 0), translateY(0));
	ctx.lineTo(translateX(tmp + 120),translateY(2000));
	ctx.lineTo(translateX(tmp + 180),translateY(2000));
	ctx.lineTo(translateX(tmp + 360),translateY(5000));
	ctx.lineTo(translateX(tmp + 600),translateY(5000));
	ctx.lineTo(translateX(tmp + 780),translateY(7500));
	ctx.lineTo(translateX(tmp + 840),translateY(7500));
	ctx.lineTo(translateX(tmp + 1200),translateY(10000));
	ctx.lineTo(translateX(tmp + 1800),translateY(10000));
	ctx.lineTo(translateX(tmp + 2400),translateY(5000));
	ctx.lineTo(translateX(tmp + 2640),translateY(5000));
	ctx.lineTo(translateX(tmp + 2640),translateY(2000));
	ctx.lineTo(translateX(tmp + 2880),translateY(2000));
	ctx.lineTo(translateX(tmp + 3300),translateY(0));
	ctx.stroke();

	ctx.strokeStyle = "#f00";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(translateX(tmp + 0), translateY(10000));
	ctx.lineTo(translateX(tmp + 240), translateY(10000));
	ctx.lineTo(translateX(tmp + 720), translateY(0));
	ctx.lineTo(translateX(tmp + 840), translateY(0));
	ctx.stroke();


	
	// 4-E. ダイヤ外枠
	ctx.strokeStyle = "#888"
	ctx.lineWidth = 1;
	ctx.strokeRect(0, 0, 700, 500);

	// 4-F. 現在時刻
	let nowDate = new Date();
	let hour = nowDate.getHours();
	if(hour < 4) hour += 24;
	ctx.strokeStyle = "#f00";
	ctx.strokeRect(translateX(hour * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000), 0, 0, cvSizeY);

	// 4-G. 駅名欄、横罫線
	ctx.clearRect(-transX, -transY, transX, cvSizeY);
	ctx.strokeStyle = "#aaa"
	ctx.lineWidth = 0.3;
	for(i = 0; i < jsonData.lines.length; i++){
		for(j = 0; j < jsonData.lines[i].stations.length; j++){
			ctx.strokeRect(-transX, translateY(jsonData.lines[i].stations[j].dist), cvSizeX, 0);
			ctx.fillText(jsonData.lines[i].stations[j].name, -transX + 5, translateY(jsonData.lines[i].stations[j].dist));
		}
	}

	// 4-H. 時刻テキスト
	ctx.clearRect(0, -transY, cvSizeX, transY);
	for(i = 0; i < 108000; i += gridXSpanA){
		let hour = Math.floor(i / 3600);
		let min = (i - hour * 3600) / 60;
		if(min < 10) min = "0" + min;
		ctx.fillText(hour + ':' + min, translateX(i), -5);
	}
}

// 4-I. 座標変換
function translateX(value){
	value = (value + deltaX) * scales[sX] / correctScaleX;
	return value;
}
function translateY(value){
	value = (value + deltaY) * scales[sY] / correctScaleY;
	return value;
}

// 5. ボタン設定
// 5-A. now / 現在時刻を表示、スクロールは解除される
function setNow(){
	deltaX = -(time[0] * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) + 50 / scales[sX];
	isAutoScroll = false;
}

// 5-B. auto / 自動スクロールする
let isAutoScroll = true;
function track(){
	isAutoScroll = true;
}

// 5-C. extra / 臨時列車を追加する

// 5-D. undo / 元に戻す

// 5-E. redo / 操作をやり直す

// 5-F. expHorizonal / 横を拡大する
function expHorizonal(){
	sX++;
	if(sX > 40) sX = 40;
}

// 5-G. cmpHorizonal / 横を縮小する
function cmpHorizonal(){
	sX--;
	if(sX < 0) sX = 0;
}

// 5-H. set15
function set15(){
	sX = 20;
}

// 5-I. set30
function set30(){
	sX = 17;
}

// 5-J. set60
function set60(){
	sX = 14;
}

// 5-K. expVertical / 縦を拡大する
function expVertical(){
	sY++;
	if(sY > 40) sY = 40;
}

// 5-L. cmpVertical / 縦を縮小する
function cmpVertical(){
	sY--;
	if(sY < 0) sY = 0;
}

// 5-M. adjVertical / 縦を全区間に合わせる

// 5-N. showDown / 下り区間のみ表示

// 5-O. shouUp / 上り区間のみ表示

// 5-P. showBoth / 両区間表示

// 5-Q. setOffset / 時間差運用設定表示

// 5-R. about / 操作方法とか表示

// 5-S. config / 設定を表示

// 6. OperationPanel
let elementRouteIndex = $("routeIndex");
let elementRouteDetail = $("routeDetail");
let elementHelp = $("help");
let elementSetting = $("setting");

// 6-A. #routeIndex / 行路一覧
function showRouteIndex(){
	elementRouteIndex.setAttribute('style', 'display: inline');
	elementRouteDetail.setAttribute('style', 'display: none');
	elementHelp.setAttribute('style', 'display: none');
	elementSetting.setAttribute('style', 'display: none');
}

// 6-B. #routeDetail / スタフ表示
function showRouteDetail(opNum){
	elementRouteIndex.setAttribute('style', 'display: none');
	elementRouteDetail.setAttribute('style', 'display: inline');
	elementHelp.setAttribute('style', 'display: none');
	elementSetting.setAttribute('style', 'display: none');

	if(opNum == "1428A") ;
}

// 6-C. #help / 操作方法表示
function showHelp(){
	elementRouteIndex.setAttribute('style', 'display: none');
	elementRouteDetail.setAttribute('style', 'display: none');
	elementHelp.setAttribute('style', 'display: inline');
	elementSetting.setAttribute('style', 'display: none');
}

// 6-D. #setting / 設定表示
function showSetting(){
	elementRouteIndex.setAttribute('style', 'display: none');
	elementRouteDetail.setAttribute('style', 'display: none');
	elementHelp.setAttribute('style', 'display: none');
	elementSetting.setAttribute('style', 'display: inline');
}

// 7. 常に実行する
let nowHour = $("nowHour");
let nowTime = $("nowTime");
let nowDate = new Date();
let time = [0, 0, 0];
window.addEventListener('DOMContentLoaded', function(){

	// 7-A. 時刻表示
	setInterval(() =>{
		nowDate = new Date();
		time[0] = nowDate.getHours();
		time[1] = nowDate.getMinutes();
		time[2] = nowDate.getSeconds();
		if(time[0] <= 4) time[0] += 24;

		if(time[2] % 15 == 0) nowTime.setAttribute('style', 'color:orange;font-size:3em');
		else if(time[2] % 10 == 0) nowTime.setAttribute('style', 'color:yellow;font-size:3em');
		else nowTime.setAttribute('style', 'color:#3c3;font-size:3em');
		
		for(i = 0; i < 3; i++){
			if(time[i] < 10) time[i] = '0' + time[i];
		}
		nowHour.innerText = time[0];
		nowTime.innerHTML = time[1] + '<span style="font-size:0.4em">分</span>' + time[2] + '<span style="font-size:0.4em">秒</span>';
	}, 100);

	// 7-B. 描画処理
	this.setInterval(() => {
		if(isFileRoaded){
			nowDate = new Date();
				if(isAutoScroll){
					deltaX = -(time[0] * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) + 50 / scales[sX];
				}
				draw();
		}
	}, 500);
})


// 8. getElem短縮
function $(elemId) {
	return document.getElementById(elemId);
}

// 9. console.log短縮
function cons(content) {
	return console.log(content);
}
