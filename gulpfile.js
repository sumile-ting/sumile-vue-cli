const { src, dest } = require('gulp');

function streamTask() {
  return src('./src/**')
    .pipe(dest('build'));
}

exports.default = streamTask;