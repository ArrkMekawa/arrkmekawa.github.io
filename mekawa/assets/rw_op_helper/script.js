// 1. 最初に読まれる
cons("------");
//初期設定
const cvSizeX = 720, cvSizeY = 360;//1-B:canvas_size
let transX = 100, transY = 30;//1-C:ダイヤグラムの基準点
const spaceOfSection = 500; // 2-B:セクション間の距離(m)
let hourOffset = 0, minOffset = 0;//1-H:差分設定
let isLocationShowing = true; // 4-H. 在線表示を出すか否か
let isAutoScroll = true; // 5-B:自動スクロール
let isShowMajorStnOnly = false; // 6-D4:主要駅のみ表示

// 1-A. ファイルを読むボタン
let btn_fileRead = $('btn_fileRead');
btn_fileRead.addEventListener('change', fileRead);
let p_msg = $("p_msg");
let jsonData;
let isFileRoaded = false;

// 1-B. 描画初期設定
const elemCanvas = $("canvas");//element
elemCanvas.setAttribute('width', cvSizeX + "px");
elemCanvas.setAttribute('height', cvSizeY + "px");

// 1-C. canvasContext初期設定
let ctx; 
let isTranslated = false; // ctxが座標変換されたかどうか
const img = new Image();
img.src = "assets/logo_name.png";
img.addEventListener('load', function(){
	if(isTranslated) ctx.drawImage(img, -transX, 130, cvSizeX - 10, 100);
	else ctx.drawImage(img, -transX, 130, cvSizeX - 10, 100);
})
if(elemCanvas.getContext){
	ctx = elemCanvas.getContext('2d');
	ctx.font = "48px 'm+ 2c medium'";
	ctx.lineWidth = 2;
	ctx.fillStyle = '#fff';
	ctx.fillText("鉄道運行管理補助ツール ", 5, 50, cvSizeX - 5);
	ctx.strokeText("鉄道運行管理補助ツール", 5, 50, cvSizeX - 5);
	ctx.fillStyle = '#064';
	ctx.font = "24px 'm+ 2c regular'";
	ctx.fillText('このツールは、予め用意しておいたJSONファイルを読ませることで、', 15, 100, cvSizeX - 15);
	ctx.fillText('ダイヤグラムや行路を表示・編集できるようになるツールです。', 15, 130, cvSizeX - 15);
	let rightTextWidth = 200;
	ctx.fillText('近日、JSONフォーマット公開予定 | Twitter:@Arrk_YR', rightTextWidth, 310, cvSizeX - rightTextWidth - 10);
	ctx.translate(transX, transY);
	isTranslated = true;
	ctx.font = "18px 'M+ P type-1 (basic latin) Regular', 'M+ type-2 (general-j) Regular'";
	ctx.fillStyle = "#333";
}

// 1-D. 縮尺
const scales = [0.01, 0.012, 0.015, 0.02, 0.024, 0.03, 0.04, 0.05, 0.06, 0.075, 0.1, 0.12, 0.15, 0.2, 0.24, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.2, 1.5, 2, 2.4, 3, 4, 5, 6, 7.5, 10, 12, 15, 20, 24, 30, 40, 50, 60, 75, 100];

// 1-E. 縮尺補正値,x:60分, y:10km
const correctScaleX = 1100 / cvSizeX; 
const correctScaleY = 11300 / cvSizeY;
let sX = 15, sY = 20; // 縮尺初期値 sx=15:60分、sy=20:10km
let deltaX = 0, deltaY = 0; // スクロール量

// 1-F. canvas上のドラッグのリスナ
elemCanvas.addEventListener('mousedown', handleMouseDowned, false);
elemCanvas.addEventListener('mousemove', handleMouseMoved, false);
elemCanvas.addEventListener('mouseup', handleMouseUpped, false);
elemCanvas.addEventListener('wheel', getScroll, false);
elemCanvas.addEventListener('wheel', function(event){
	event.preventDefault();
}, {passive: false});
document.addEventListener('keydown', getKey);

// 1-G. ドラッグしたかクリックしたかを判別する
let clicked = false;
let moveCount = 0;
let dragStartX, dragStartY; //ドラッグする最初の位置

// 1-H. 差分設定をする
let timeOffset;
function setOffset(hourOffset, minOffset){
	timeOffset = hourOffset * 3600 + minOffset * 60;
	if(timeOffset != 0) $("description").innerText = jsonData.description + " +" + hourOffset + "時間" + minOffset + "分";
	else $("description").innerText = jsonData.description;
}

