// 1. 最初に読まれる
cons("------");


// 1-A. ファイルを読むボタン
let btn_fileRead = $('btn_fileRead');
btn_fileRead.addEventListener('change', fileRead);
let p_msg = $("p_msg");
let jsonData;
let isFileRoaded = false;
let fileName = "newOperation";

// 2. JSONファイルを読み込む
let colors = new Object();
function fileRead() {
	let file = event.target.files[0];
	let reader = new FileReader();
	reader.onload = function (event) {
		fileName = file.name.split('.')[0];
		jsonData = JSON.parse(event.target.result);
		cons(jsonData);
		applyChange();
	}
	reader.readAsText(file);
}

// 2-A. 新規作成
function makeNew() {
	jsonData = {
		"copName" : "架空鉄道ナンタラ",
		"description" : "運行表の説明",
		"colors" : {
			"普通" : "#222",
			"快速" : "#f00"
		},
		"sections" :[
			{
				"name" : "路線名",
				"stations" : [
					{"name": "駅1", "dist" : 0},
					{"name": "駅2", "dist" : 1000},
				]
			}
		],
		"operations" : [
			{
				"opNum" : "1001F",
				"opPrevNum" : null,
				"opNextNum" : null,
				"type" : "普通",
				"stops" : [
					{
						"lineName" : "路線名",
						"stnName" : "駅1",
						"arrTime" : 100000,
						"depTime" : 100100
					},
					{
						"lineName" : "路線名",
						"stnName" : "駅2",
						"arrTime" : 100300,
						"depTime" : 100400
					}
				]
			}
		]
	}
	applyChange();
}

// 3. エディタを開く
let editor = $('editor');
let secAbout = $('about');
let secCfgType = $('configType');
let secCfgStns = $('configStns');
let secOpSummary = $('opSummary');
let secOpDetail = $('opDetail');
let secSave = $('save');
function applyChange(){
	$('read').setAttribute('style', 'display:none');

	// 3-A. ダイヤ情報
	secAbout.innerHTML 
		= '<h2>ダイヤ情報</h2>'
		+ 'ファイル名：<input class="field" id="fileName" type="text" value="' + fileName + '" style="width:calc(90% - 7em)" onchange="editInfo()">.json<br>' 
		+ '会社名　　：<input class="field" id="elemCopName" type="text" value="' + jsonData.copName + '" style="width:calc(90% - 5em)" onchange="editInfo()"><br>' 
		+ '説明　　　：<input class="field" id="elemDesc" type="text" value="' + jsonData.description + '" style="width:calc(90% - 5em)" onchange="editInfo()">';

	setType();
	setStns();
	setOps();
	secSave.setAttribute('style', 'display:block');
	// $("exportData").innerHTML = JSON.stringify(jsonData, undefined, 4);
}

// 3-B. 種別設定
let colorPalette = new Object();
function setType(){
	colorPalette = new Object();
	let elemColorPalette = '<h2>種別設定</h2><input class="btn" type="button" value="追加" onclick="addType()"><input  class="btn" type="button" value="削除" onclick="delType()"><table>';
	let colorSet = Object.entries(jsonData.colors);
	for(let i = 0; i < colorSet.length; i++){
		colorSet[i][1] = colorCodeFormat(colorSet[i][1]);
		elemColorPalette += '<tr><td><input class="field" type="text" id="type_'+ i +'" value="' + colorSet[i][0] + '" onchange="editType('+ i +')"></td><td> '+ '<input type="color" name="cp" id="colorPicker_'+ i +'" value="' + colorSet[i][1] + '" onchange="cpChange('+ i +')"></td><td><input class="field" type="text" id="colorCode_'+ i +'" value="'+ colorSet[i][1] +'" onchange="editType('+ i +')"></td></tr>';
	}
	elemColorPalette += '</table>';
	cons('colorSet:');
	cons(colorSet);
	for (let i = 0; i < colorSet.length; i++) {
		colorPalette[colorSet[i][0]] = colorSet[i][1];
	}
	cons(colorPalette);
	secCfgType.innerHTML = elemColorPalette;

	let elemSlType = $('slType');
	let options = "";
	for(let i = 0; i < colorSet.length; i++){
		options += '<option value="' + colorSet[i][0] + '">' + colorSet[i][0] + '</option>';
	}
	elemSlType.innerHTML = options;
}

