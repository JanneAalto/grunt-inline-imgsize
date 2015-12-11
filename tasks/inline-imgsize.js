module.exports = function(grunt) {

    var fs        = require('fs'),
        path      = require('path'),
        imagesize = require('imagesize'),
        http = require('http'),
        Q = require('q');

    var regexes = {
        // only match local files
        img: /<img[^\>]+src=['"](?!https:|\/\/|data:image)([^"']+)["'][^\>]*>/gm,
        src: /src=['"]([^"']+)["']/m,
        size: /(height|width)=/,
        ext: /(http:)/
    };

    var fileOptions = {
        encoding: 'utf-8'
    };

    var options = {
        encoding: 'utf8'
    };

    grunt.registerMultiTask('inlineImgSize', 'Inject width and height for img tags', function() {

        grunt.util._.extend(options, this.options());

        var done = this.async();

        var Parser = imagesize.Parser;
        var get_image_dimensions = function (buffer, tag) {
            var deferred = Q.defer();
            var parser = Parser();

            var res = {
                dimensions: '',
                tag: tag
            };

            switch (parser.parse(buffer)) {
                case Parser.EOF:
                    deferred.resolve(false);
                case Parser.INVALID:
                    deferred.resolve(false);
                case Parser.DONE:
                    res.dimensions = parser.getResult();
                    deferred.resolve(res);
            }
            return deferred.promise;

        };

        var get_image_dimersions_external = function(src, tag){
            var deferred = Q.defer();
            //var done = this.async();

            var res = {
                dimensions: '',
                tag: tag
            };

            var request = http.get(src, function (response) {
                imagesize(response, function (err, result) {

                    if (!err) {
                        // do something with result
                        res.dimensions = result;
                        deferred.resolve(res);

                        // we don't need more data
                        request.abort(); // {type, width, height}
                    }else{
                        grunt.log.warn(err + ' : ' + src);
                        res.dimensions = {'type':'', width:'', height:''};
                        deferred.resolve(res);
                        request.abort();
                    }



                    //done();
                });
            }).on('error', function(e) {
                grunt.log.warn("Got error: " + e.message);
            });
            return deferred.promise;
        };

        this.files.forEach(function(f) {
            var src = f.src.filter(function(path) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(path)) {
                    grunt.log.warn('Source file "' + path + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function(path) {
                var contents = grunt.file.read(path, fileOptions);

                var matches = contents.match(regexes.img) || [];
                var resolved = [];

                matches.forEach(function(tag) {
                    // XXX is this necessary?
                    // tag = tag.substring(0, tag.length - 1);

                    // skip this img if the size is already specified
                    if (tag.match(regexes.size)) {
                        return;
                    }

                    var src = tag.match(regexes.src)[1], dimensions;

                    if (src.match(regexes.ext)) {

                        dimensions = get_image_dimersions_external(src, tag);

                    }else{

                        var imgpath = path.replace(/[^\/]+$/, '') + src;
                        dimensions = get_image_dimensions(fs.readFileSync(imgpath), tag);

                    }

                    resolved.push(dimensions);

                });

                Q.all(resolved).then(function(response){

                    response.forEach(function(res){

                        var replacement = res.tag.replace(/^<img/, "<img width=\"" + res.dimensions.width + "\" height=\"" + res.dimensions.height + "\"");
                        contents = contents.replace(res.tag, replacement);

                        grunt.file.write(path, contents, fileOptions);

                    });

                }).done(function(){
                    done();
                });


            });
        });
    });

};
