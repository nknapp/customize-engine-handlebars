module.exports = {
  helper1: function (abc) {
    return 'helper1(' + abc + ')'
  },
  thisOptionsHelper: function (abc, options) {
    return this.name + abc
  },
  targetFile: function (options) {
    return options.customize.targetFile
  }
}