//3-C. 駅設定
let stnOptions = "";
function setStns(){
	secCfgStns.innerHTML = '<h2>駅設定</h2>'
	let sections = Object.values(jsonData.sections);
	cons(sections);
	let elemStns = '<table>\n';
	for (let i = 0; i < sections.length; i++) {
		elemStns += '<tr><td colspan="4">------------</td></tr>\n'
		+'<tr><td colspan="4"><input class="field" id="elemSecName_'+ i +'" type="text" value="' + sections[i].name + '" style="width:100%" onchange="editSecName('+i+')"></td>'
		+'<td><input class="btn2" type="button" value="上へ" onclick="sortSections('+i+', -1)">'
		+'<input class="btn2" type="button" value="下へ" onclick="sortSections('+i+', 1)">'
		+'<input class="btn2" type="button" value="複製" onclick="copySection('+i+')">'
		+'<input  class="btn2" type="button" value="削除" onclick="deleteSection('+i+')"></td></tr>\n';
		elemStns += '<tr><th style="width:3em"></th><th>主要駅</th><th>駅名</th><th>距離(m)</th></tr>\n'
		for (let j = 0; j < sections[i].stations.length; j++) {
			const stn = sections[i].stations[j];
			// cons(stn);
			let checked = '';
			if(stn.isMajor) checked = 'checked';
			elemStns += '<tr>'
			+'<td style="text-align:center">'+ j +'</td>'
			+'<td style="text-align:center;"><input type="checkbox" id="stnImportance_'+ i +'_'+ j +'" style="transform:scale(2)" '+ checked +' onchange="changeStnInfo('+ i +', '+ j +',0)"></td>'
			+'<td><input class="field" id="stnName_'+ i +'_'+ j +'" type="text" value="' + stn.name + '" onchange="changeStnInfo('+ i +', '+ j +',1)"></td>'
			+'<td><input class="field" id="distance_'+ i +'_'+ j +'" type="number" value="' + stn.dist + '" style="text-align:right" onchange="changeStnInfo('+ i +', '+ j +',2)"></td>'
			+'<td><input class="btn" type="button" value="上へ" onclick="sortStations('+ i +', '+ j +',-1)"><input class="btn" type="button" value="下へ" onclick="sortStations('+ i +', '+ j +',1)"><input class="btn" type="button" value="複製" onclick="copyStation('+ i +', '+ j +')"><input  class="btn" type="button" value="削除" onclick="deleteStation('+ i +', '+ j +')"></td></tr>\n';
		}
	}
	elemStns += '</table>'
	// cons(elemStns);
	secCfgStns.innerHTML += elemStns;

	stnOptions = "";
	for(let i = 0; i < jsonData.sections.length; i++){
		for(let j = 0; j < jsonData.sections[i].stations.length; j++){
			let name = jsonData.sections[i].stations[j].name;
			stnOptions += '<option value="' + jsonData.sections[i].name + '|' + name + '">' + name + '</option>';
		}
	}
	// cons(stnOptions);
}

//3-D. 運用設定
function setOps(){
	let elemOpSumary = '';
	let elemOpDetail = '';
	let opCount = jsonData.operations.length;
	for (let i = 0; i < jsonData.operations.length; i++) {
		const opData = jsonData.operations[i];
		let opColor = colorCodeFormat(opData.color) ?? colorPalette[opData.type] ?? "#222222";
		elemOpDetail += '<div style="text-align:center;background-color:'+ opColor +'10;border-right:solid 1px; #888" id="operation'+ i +'">'
		+ '<table class="opTable" style="border-left:solid 10px '+ opColor +'">'
			+ '<tr><th>運番</th><th>' + opData.opNum + '</th><th><input class="btn" type="button" value="編集" onclick="showOpEditView('+ i +')"></th></tr>'
			+ '<tr><td>種別</td><td>' + (opData.type ?? "普通") + '</td><td><input class="btn" type="button" value="右へ" onclick="sortOperations('+ i +', 1)"></td></tr>'
			+ '<tr><td>色</td><td>' + opColor + '</td><td><input class="btn" type="button" value="左へ" onclick="sortOperations('+ i +', -1)"></td></tr>'
			+ '<tr><td>前の</td><td>' + (opData.opPrevNum ?? "") + '</td><td><input class="btn" type="button" value="複製" onclick="doublicateOpDirect('+ i +')"></td></tr>'
			+ '<tr><td>次の</td><td>' + (opData.opNextNum ?? "") + '</td><td><input class="btn" type="button" value="削除" onclick="deleteOpDirect('+ i +')"></td></tr>'
		+ '</table><table class="opTable">'
		+ '<tr><th>停車駅</th><th>着時刻</th><th>発時刻</th></tr>';
		elemOpSumary += '<span style="border-left:solid 1em '+ opColor +';margin:5px"><a href="" onclick="showOpEditView(' + i + ');return false">' + opData.opNum + '</a> : ';
		for (let j = 0; j < opData.stops.length; j++) {
			const stopStn = opData.stops[j];
			// cons(stopStn);
			let isHide = stopStn.hideLine ?? false;
			if(isHide) isHide = 'style="color:#999"';
			else isHide = '';
			elemOpDetail += '<tr ' + isHide + '><td>' + stopStn.stnName + '</td><td>' + (stopStn.arrTime ?? "") + '</td><td>' + (stopStn.depTime ?? "") + '</td></tr>';
			if(j == 0) elemOpSumary += stopStn.stnName;
			if(j == opData.stops.length - 1) elemOpSumary += ' → ' + stopStn.stnName + ' (' + (opData.type ?? '普通') + ')';
		}
		elemOpSumary += '</span>'
		elemOpDetail += '</table></div>';
	}
	secOpSummary.innerHTML = '<h2>運用一覧</h2><p>' + elemOpSumary + '</p>';
	secOpDetail.innerHTML = '<h2>運用詳細 (複製時のシフト時間:' + $('opShiftTime').value + '秒)</h2><div style="width:100%;overflow-x:scroll"><div style="display:flex;width:max-content">' + elemOpDetail + '</div></div>';
}