// 2. JSONファイルを読み込む
function fileRead() {
	let file = event.target.files[0];
	let reader = new FileReader();
	reader.onload = function (event) {
		jsonData = JSON.parse(event.target.result);
		cons(jsonData);
		showJsonData();    // 2-A. 路線名などを表示する
		setDistIndex();    // 2-B. 駅の距離のインデックスを作成する
		adjVertical();     // 5-M. 縦を全体に合わせる
		makeStnNumIndex(); // 2-C. 駅番号をインデックス化する
		makeOpData();      // 2-D. 在線表示用データを作成する
		$("chOfsBtns").setAttribute("style", "display: inline;"); // 差分偏光ボタン表示
	}
	reader.readAsText(file);
}

// 2-A. JSONファイルのデータを読み込む
function showJsonData() {
	$("read").setAttribute('style', 'display:none');
	isFileRoaded = true;
	$("copName").innerHTML = '<span class="scrollableContent">' + jsonData.copName + '</span>';
	let travelSection_text = jsonData.sections[0].name;
	cons(jsonData.sections.length);
	for(let i = 1; i < jsonData.sections.length; i++){
		travelSection_text += '、' + jsonData.sections[i].name;
	}
	$('travelSection').innerText = travelSection_text;
	setOffset(hourOffset, minOffset);
}


// 2-B. JSONファイルのデータ内にある距離をインデックス化する
let distOfStnsIndex = [];
function setDistIndex(){
	let offset = 0;
	for(let i = 0; i < jsonData.sections.length; i++){
		distOfStnsIndex.push([]);
		for(let j = 0; j < jsonData.sections[i].stations.length; j++){
			let value = offset + jsonData.sections[i].stations[j].dist - jsonData.sections[i].stations[0].dist;
			distOfStnsIndex[i].push(value);
		}
		offset += jsonData.sections[i].stations[jsonData.sections[i].stations.length - 1].dist + spaceOfSection;
	}
	cons("距離一覧↓");
	cons(distOfStnsIndex);
}

// 2-C. JSONファイルのデータ内にある駅番号をインデックス化する
let stnNumIndex = new Object();
function makeStnNumIndex(){
	for(let i = 0; i < jsonData.sections.length; i++){
		let secIndex = new Object();
		for(let j = 0; j < jsonData.sections[i].stations.length; j++){
			secIndex[jsonData.sections[i].stations[j].name] = j;
		}
		stnNumIndex[jsonData.sections[i].name] = secIndex;
		stnNumIndex[jsonData.sections[i].name].index = i;
	}
	cons("駅番号インデックス↓");
	cons(stnNumIndex);
}

// 2-D. 在線表示のための運用データを作成する
let operationData;
function makeOpData(){
	operationData = [];
	for(let i = 0; i < jsonData.operations.length; i++){
		let operation = new Object();
		operation.opNum = jsonData.operations[i].opNum ?? "未設定";
		operation.routeNum = jsonData.operations[i].routeNum ?? null;
		operation.opPrev = jsonData.operations[i].opPrevNum ?? null;
		operation.opNext = jsonData.operations[i].opNextNum ?? null;
		operation.type = jsonData.operations[i].type ?? "普通";
		operation.color = jsonData.operations[i].color ?? "#222";
		operation.timeSchedule = [];
		for(let j = 0; j < jsonData.operations[i].stops.length; j++){
			if(jsonData.operations[i].stops[j].arrTime != null){
				let tmp = new Object();
				tmp.time = time2sec(jsonData.operations[i].stops[j].arrTime);
				let secIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName].index;
				let stnIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName][jsonData.operations[i].stops[j].stnName];
				tmp.location = distOfStnsIndex[secIndex][stnIndex];
				if(j > 0){
					if(tmp.location - operation.timeSchedule[j-1].location > 0) tmp.direction = "d";
					else if(tmp.location - operation.timeSchedule[j-1].location < 0) tmp.direction = "u";
					else tmp.direction = operation.timeSchedule[j-1].direction;
				}
				operation.timeSchedule.push(tmp);
			}
			if(jsonData.operations[i].stops[j].depTime != null){
				let tmp = new Object();
				tmp.time = time2sec(jsonData.operations[i].stops[j].depTime);
				let secIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName].index;
				let stnIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName][jsonData.operations[i].stops[j].stnName];
				tmp.location = distOfStnsIndex[secIndex][stnIndex];
				if(j > 0){
					if(tmp.location - operation.timeSchedule[j-1].location > 0) tmp.direction = "d";
					else if(tmp.location - operation.timeSchedule[j-1].location < 0) tmp.direction = "u";
					else tmp.direction = operation.timeSchedule[j-1].direction;
				}
				operation.timeSchedule.push(tmp);
			}
		}
		let directionBuffer = "";
		// cons(operation.timeSchedule.length)
		for(let j = operation.timeSchedule.length - 1; j >= 0; j--){
			if(operation.timeSchedule[j].direction != undefined){
				directionBuffer = operation.timeSchedule[j].direction;
				// cons("directionBuffer = " + directionBuffer)
			}else{
				operation.timeSchedule[j].direction = directionBuffer;
				// cons("[" + i + "][" + j + "]書き換え完了：" + directionBuffer);
			}
		}
		operationData.push(operation);
	}
	cons("在線用インデックス↓")
	cons(operationData);
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

