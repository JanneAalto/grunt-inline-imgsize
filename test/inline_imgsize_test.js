var grunt = require('grunt');

exports.inlineImgSize = {
    images: function(test) {
        test.expect(8);

        var images = grunt.file.read('tmp/images.html');
        test.ok(images.match(/<img width="100" height="100" src="assets\/sartak.jpg" alt="avatar">/), 'inline jpg size');
        test.ok(images.match(/<img width="100" height="100" src="assets\/sartak.jpg" alt="autoclosed" \/>/), 'inline jpg size');
        test.ok(images.match(/<img width="100" height="100" src="assets\/sartak.gif" alt="gif">/), 'inline gif size');
        test.ok(images.match(/<img width="100" height="100" src="assets\/sartak.png" alt="png">/), 'inline png size');


        test.ok(images.match(/<img src="assets\/sartak.jpg" alt="retina" width="50" height="50">/), 'did not overwrite manually-specified size');
        test.ok(images.match(/<img width="50" src="assets\/sartak.jpg" alt="width">/), 'did not overwrite manually-specified size');
        test.ok(images.match(/<img src="assets\/sartak.jpg" height=50 alt="height">/), 'did not overwrite manually-specified size');
        test.ok(images.match(/<img width="300" height="110" src="http:\/\/www.google.com\/images\/errors\/logo_sm_2_hr.png" alt="remote">/), 'did not inline size for remote image');

        test.done();
    }
};