//4 概要編集
function editInfo(){
	cons("ダイヤ情報を変更しました");
	jsonData.copName = $('elemCopName').value;
	jsonData.description = $('elemDesc').value;
}

//5 種別編集
//5-A 種別追加
let addedTypeCount = 0;
function addType(){
	addedTypeCount++;
	jsonData.colors["新規" + addedTypeCount] = "#222";
	applyChange();
}

//5-B 種別削除
function delType(){
	let colors = jsonData.colors;
	let keys = Object.keys(colors);
	if(keys.length >= 2){
		let lastElem = keys.pop();
		delete jsonData.colors[lastElem];
		applyChange();	
	}
}

//5-C 種別編集反映
//5-E カラーコード入力
function editType(pos){
	let colors = jsonData.colors;
	let entries = Object.entries(colors);
	let oldTypeName = entries[pos][0];
	// let oldTypeColor = entries[pos][1];
	let newTypeName = $("type_"+ pos).value;
	entries[pos][0] = newTypeName;
	entries[pos][1] = $("colorCode_"+ pos).value;
	jsonData.colors = new Object();
	for(let i = 0; i < entries.length; i++){
		jsonData.colors[entries[i][0]] = entries[i][1];
	}
	for(let i = 0; i < jsonData.operations.length; i++){
		if(jsonData.operations[i].type == oldTypeName){
			jsonData.operations[i].type = newTypeName;
		}
	}
	cons("4c");
	cons(jsonData.colors);
	applyChange();
}

//5-D カラーピッカー検知
function cpChange(pos){
	let newColor = $("colorPicker_" + pos).value
	cons(newColor);
	let colors = jsonData.colors;
	let entries = Object.entries(colors);
	entries[pos][1] = newColor;
	jsonData.colors = new Object();
	for(let i = 0; i < entries.length; i++){
		jsonData.colors[entries[i][0]] = entries[i][1];
	}
	cons("4d");
	cons(jsonData.colors);
	applyChange();
}

// 6 駅変更
// 6-A 路線名を変更する
function editSecName(pos){
	jsonData.sections[pos]['name'] = $('elemSecName_'+ pos).value;
	cons(pos + "番目の路線名を変更しました:" + jsonData.sections[pos].name);
	applyChange();
}

// 6-B 路線を並べ替える
function sortSections(from, direction){
	// direction: 1は下、-1は上に対応
	if(!(from == 0 && direction == -1) && !(from == jsonData.sections.length - 1 && direction == 1)){
		let tmp = jsonData.sections[from];
		jsonData.sections[from] = jsonData.sections[from + direction];
		jsonData.sections[from + direction] = tmp;
		applyChange();
	}else{
		// cons("端の要素を"+ direction +"の方向に動かそうとしています");
	}
}