// 3-E. キーが押されたとき
let isInfoEditerOpen = false;
function getKey(e){
	// cons(e.key);
	if(isFileRoaded && !isInfoEditerOpen){
		switch(e.key){
			case "a":
				deltaX += 15 / scales[sX] * correctScaleX;
				isAutoScroll = false;
				break;
			case "d":
				deltaX -= 15 / scales[sX] * correctScaleX;
				isAutoScroll = false;
				break;
			case "w":
				deltaY += 15 / scales[sY] * correctScaleY;
				break;
			case "s":
				deltaY -= 15 / scales[sY] * correctScaleY;
				break;
			case "A":
				cmpHorizonal();
				break;
			case "D":
				expHorizonal();
				break;
			case "W":
				cmpVertical();
				break;
			case "S":
				expVertical();
				break;
			case " ":
				track();
				break;
		}
		draw();
	}else{
		if(e.key == "Escape"){
			infoEdit('close');
		}
	}
}

// 4. 描画処理＋スタフ一覧更新
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
	ctx.strokeStyle = "#aaa";
	for(let i = 0; i < 108000; i += gridXSpanB){
		ctx.strokeRect(translateX(i), 0, 0, cvSizeY);
	}

	// 4-C. 縦主罫線
	ctx.strokeStyle = "#888";
	ctx.lineWidth = 0.8;
	for(let i = 0; i < 108000; i += gridXSpanA){
		let hour = Math.floor(i / 3600);
		let min = (i - hour * 3600) / 60;
		if(min < 10) min = "0" + min;
		ctx.fillText(hour + ':' + min, translateX(i), -5);
		ctx.strokeRect(translateX(i), 0, 0, cvSizeY);
	}

	// 4-D. 運用
	ctx.strokeStyle = "#283";
	ctx.lineWidth = 2.5;

	let posX, posY;
	let moved = false;
	for(let i = 0; i < jsonData.operations.length; i++){
		ctx.beginPath();
		ctx.strokeStyle = jsonData.operations[i].color;
		moved = false;
		for(let j = 0; j < jsonData.operations[i].stops.length; j++){
			//先に駅(y)を取得する
			let secIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName].index;
			let stnIndex = stnNumIndex[jsonData.operations[i].stops[j].lineName][jsonData.operations[i].stops[j].stnName];
			// cons("sec: " + secIndex + ", stn: " + stnIndex);
			posY = distOfStnsIndex[secIndex][stnIndex]; 

			if(jsonData.operations[i].stops[j].arrTime != null){
				//時間
				let arrTime = time2sec(jsonData.operations[i].stops[j].arrTime);
				posX = arrTime + timeOffset;

				// cons("secIndex: " + secId + ", stnIndex: " + stnIndex); 
				if(moved == false || jsonData.operations[i].stops[j].hideLine == true){
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(translateX(posX), translateY(posY));
					moved = true;
				}else{	
					ctx.lineTo(translateX(posX), translateY(posY));
				}
			}
			if(jsonData.operations[i].stops[j].depTime != null){
				//時間
				let depTime = time2sec(jsonData.operations[i].stops[j].depTime);
				posX = depTime + timeOffset;

				if(moved == false || jsonData.operations[i].stops[j].hideLine == true){
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(translateX(posX), translateY(posY));
					moved = true;
				}else{
					ctx.lineTo(translateX(posX), translateY(posY));
				}
			}
		}
		ctx.stroke();
	}
	
	// 4-E. ダイヤ外枠
	ctx.strokeStyle = "#888"
	ctx.lineWidth = 1;
	ctx.strokeRect(0, 0, 700, 500);

	// 4-F. 現在時刻
	let nowDate = new Date();
	let nowTime = nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000;
	if(nowTime < 14400) nowTime += 86400;
	ctx.strokeStyle = "#f00";
	ctx.strokeRect(translateX(nowTime), 0, 0, cvSizeY);

	// 4-G. 在線表示(ONの場合のみ)
	if(isLocationShowing){
		nowTime -= timeOffset;
		ctx.clearRect(0, 0, 200, cvSizeY);
		ctx.textBaseline = "middle";
		ctx.strokeStyle = "#fff"
		for(let i = 0; i <operationData.length; i++ ){
			for(let j = 0; j < operationData[i].timeSchedule.length - 1; j++){
				let fromTime = operationData[i].timeSchedule[j].time;
				let toTime = operationData[i].timeSchedule[j + 1].time;
				if(fromTime <= nowTime && nowTime <= toTime){
					let fromPos = operationData[i].timeSchedule[j].location;
					let toPos = operationData[i].timeSchedule[j + 1].location;
					let progress = (nowTime - fromTime) / (toTime - fromTime);
					let drawViewPosY = translateY(fromPos + (toPos - fromPos) * progress) ;
					let direction = operationData[i].timeSchedule[j].direction;
					if(fromPos < toPos || (fromPos == toPos && direction == "d")){ //下り線
						ctx.beginPath();
						ctx.fillStyle = operationData[i].color;
						ctx.moveTo(115, drawViewPosY);
						ctx.lineTo(125, drawViewPosY - 10);
						ctx.lineTo(125, drawViewPosY);
						ctx.lineTo(115, drawViewPosY + 10);
						ctx.lineTo(105, drawViewPosY);
						ctx.lineTo(105, drawViewPosY - 10);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
						ctx.textAlign = "start";
						ctx.fillStyle = "#222";
						ctx.fillText(operationData[i].opNum + "/" + operationData[i].type, 125, drawViewPosY, 75);
						// cons(operationData[i].opNum + "/" + operationData[i].type + "," + j)
					}else{
						ctx.beginPath();
						ctx.fillStyle = operationData[i].color;
						ctx.moveTo(85, drawViewPosY);
						ctx.lineTo(75, drawViewPosY + 10);
						ctx.lineTo(75, drawViewPosY);
						ctx.lineTo(85, drawViewPosY - 10);
						ctx.lineTo(95, drawViewPosY);
						ctx.lineTo(95, drawViewPosY + 10);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
						ctx.textAlign = "end";
						ctx.fillStyle = "#222";
						ctx.fillText(operationData[i].opNum + "/" + operationData[i].type, 75, drawViewPosY, 75);
						// cons(operationData[i].opNum + "/" + operationData[i].type + "," + j)
					}
				}
			}
		}
		ctx.strokeStyle = "#888";
		// ctx.lineWidth
		ctx.strokeRect(100, 0, 100, cvSizeY);
	}

	// 4-H. 横罫線
	ctx.clearRect(-transX, -transY, transX, cvSizeY);
	ctx.strokeStyle = "#999"
	ctx.lineWidth = 0.3;
	let drawY;
	setY = 0;
	for(let i = 0; i < jsonData.sections.length; i++){
		for(let j = 0; j < jsonData.sections[i].stations.length; j++){
			if(j == 0 || j == jsonData.sections[i].stations.length - 1 || jsonData.sections[i].stations[j].isMajor){
				ctx.strokeStyle = "#666";
				ctx.lineWidth = 0.7;
			}else{
				if(isShowMajorStnOnly) continue;
				ctx.strokeStyle = "#999";
				ctx.lineWidth = 0.3;
			}

			 ctx.strokeRect(-transX, translateY(distOfStnsIndex[i][j]), cvSizeX, 0);
		}
	}
	
	// 4-I. 時刻テキスト
	ctx.clearRect(0, -transY, cvSizeX, transY);
	ctx.textAlign = "start";
	ctx.textBaseline = "alphabetic";
	for(let i = 0; i < 108000; i += gridXSpanA){
		let hour = Math.floor(i / 3600);
		let min = (i - hour * 3600) / 60;
		if(min < 10) min = "0" + min;
		ctx.fillText(hour + ':' + min, translateX(i), -5);
	}

	// 4-J. 駅名欄
	ctx.clearRect(-transX, -transY, transX, cvSizeY);
	ctx.strokeStyle = "#aaa"
	ctx.lineWidth = 0.3;
	ctx.textAlign = 'right';
	for(let i = 0; i < jsonData.sections.length; i++){
		for(let j = 0; j < jsonData.sections[i].stations.length; j++){
			if(j != 0 && j != jsonData.sections[i].stations.length - 1 && !jsonData.sections[i].stations[j].isMajor && isShowMajorStnOnly) continue;
			ctx.fillText(jsonData.sections[i].stations[j].name, 0, translateY(distOfStnsIndex[i][j]), 100);
		}
	}
	ctx.textAlign = 'left';

}

