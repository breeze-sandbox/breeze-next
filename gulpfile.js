var gulp = require('gulp');
var gutil = require('gulp-util');
var taskListing = require('gulp-task-listing');
// var watch = require('gulp-watch');
// var path = require('canonical-path');
var xSpawn = require('cross-spawn');
var osPath = require('path');
// var shell = require('gulp-shell'); 
var Q = require('q');
var _ = require('lodash');

var clientDir = '.';

// Public tasks

gulp.task('default', ['help']);

gulp.task('help', taskListing.withFilters(function (taskName) {
    var isSubTask = taskName.substr(0, 1) == "_";
    return isSubTask;
}, function (taskName) {
    var shouldRemove = taskName === 'default';
    return shouldRemove;
}));

gulp.task('build-docs', function() {
    var spawnInfo = spawnExt('typedoc', ['--out','./docs/','./src']);
});

gulp.task('webpack-breeze', function() {
   var spawnInfo = spawnExt('webpack', ['--progress','--profile','--display-error-details', '--display-cached']);
}); 

gulp.task('watch-tsc', function() {
    var spawnInfo = spawnExt('./node_modules/typescript/bin/tsc', ['-w']);
});

// returns both a promise and the spawned process so that it can be killed if needed.
function spawnExt(command, args, options) {
  var deferred = Q.defer();
  var descr = command + " " + args.join(' ');
  var proc;
  gutil.log('running: ' + descr);
  try {
    proc = xSpawn.spawn(command, args, options);
  } catch(e) {
    gutil.log(e);
    deferred.reject(e);
    return { proc: null, promise: deferred.promise };
  }
  proc.stdout.on('data', function (data) {
    gutil.log(data.toString());
  });
  proc.stderr.on('data', function (data) {
    gutil.log(data.toString());
  });
  proc.on('close', function (data) {
    gutil.log('completed: ' + descr);
    deferred.resolve(data);
  });
  proc.on('error', function (data) {
    gutil.log('completed with error:' + descr);
    gutil.log(data.toString());
    deferred.reject(data);
  });
  return { proc: proc, promise: deferred.promise };
}