// 6-C 路線を複製する
function copySection(pos){
	cons(pos + "番目の路線を複製します");
	let fromData = jsonData.sections[pos];
	let tmp = new Object();
	tmp.name = fromData.name;
	tmp.stations = new Array();
	for(let i = 0; i < fromData.stations.length; i++){
		let stn = new Object();
		stn.name = fromData.stations[i].name;
		stn.dist = fromData.stations[i].dist;
		stn.isMajor = fromData.stations[i].isMajor;
		tmp.stations.push(stn);
	}
	jsonData.sections.splice(pos + 1, 0, tmp);
	applyChange();
}

// 6-D 路線を削除する
function deleteSection(pos){
	cons(pos + "番目の路線を削除します");
	if(jsonData.sections.length > 1){
		jsonData.sections.splice(pos, 1);
		applyChange();	
	}else{
		cons("路線が1つしかありません");
	}
}

// 6-E 主要駅切替・駅名・距離変更
function changeStnInfo(line, pos, index){
	let value = $('stnImportance_' + line + '_' + pos).checked;
	let name = $('stnName_' + line + '_' + pos).value;
	let dist = $('distance_' + line + '_' + pos).value;
	// cons(value);
	// cons(name + ", " + dist + ", " + index);
	jsonData.sections[line].stations[pos].name = name;
	jsonData.sections[line].stations[pos].dist = Number.parseInt(dist);
	if(value){
		jsonData.sections[line].stations[pos].isMajor = true;
	}else{
		delete jsonData.sections[line].stations[pos].isMajor;
	}
	if(index != 2) applyChange();
}

// 6-F 駅並べ替え
function sortStations(line, pos, direction){
	let tmp = jsonData.sections[line].stations[pos];
	cons(tmp);
	cons(line + ", " + pos + ", " + direction);
	if(line != 0 && pos == 0 && direction == -1){
		// 路線の先頭の駅を上の路線の一番下に配置する
		jsonData.sections[line].stations.shift();
		jsonData.sections[line - 1].stations.push(tmp);
		applyChange();
	}else if(line != jsonData.sections.length - 1 && pos == jsonData.sections[line].stations.length - 1 && direction == 1){
		// 路線の末尾の駅を下の路線の一番上に配置する
		jsonData.sections[line].stations.pop();
		jsonData.sections[line + 1].stations.unshift(tmp);
		applyChange();
	}else if(!(line == 0 && pos == 0 && direction == -1) && !(line == jsonData.sections.length - 1 && pos == jsonData.sections[line].stations.length - 1 && direction == 1)){
		// 表の先頭・末尾でない場合の通常の入替
		jsonData.sections[line].stations[pos] = jsonData.sections[line].stations[pos + direction];
		jsonData.sections[line].stations[pos + direction] = tmp;
		applyChange();
	}else{
		cons("端の駅を" + direction + "の方向に動かそうとしています");
	}
}

// 6-G 駅複製
function copyStation(line, pos){
	cons(line + ", " + pos + " の駅を複製します");
	let tmp = new Object();
	tmp.name = jsonData.sections[line].stations[pos].name;
	tmp.dist = jsonData.sections[line].stations[pos].dist;
	if(jsonData.sections[line].stations[pos].isMajor){
		tmp.isMajor = true;
	}
	jsonData.sections[line].stations.splice(pos, 0, tmp);
	applyChange();
}

// 6-H 駅削除
function deleteStation(line, pos){
	cons(line + ", " + pos + " の駅を削除します");
	if(jsonData.sections[line].stations.length > 1){
		jsonData.sections[line].stations.splice(pos, 1);
		applyChange();
	}else{
		cons("路線を削除してください");
	}
}

// 7 運用編集
// 7-A 運用編集パネル表示更新
let editingOpId; // 編集中の運用ID
let tmpOpData = new Object();
let typeColorId;
function refreshOpEdit(pos){
	cons('表示データが更新されます↓');
	//編集中のデータを上書きする
	tmpOpData.opNum = $('opName').value;
	tmpOpData.opPrevNum = $('opPrev').value;
	tmpOpData.opNextNum = $('opNext').value;
	tmpOpData.color = $('opColorField').value;
	tmpOpData.description = $('description').value;

	let type = $('altType').value;
	if(type == ""){
		type = $('slType').value;
	}else{
		$('implementByType').removeAttribute('checked');
	}
	tmpOpData.type = type;
	
	if($('implementByType').checked){
		delete(tmpOpData.color);
		typeColorId = colorPalette[tmpOpData.type] ?? "#222222";
		$('opColorField').value = typeColorId;
		$('opColorPicker').value = typeColorId;
		disableColorPicker();
	}else{
		if(pos == 'cf'){
			typeColorId = $('opColorField').value;
			$('opColorField').value = colorCodeFormat(typeColorId);
			$('opColorPicker').value = $('opColorField').value
		}else if(pos == 'cp'){
			$('opColorField').value = $('opColorPicker').value;
			tmpOpData.color = $('opColorPicker').value;
		}
		$('altType').removeAttribute('disabled');
		$('altType').removeAttribute('style');
		$('opColorField').removeAttribute('disabled');
		$('opColorField').removeAttribute('style');
		$('opColorPicker').removeAttribute('disabled');
	}

	//停車駅テーブルを表示する
	showOpEditorContent()

	cons(tmpOpData);
}