// 4-K. 座標変換
function translateX(value){
	value = (value + deltaX) * scales[sX] / correctScaleX;
	return value;
}
function translateY(value){
	value = (value + deltaY) * scales[sY] / correctScaleY;
	return value;
}

// 4-L. 時刻変換
function time2sec(time){
	let hour = Math.floor(time / 10000);
	let min = Math.floor((time % 10000) / 100);
	let sec = time % 100;
	// cons(time + " >> " + hour + "," + min + "," + sec);
	return hour * 3600 + min * 60 + sec;
}

// 5. ボタン設定
// 5-A. now / 現在時刻を表示、スクロールは解除される
function setNow(){
	deltaX = -(time[0] * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) + 50 / scales[sX];
	isAutoScroll = false;
}

// 5-B. auto / 自動スクロールする
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
	if(isLocationShowing) sX = 18;
	else sX = 20;
}

// 5-I. set30
function set30(){
	if(isLocationShowing) sX = 15;
	else 	sX = 17;
}

// 5-J. set60
function set60(){
	if(isLocationShowing) sX = 12;
	else 	sX = 14;
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
function adjVertical(){
	let last = distOfStnsIndex[distOfStnsIndex.length - 1][distOfStnsIndex[distOfStnsIndex.length - 1].length - 1];
	deltaY = 0;
	for(let i = 1; i < scales.length - 1; i++){
		if(correctScaleY * scales[i + 1] * cvSizeY < last){
			sY = i;
		} 
		else break;
	}
}

// 5-N. showDown / 下り区間のみ表示

// 5-O. shouUp / 上り区間のみ表示

// 5-P. showBoth / 両区間表示

// 5-Q. showLocationDescriber / 在線表示切り替え(時間差運用設定表示から変更)
function switchTrainLocationView(){
	if(isLocationShowing) isLocationShowing = false;
	else isLocationShowing = true;
	cons("在線表示切替" + isLocationShowing)
}

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

	if(opNum == "1428A") ;//書きかけ
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

// 6-D1. #setting -> changeOffset / ボタンから変更
function changeOffsetbyInput(value){
	if(isFileRoaded){
		timeOffset += +value;
		commitOffset();
	}
}

// 6-D2. #setting -> setOffsetbyInput / 入力欄から変更
let elemTimeOffset = $("timeOffset");
let keyBuffer = [0, 0, 0, 0];
elemTimeOffset.addEventListener('keydown', function(e){
	if(isFileRoaded){
		switch(e.key){
			case "ArrowUp":
				timeOffset += 60;
				break;
			case "ArrowDown":
				timeOffset -= 60;
				break;
			case "ArrowRight":
				timeOffset += 3600;
				break;
			case "ArrowLeft":
				timeOffset -= 3600;
				break;
			case "Backspace":
				timeOffset = 0;
				break;
			case "-":
				timeOffset *= -1;
				break;
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "0":
				keyBuffer.push(+e.key);
				keyBuffer.splice(0, 1);
				// cons(keyBuffer);
				timeOffset = keyBuffer[0] * 36000 + keyBuffer[1] * 3600 + keyBuffer[2] * 600 + keyBuffer[3] * 60;
				break;
			case "Enter":
				showRouteIndex();
			default:;
		}
		commitOffset();
	}
});

// 6-D3. #setting -> resetOffset / 差分リセット
function resetOffset(){
	if(isFileRoaded){
		timeOffset = 0;
		commitOffset();
	}
}

// 6-D4. #setting -> showMajor / 主要駅のみ表示
function showMajorOnly(value){
	isShowMajorStnOnly = value;
}

function commitOffset(){
	let value = (timeOffset / 3600 + "").split('.');
	value[1] = (timeOffset % 3600) / 60;
	let displayMin = Math.abs(Math.round(value[1]));
	if(displayMin < 10) displayMin = "0" + displayMin;
	$('timeOffset').value = value[0] + ":" + displayMin;
	$("description").innerText = jsonData.description + " / 差分：" + $('timeOffset').value;
	if(timeOffset == 0) $("description").innerText = jsonData.description;
}

// 7. インフォメーションボード
const elemInfoEditor = $('infoEditor');
let info = "";
elemInfoEditor.setAttribute('style', 'display:none');
function infoEdit(value){
	cons(value);
	if(value == 'open'){
		isInfoEditerOpen = true;
		elemInfoEditor.setAttribute('style', 'display:block');
	}else if(value == 'edit'){
		info = $('infoContent').value.replace(/\r?\n/g, ' ');
		// cons(info);
	}else if(value == 'close'){
		elemInfoEditor.setAttribute('style', 'display:none');
		isInfoEditerOpen = false;
	}else if(value == 'confirm'){
		$('information').innerText = info.replace(/\r?\n/g, '　');
		cons(info);
		if(info == "") $('information').innerText = "⇦クリックして常に表示するインフォメーションを編集できます。長文の場合は自動でスクロールします。";
	}
}

// 8. 常に実行する
let nowHour = $("nowHour");
let nowTime = $("nowTime");
let nowDate = new Date();
let time = [0, 0, 0]; // 8. 現在時刻(時・分・秒)
let scrollable = document.getElementsByClassName('scrollable');
let scrollableContent = document.getElementsByClassName('scrollableContent');
// cons(scrollable);
// cons(scrollableContent);
const move = 2; //移動速度
let moveAmount = [];
let moveRange = [];
for(let i = 0; i < scrollable.length; i++){
	moveRange.push(scrollableContent[i].offsetWidth - scrollable[i].offsetWidth);
	moveAmount.push(-500);
}
// cons(moveRange);
// cons(move);
window.addEventListener('DOMContentLoaded', function(){
	// 8-A. 時刻表示
	setInterval(() =>{
		nowDate = new Date();
		time[0] = nowDate.getHours();
		time[1] = nowDate.getMinutes();
		time[2] = nowDate.getSeconds();
		if(time[0] <= 4) time[0] += 24;

		if(time[2] % 15 == 0) nowTime.setAttribute('style', 'color:orange;font-size:3em');
		else if(time[2] % 10 == 0) nowTime.setAttribute('style', 'color:yellow;font-size:3em');
		else nowTime.setAttribute('style', 'color:#3c3;font-size:3em');
		
		for(let i = 0; i < 3; i++){
			if(time[i] < 10) time[i] = '0' + time[i];
		}
		nowHour.innerText = time[0];
		nowTime.innerHTML = time[1] + '<span style="font-size:0.4em">分</span>' + time[2] + '<span style="font-size:0.4em">秒</span>';

	}, 100);

	// 8-B. 描画処理
	setInterval(() => {
		if(isFileRoaded){
			nowDate = new Date();
				if(isAutoScroll){
					let delta = 50;
					if(isLocationShowing) delta = 350;
					deltaX = -(time[0] * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) + delta / scales[sX];
				}
				draw();
		}
	}, 100);

	// 8-C. 差分入力欄整形
	setInterval(() => {
		if(isFileRoaded){
			commitOffset();
		}
	}, 100);

	//8-D. 自動スクロール
	setInterval(() => {
		for(let i = 0; i < scrollable.length; i++){
			moveRange[i] = scrollableContent[i].offsetWidth - scrollable[i].offsetWidth;
			moveAmount[i] += move;
			if(moveAmount[i] > moveRange[i] + 500) moveAmount[i] = -500;
			scrollable[i].scrollTo(moveAmount[i], 0); 
		}
		// cons(moveRange + " " + moveAmount);
	}, 15);

})

// 9. getElem短縮
function $(elemId) {
	return document.getElementById(elemId);
}

// 10. console.log短縮
function cons(content) {
	return console.log(content);
}
