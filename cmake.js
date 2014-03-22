var fs = require('fs');
var async = require('async');

if (process.argv[0] === 'node')
	process.argv.shift();

if (process.argv.length !== 2) {
	console.error('node cmake.js <project-name>');
	process.exit(1);
}

function perror(error) {
	console.trace(error);
}

function mkdir(name, success, fail) {
	if (!fail)
		fail = perror;

	fs.mkdir(name, function(error) {
		if (!error && success)
			success();
		else if (error && fail)
			fail(error);
	});
}

function mkdirs(names, success, fail) {
	if (!fail)
		fail = perror;

	var series = [];

	names.forEach(function(name) {
		series.push(function(callback) {
			mkdir(name, callback, callback);
		});
	});

	async.series(series, function(error) {
		if (!error && success)
			success();
		else if (error && fail)
			fail(error);
	});
}

function create_file(name, content, success, fail) {
	if (!fail)
		fail = perror;

	fs.writeFile(name, content, function(error) {
		if (!error && success)
			success();
		else if (error && fail)
			fail(error);
	});
}

function create_files(files, success, fail) {
	if (!fail)
		fail = perror;

	var parallel = [];

	files.forEach(function(file) {
		parallel.push(function(callback) {
			create_file(file.name, file.content, callback, callback);
		});
	});

	async.parallel(parallel, function(error) {
		if (!error && success)
			success();
		else if (error && fail)
			fail(error);
	});
}

var name = process.argv[1];
var build = name + '/build';
var src = name + '/src';

mkdirs([name, build, src], function() {
	create_files([{
		name: name + '/' + name + '.sublime-project',
		content: '{\n\t"folders":\n\t[\n\t\t{\n\t\t\t"follow_symlinks": true,\n\t\t\t"path": "."\n\t\t}\n\t]\n}\n'
	}, {
		name: name + '/' + 'CMakeLists.txt',
		content: 'cmake_minimum_required(VERSION 2.8)\n\nproject(' + name + ')\n\noption(use_astyle "Use AStyle to format code before building." ON)\noption(use_ctags "Use Ctags to generate tags before building." OFF)\n\nset(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})\n\n#set(CMAKE_CXX_FLAGS "-Wall")\n#set(CMAKE_CXX_FLAGS "-ggdb -Weffc++ -std=c++11")\nset(CMAKE_C_FLAGS "-ggdb -std=c11 -Wall")\nset(CMAKE_C_COMPILER "gcc")\n\nadd_subdirectory(src)'
	}, {
		name: src + '/' + '/CMakeLists.txt',
		content: 'file(GLOB_RECURSE headers RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} *.h)\nfile(GLOB_RECURSE sources RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} *.c)\n\nadd_executable(${PROJECT_NAME} ${sources})\ninstall(TARGETS ${PROJECT_NAME} DESTINATION bin)\n\nif(use_astyle)\n	if(headers OR sources)\n		add_custom_command(TARGET ${PROJECT_NAME} PRE_BUILD COMMAND astyle ARGS ${headers};${sources} WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR})\n	endif(headers OR sources)\nendif(use_astyle)\n\nif(use_ctags)\n		add_custom_command(TARGET ${PROJECT_NAME} PRE_BUILD COMMAND ctags_create WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})\nendif(use_ctags)\n\nunset(headers)\nunset(sources)\n\n\nTARGET_LINK_LIBRARIES(${PROJECT_NAME})'
	}, {
		name: src + '/' + 'main.c',
		content: '#include <stdlib.h>\n#include <stdio.h>\n\n\nint main(int argc, char const * argv[])\n{\n\tputs("Hello World!");\n\treturn 0;\n}'
	}], function() {
		console.log('Project ' + name + ' created.');
	});
});