// 7-B 運用編集パネルを開く
let elemOpEditor = $('opEditor');
function showOpEditView(opId){
	editingOpId = opId;
	cons("運用編集パネルを表示します: " + opId);

	// データを読み込み、反映させる
	tmpOpData = jsonData.operations[editingOpId];
	cons(tmpOpData);
	$('opName').value = tmpOpData.opNum;
	let secLength = tmpOpData.stops.length;
	$('opSection').innerText = tmpOpData.stops[0].lineName + ' ' + tmpOpData.stops[0].stnName + ' → ' + tmpOpData.stops[secLength - 1].lineName + ' ' + tmpOpData.stops[secLength - 1].stnName;

	$('slType').value = tmpOpData.type;

	cons('tmpOpData.color >> ' + tmpOpData.color);
	if(!tmpOpData.color){
		$('implementByType').setAttribute('checked', 'true');
		typeColorId = colorPalette[tmpOpData.type] ?? "#222222";
		disableColorPicker()
	}else{
		typeColorId = tmpOpData.color;
	}
	$('opColorField').value = colorCodeFormat(typeColorId);
	$('opColorPicker').value = $('opColorField').value;

	refreshOpEdit();
	// closeOpEdit();
	$('opEdit').setAttribute('style', 'display:block');
}

// 7-C 運行表を表示・更新する
function showOpEditorContent(){
	let opEditorContent = '<tr><th style="width: 8em;">駅</th><th style="width: 7em;">時刻</th><th style="width: 8em;"></th><th style="width: 10em;">操作</th></tr>';
	for(let i = 0; i < tmpOpData.stops.length; i++){
		opEditorContent +=
		'<tr><td><select id="editorStn_'+ i +'" class="select" onchange="changeOpStnInfo('+ i +', 0)">'
			+ stnOptions
			+'</select><br>'
		+'<span id="time_'+ i +'"></span>'
		+'</td><td>'
			+'着:<input type="text" id="editorArr_'+ i +'" class="opField num" onchange="changeOpStnInfo('+ i +', 1)" onfocus="detectFocusingTime('+ i +', 1)"><br>'
			+'発:<input type="text" id="editorDep_'+ i +'" class="opField num" onchange="changeOpStnInfo('+ i +', 2)" onfocus="detectFocusingTime('+ i +', 2)">'
		+'</td><td>'
			+'<select id="editorIsPassage_'+ i +'" class="select" onchange="changeOpStnInfo('+ i +', 4)">'
				+'<option value="false">停車</option>'
				+'<option value="true">通過</option>'
			+'</select><br>'
			+'<select id="editorHideLine_'+ i +'" class="select" onchange="changeOpStnInfo('+ i +', 5)">'
				+'<option value="false">線表示</option>'
				+'<option value="true">線非表示</option>'
			+'</select>'
		+'</td><td>'
			+'<input type="button" class="btn" value="複製" onclick="editorCopyStn('+ i +')"><input type="button" class="btn" value="削除" onclick="editorDeleteStn('+ i +')"><br>'
			+'備考:<input type="text" id="editorDesc_'+ i +'" class="field" style="width: calc(100% - 3em);" onchange="changeOpStnInfo('+ i +', 3)">'
		+'</td></tr>';
	}
	elemOpEditor.innerHTML = opEditorContent;
	applyTableValueChange();
}

// 7-C1 運行表の値を変更する
function applyTableValueChange(){
	for(let i = 0; i < tmpOpData.stops.length; i++){
		let stopStnInfo = tmpOpData.stops[i];
		$('editorStn_'+ i).value = stopStnInfo.lineName + '|' + stopStnInfo.stnName;
		$('editorArr_'+ i).value = stopStnInfo.arrTime ?? "";
		$('editorDep_'+ i).value = stopStnInfo.depTime ?? "";
		$('editorDesc_'+ i).value = stopStnInfo.description ?? "";
		$('editorIsPassage_'+ i).value = stopStnInfo.isPassage ?? false;
		$('editorHideLine_'+ i).value = stopStnInfo.hideLine ?? false;
		calcReqTime(i);
	}
}

