var through = require('through2');
var gutil = require('gulp-util');
var unzip = require('unzipper');
var fs = require('fs');
var path = require('path');
var defaults = require('defaults');

module.exports = function(options){
  function transform(file, enc, callback){
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    var opts = {};
    options = options || {};
    opts.filter = options.filter || function () { return true; };
    opts.keepEmpty = options.keepEmpty || false;
    opts.makefolder = options.makefolder || false;

    let dir = (opts && opts.makefolder) ? path.basename(file.path, path.extname(file.path)) : '';

    // unzip file
    var self = this
    file.pipe(unzip.Parse())
      .on('entry', function(entry){
        var chunks = []
        if(!opts.filter(entry)){
          entry.autodrain()
          // skip entry
          return
        }

        entry.pipe(through.obj(function(chunk, enc, cb){
          // gutil.log("Find file: "+ entry.path)
          chunks.push(chunk)
          cb()
        }, function(cb){
          if(entry.type == 'File' && (chunks.length > 0 || opts.keepEmpty)){
            self.push(new gutil.File({
              cwd : "./",
              path : path.join(dir, entry.path),
              contents: Buffer.concat(chunks)
            }))
          }
          cb()
        }))
      }).on('close', function(){
        callback()
      })
  }
  return through.obj(transform);
}
