'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultOptions = undefined;
exports.transformImportsInline = transformImportsInline;

var _path = require('path');

var _transform = require('./transform');

var _transform2 = _interopRequireDefault(_transform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = exports.defaultOptions = {
  name: '[hash].[ext]',
  outputPath: '/public',
  publicPath: '/public',
  context: '',
  extensions: ['gif', 'jpeg', 'jpg', 'png', 'svg'],
  limit: 0
};

var getVariableName = function getVariableName(p) {
  if (p.node.specifiers && p.node.specifiers[0] && p.node.specifiers[0].local) {
    return p.node.specifiers[0].local.name;
  }
};

var applyTransform = function applyTransform(p, t, state, value, calleeName) {
  var ext = (0, _path.extname)(value);
  var options = Object.assign({}, defaultOptions, state.opts);

  if (options.extensions && options.extensions.indexOf(ext.slice(1)) >= 0) {
    try {
      // const rootPath = state.file.opts.sourceRoot || process.cwd()
      var rootPath = process.cwd() + options.context;

      console.log('sourceRoot is');
      console.log(state.file.opts.sourceRoot);
      console.log('rootPath is');
      console.log(rootPath);
      console.log('process.cwd is');
      console.log(process.cwd());
      console.log('NODE_PATH is');
      console.log(process.env.NODE_PATH);
      var scriptDirectory = (0, _path.dirname)((0, _path.resolve)(state.file.opts.filename));
      var filePath = (0, _path.resolve)(scriptDirectory, value);

      var uri = (0, _transform2.default)(rootPath, filePath, options);

      if (calleeName === 'require') {
        p.replaceWith(t.StringLiteral(uri));
        return;
      }

      var variableName = getVariableName(p);

      if (!variableName) {
        throw new Error('Cannot determine variable name to assign to');
      }

      p.replaceWith(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(variableName), t.stringLiteral(uri))]));
    } catch (e) {
      throw p.buildCodeFrameError(e.message);
    }
  }
};

function transformImportsInline(_ref) {
  var t = _ref.types;

  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(p, state) {
        applyTransform(p, t, state, p.node.source.value, 'import');
      },
      CallExpression: function CallExpression(p, state) {
        var callee = p.get('callee');
        if (!callee.isIdentifier() || !callee.equals('name', 'require')) {
          return;
        }

        var arg = p.get('arguments')[0];
        if (!arg || !arg.isStringLiteral()) {
          return;
        }

        applyTransform(p, t, state, arg.node.value, 'require');
      }
    }
  };
}

exports.default = transformImportsInline;