let beforeShiftingTime = 0;
// 7-D 駅情報を変更する
function changeOpStnInfo(pos, category){
	if(category == 0){ // --------------------------駅名
		let value = $('editorStn_' + pos).value;
		value = value.split('|');
		// cons(value);
		tmpOpData.stops[pos].lineName = value[0];
		tmpOpData.stops[pos].stnName = value[1];
		let secLength = tmpOpData.stops.length;
		$('opSection').innerText = tmpOpData.stops[0].lineName + ' ' + tmpOpData.stops[0].stnName + ' → ' + tmpOpData.stops[secLength - 1].lineName + ' ' + tmpOpData.stops[secLength - 1].stnName;
	}else if(category == 1){ // --------------------到着時刻
		let value = $('editorArr_' + pos).value;
		// cons(value);
		if(value == "") value = null;
		else{
			let differenceTime = time2sec(value) - beforeShiftingTime;
			cons(differenceTime);
			for (let i = 0; i < tmpOpData.stops.length; i++) {
				// cons(pos + ", " + category + ", " + i , ", " + $('shiftBefore').checked);
				if((i < pos && $('shiftBefore').checked) || (i > pos && $('shiftAfter').checked)){
					if(tmpOpData.stops[i].arrTime != null) tmpOpData.stops[i].arrTime = sec2time(time2sec(tmpOpData.stops[i].arrTime) + differenceTime);
					if(tmpOpData.stops[i].depTime != null) tmpOpData.stops[i].depTime = sec2time(time2sec(tmpOpData.stops[i].depTime) + differenceTime);
				}else if(i == pos && $('shiftAfter').checked){
					if(tmpOpData.stops[i].depTime != null) tmpOpData.stops[i].depTime = sec2time(time2sec(tmpOpData.stops[i].depTime) + differenceTime);
				}
			}
		}
		tmpOpData.stops[pos].arrTime = value;
		beforeShiftingTime = time2sec(value);
		applyTableValueChange();
		calcReqTime(pos);
		calcReqTime(pos + 1);
	}else if(category == 2){ // --------------------出発時刻
		let value = $('editorDep_' + pos).value;
		// cons(value);
		if(value == "") value = null;
		else{
			let differenceTime = time2sec(value) - beforeShiftingTime;
			cons(differenceTime);
			for (let i = 0; i < tmpOpData.stops.length; i++) {
				// cons(pos + ", " + category + ", " + i , ", " + $('shiftBefore').checked);
				if((i < pos && $('shiftBefore').checked) || (i > pos && $('shiftAfter').checked)){
					if(tmpOpData.stops[i].arrTime != null) tmpOpData.stops[i].arrTime = sec2time(time2sec(tmpOpData.stops[i].arrTime) + differenceTime);
					if(tmpOpData.stops[i].depTime != null) tmpOpData.stops[i].depTime = sec2time(time2sec(tmpOpData.stops[i].depTime) + differenceTime);
				}else if(i == pos && $('shiftAfter').checked){
					if(tmpOpData.stops[i].arrTime != null) tmpOpData.stops[i].arrTime = sec2time(time2sec(tmpOpData.stops[i].arrTime) + differenceTime);
				}
			}
		}
		tmpOpData.stops[pos].depTime = value;
		beforeShiftingTime = time2sec(value);
		applyTableValueChange();
		calcReqTime(pos);
		calcReqTime(pos + 1);
	}else if(category == 3){ // --------------------詳細
		let value = $('editorDesc_' + pos).value;
		// cons(value);
		tmpOpData.stops[pos].description = value;
		if(value == "") delete(tmpOpData.stops[pos].description);
	}else if(category == 4){ // --------------------停車/通過
		let value = $('editorIsPassage_' + pos).value;
		// cons(value);
		if(value == "true") tmpOpData.stops[pos].isPassage = true;
		else delete(tmpOpData.stops[pos].isPassage);
	}else if(category == 5){ // --------------------線表示/非表示
		let value = $('editorHideLine_' + pos).value;
		// cons(value);
		if(value == "true") tmpOpData.stops[pos].hideLine = true;
		else delete(tmpOpData.stops[pos].hideLine);
	}
}

