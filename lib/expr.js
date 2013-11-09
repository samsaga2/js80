function inferenceLabel(label, environment, info) {
  if(label[0] === '.') {
    label = info.label + label;
  }
  if(label in environment) {
    return label;
  }
  if(info.module && label.split('.').length < 2) {
    label = info.module + '.' + label;
  }
  return label;
}

module.exports = {
  inferenceLabel: inferenceLabel
};