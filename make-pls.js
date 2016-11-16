#!/usr/bin/env node


'use strict';

var dirToWalk = process.argv[2];

var lineReader = require('line-reader')
	, fs         = require('fs')
	, walk       = require('walk')
  , path       = require('path')
  ;

if((!dirToWalk) || (!fs.existsSync(dirToWalk))){
	console.log( 'Need a directory to walk');
	process.exit();
}

var walker  = walk.walk(dirToWalk, { followLinks: false })
var startsWithThe = /^the[ -_]/;
var allNonWordChars = /[^a-z0-9\-\s]/g;
var allSpaceChars = /\s/g;
var plsAll = {}; // {}->{}->[] , artist -> albums -> songs

function writeLines(artist,lines){
	artist = artist.toLowerCase();
	if(startsWithThe.test(artist)){
		artist = artist.substring(4) + "-" + artist.substring(0,3);
	}
	var pls_filename = 'pls-' + artist.
		replace(allNonWordChars,'').
		replace(allSpaceChars,'-');
	fs.writeFileSync(pls_filename,lines.join('\n') + "\n");
}

function fileHandler(path,stats,next){
	//path = path.replace(dirToWalk,'').replace(/^\//,'');
	//console.log( 'fileHandler got ',(path+stats.name).replace('//','/'));
	var entries = path.split('/');	
	var artist = entries[entries.length-2],
		album = entries[entries.length-1],
		song = stats.name;
	if(artist && album && song && artist[0] !== '.' && album[0] !== '.' && song[0] !== '.'){
		if(!(artist in plsAll)){
			plsAll[artist] = {};
		}
		if(!(album in plsAll[artist])){
			plsAll[artist][album] = [];
		}
		plsAll[artist][album].push(song);
	}
	if(next){
		next();
	}
}

function endHandler(){
	var out = [];
	var artists = Object.keys(plsAll);
	artists.sort();
	artists.forEach(artist => {
		var albums = Object.keys(plsAll[artist]);
		var artistAll = [];
		albums.sort();
		albums.forEach( album => {
			plsAll[artist][album].forEach(song => {
				out.push([artist,album,song].join('/').replace('//','/'));
				artistAll.push(out[out.length-1]);
			});
		});
		writeLines(artist,artistAll);
	});
	if(out && out.length > 0){
		fs.writeFileSync('pls-all',out.join("\n"));
	}
}

function errorsHandler(){
	console.log( 'errorsHandler got ',arguments);
}
walker.on("file", fileHandler);
walker.on("errors", errorsHandler); // plural
walker.on("end", endHandler);