// 7-E 駅情報を複製する
function editorCopyStn(pos){
	let rawData = tmpOpData.stops[pos];
	let insData = new Object();
	insData.lineName = rawData.lineName;
	insData.stnName = rawData.stnName;
	if(rawData.arrTime != null) insData.arrTime = rawData.arrTime;
	if(rawData.depTime != null) insData.depTime = rawData.depTime;
	if(rawData.isPassage != null) insData.isPassage = rawData.isPassage;
	if(rawData.hideLine != null) insData.hideLine = rawData.hideLine;
	if(rawData.description != null) insData.description = rawData.description;
	tmpOpData.stops.splice(pos, 0, insData);
	showOpEditorContent();
}

// 7-F 駅情報を削除する
function editorDeleteStn(pos){
	if(tmpOpData.stops.length > 2){
		tmpOpData.stops.splice(pos, 1);
		showOpEditorContent();	
	}else{
		cons("区間が1つしかありません")
	}
}

// 7-G 運用時刻をずらす
function shiftOpTime(shiftTime){
	for (let i = 0; i < tmpOpData.stops.length; i++) {
		if(tmpOpData.stops[i].arrTime != null){
			let time = time2sec(tmpOpData.stops[i].arrTime);
			time += shiftTime;
			tmpOpData.stops[i].arrTime = sec2time(time);
		}
		if(tmpOpData.stops[i].depTime != null){
			let time = time2sec(tmpOpData.stops[i].depTime);
			time += shiftTime;
			tmpOpData.stops[i].depTime = sec2time(time);
		}
	}
	showOpEditorContent();
}

// 7-H 運用を複製する
function doublicateOp() {
	tmpOpData.opNum = $('opName').value;
	let type = $('altType').value;
	if(type == "") type = $('slType').value;
	tmpOpData.type = type;
	tmpOpData.opPrevNum = $('opPrev').value;
	tmpOpData.opNextNum = $('opNext').value;
	tmpOpData.description = $('description').value;
	jsonData.operations.splice(editingOpId, 1, tmpOpData);

	let newOpData = new Object();
	newOpData.opNum = tmpOpData.opNum;
	newOpData.opPrevNum = tmpOpData.opPrevNum;
	newOpData.opNextNum = tmpOpData.opNextNum;
	if(tmpOpData.type != null) newOpData.type = tmpOpData.type;
	if(tmpOpData.color != null) newOpData.color = tmpOpData.color;
	if(tmpOpData.description != null) newOpData.description = tmpOpData.description;
	let newOpStops = [];
	for (let i = 0; i < tmpOpData.stops.length; i++) {
		let newOpStopStn = new Object();
		newOpStopStn.lineName = tmpOpData.stops[i].lineName;
		newOpStopStn.stnName = tmpOpData.stops[i].stnName;
		if(tmpOpData.stops[i].arrTime != null) newOpStopStn.arrTime = tmpOpData.stops[i].arrTime;
		if(tmpOpData.stops[i].depTime != null) newOpStopStn.depTime = tmpOpData.stops[i].depTime;
		if(tmpOpData.stops[i].isPassage != null) newOpStopStn.isPassage = tmpOpData.stops[i].isPassage;
		if(tmpOpData.stops[i].hideLine != null) newOpStopStn.hideLine = tmpOpData.stops[i].hideLine;
		if(tmpOpData.stops[i].description != null) newOpStopStn.description = tmpOpData.stops[i].description;
		newOpStops.push(newOpStopStn);
	}
	newOpData.stops = newOpStops;
	cons('運用を複製しました↓')
	cons(newOpData);

	jsonData.operations.splice(editingOpId, 0, newOpData);
	editingOpId++;
	applyChange();
	showOpEditView(editingOpId);
	shiftOpTime(Number.parseInt($('opShiftTime').value));
}

// 7-H1 運用を直接複製する
function doublicateOpDirect(pos){
	showOpEditView(pos);
	doublicateOp();
	closeOpEdit();
}

// 7-I 運用を削除する
function deleteOp(){
	if(jsonData.operations.length > 1){
		jsonData.operations.splice(editingOpId, 1);
		applyChange();
		$('opEdit').setAttribute('style', 'display:none');	
	}else{
		cons('運用が1つしかありません');
	}
}

function deleteOpDirect(pos){
	editingOpId = pos;
	deleteOp();
}

// 7-J 入力欄の時刻を検出する
function detectFocusingTime(pos, category){
	if(category == 1){
		beforeShiftingTime = $('editorArr_' + pos).value;
	}else if(category == 2){
		beforeShiftingTime = $('editorDep_' + pos).value;
	}
	beforeShiftingTime = time2sec(beforeShiftingTime);
	cons(beforeShiftingTime);
}


// 7-Y 駅間所要時間を表示する pos < stops.length;
function calcReqTime(pos){
	if(0 < pos && pos < tmpOpData.stops.length){
		let time = "";
		let dep = tmpOpData.stops[pos-1].depTime ?? tmpOpData.stops[pos-1].arrTime ?? null;
		let arr = tmpOpData.stops[pos].arrTime ?? tmpOpData.stops[pos].depTime ?? null;
		if(dep != null && arr != null){
			dep = time2sec(dep);
			arr = time2sec(arr);
			let reqTime = arr - dep;
			if(reqTime >= 0){
				let reqTimeStr = [0, 0, 0];
				reqTimeStr[0] = Math.floor(reqTime / 3600);
				reqTimeStr[1] = Math.floor(reqTime % 3600 / 60);
				reqTimeStr[2] = reqTime - reqTimeStr[0] * 3600 - reqTimeStr[1] * 60;
				if(reqTimeStr[1] < 10) reqTimeStr[1] = '0' + reqTimeStr[1];
				if(reqTimeStr[2] < 10) reqTimeStr[2] = '0' + reqTimeStr[2];
				time = reqTimeStr[0] + ':' + reqTimeStr[1] + ':' + reqTimeStr[2];
				$('time_' + (pos - 1)).innerText = '↓' + time;
			}else{
				$('time_' + (pos - 1)).innerText = 'ー';
			}
		}
		// cons(dep + ', ' + arr);
	}
}

// 7-Z 色の種別から継承がONの場合にフォームの一部を無効化する
function disableColorPicker(){
	$('altType').setAttribute('disabled', 'true');
	$('altType').setAttribute('style', 'background:#ddd');
	$('opColorField').setAttribute('disabled', 'true');
	$('opColorField').setAttribute('style', 'background:#ddd');
	$('opColorPicker').setAttribute('disabled', 'true');
}


// 8 運用編集パネル閉じる
function closeOpEdit(){
	tmpOpData.opNum = $('opName').value;
	let type = $('altType').value;
	if(type == "") type = $('slType').value;
	tmpOpData.type = type;
	tmpOpData.opPrevNum = $('opPrev').value;
	tmpOpData.opNextNum = $('opNext').value;
	tmpOpData.description = $('description').value;

	cons("運行編集パネルを閉じます")
	cons(tmpOpData);
	jsonData.operations.splice(editingOpId, 1, tmpOpData);
	applyChange();
	$('opEdit').setAttribute('style', 'display:none');
}

// 9 運用を並べ替える
function sortOperations(from, direction){
	if(!(from == 0 && direction == -1) && !(from == jsonData.operations.length - 1 && direction == 1)){
		let tmp = jsonData.operations[from];
		jsonData.operations[from] = jsonData.operations[from + direction];
		jsonData.operations[from + direction] = tmp;
		applyChange();
	}else{
		cons("端の運用を"+ direction +"の方向に動かそうとしています");
	}
}

// 10 エクスポートする
function exportJson(){
	cons('ダウンロードします')
	const blob = new Blob([JSON.stringify(jsonData, undefined, 4)], {type: 'text/plain'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	document.body.appendChild(a);
	a.download = $('fileName').value + '.json';
	a.href = url;
	a.click();
	a.remove();
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 1E4);
}

// カラーコードを整形する
function colorCodeFormat(value){
	if(value == null) return null;
	if(value.length == 4) value = value[0] + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
	else if(value.length != 7) value = '#222222';
	return value;
}

// 時刻を秒に変換する
function time2sec(time){
	if(time < 0) time += 240000;
	else if(time > 295959) time -= 240000;
	let hour = Math.floor(time / 10000);
	let min = Math.floor((time % 10000) / 100);
	let sec = time % 100;
	// cons(time + " >> " + hour + "," + min + "," + sec);
	return Number.parseInt(hour * 3600 + min * 60 + sec);
}

// 秒を時刻表記に変更する
function sec2time(time){
	if(time < 0) time += 86400;
	else if(time > 107999) time -= 86400;
	let h = Math.floor(time / 3600) + "";
	let m = Math.floor((time % 3600) / 60);
	let s = time % 60;
	if(m < 10) m = "0" + m;
	if(s < 10) s = "0" + s;
	return (h + m + s) + "";
}

function $(elemId){
	return document.getElementById(elemId);
}

function cons(value){
	console.log(value);
}